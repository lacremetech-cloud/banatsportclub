"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Enveloppe qui fait apparaître les blocs au défilement.
 *
 * Le principe est inversé par rapport à l'habitude : la page est écrite
 * visible, et c'est ce composant qui, une fois monté, demande à masquer puis
 * révéler. Sans JavaScript — script bloqué, erreur d'hydratation, connexion
 * coupée — l'attribut n'est jamais posé, le CSS ne s'applique pas et toute la
 * vitrine reste lisible. Une animation ne doit jamais pouvoir effacer le
 * contenu.
 *
 * Un seul observateur pour toute la page : on ne crée pas un observateur par
 * bloc, et chaque élément est cessé d'être observé dès qu'il est apparu.
 */
export function Motion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const targets = Array.from(node.querySelectorAll<HTMLElement>("[data-reveal]"));

    // Réglage système : on n'orchestre rien, tout reste visible.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    node.setAttribute("data-reveal-ready", "");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).setAttribute("data-shown", "");
          observer.unobserve(entry.target);
        }
      },
      // Se déclenche un peu avant l'entrée réelle : le bloc finit son
      // apparition au moment où le regard arrive dessus.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    for (const target of targets) observer.observe(target);

    // Ce qui est déjà à l'écran au chargement ne doit pas attendre un défilement.
    requestAnimationFrame(() => {
      for (const target of targets) {
        if (target.getBoundingClientRect().top < window.innerHeight) {
          target.setAttribute("data-shown", "");
          observer.unobserve(target);
        }
      }
    });

    return () => observer.disconnect();
  }, []);

  return <div ref={root}>{children}</div>;
}

/** Fine barre de progression : repère de lecture, et un mouvement de plus. */
export function ScrollProgress() {
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setRatio(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0);
    };
    const onScroll = () => {
      // Une seule mesure par image : le défilement ne doit rien coûter.
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0.5 bg-transparent"
    >
      <div
        className="h-full bg-brand transition-[width] duration-150 ease-out"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

/**
 * Vidéo de fond, facultative.
 *
 * Le fichier n'est pas dans le dépôt : il n'y a aucune image ni vidéo du club
 * pour l'instant. Ce composant est donc conçu pour ne rien casser en son
 * absence — il reste totalement invisible tant que le navigateur n'a pas
 * confirmé pouvoir jouer la vidéo, et le fond animé en CSS reste visible en
 * dessous. Le jour où un fichier est déposé dans `public/videos/`, il apparaît
 * sans toucher au code.
 *
 * `muted` + `playsInline` sont indispensables : c'est la seule combinaison que
 * les mobiles acceptent de lire automatiquement.
 */
export function HeroVideo({ sources, poster }: { sources: string[]; poster?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = video.current;
    if (!node) return;
    const onReady = () => setReady(true);
    node.addEventListener("canplay", onReady);
    // Si la source est déjà en cache, l'évènement a pu passer avant l'écoute.
    if (node.readyState >= 3) setReady(true);
    return () => node.removeEventListener("canplay", onReady);
  }, []);

  return (
    <video
      ref={video}
      className="bsc-video absolute inset-0 h-full w-full object-cover"
      data-ready={ready ? "" : undefined}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      tabIndex={-1}
    >
      {sources.map((src) => (
        <source
          key={src}
          src={src}
          type={src.endsWith(".webm") ? "video/webm" : "video/mp4"}
        />
      ))}
    </video>
  );
}
