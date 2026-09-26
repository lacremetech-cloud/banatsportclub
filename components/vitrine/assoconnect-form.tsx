"use client";

import { useEffect, useRef, useState } from "react";

import {
  ADHESION_ALLOWED_ORIGINS,
  ADHESION_IFRAME_URL,
  ADHESION_URL,
} from "@/lib/adhesion";

/**
 * Formulaire d'adhésion AssoConnect, intégré dans la page.
 *
 * Deux points méritent l'attention :
 *
 * 1. **La hauteur.** Un iframe ne sait pas s'adapter à son contenu. AssoConnect
 *    publie donc sa hauteur par `postMessage` à chaque changement d'étape, et
 *    c'est à nous de l'appliquer. On ne fait confiance qu'aux deux origines
 *    connues : sans ce filtre, n'importe quelle page ouverte ailleurs pourrait
 *    envoyer le même message et redimensionner le cadre. On vérifie aussi que
 *    la valeur reçue est un nombre plausible — un message malformé ne doit pas
 *    réduire le formulaire à zéro pixel.
 *
 * 2. **La sortie de secours.** Un iframe peut être bloqué : bloqueur de
 *    contenu, navigation privée stricte, réseau d'entreprise. Le lien direct
 *    est donc toujours affiché, jamais conditionné au bon fonctionnement du
 *    cadre. Personne ne doit se retrouver devant un carré vide sans recours.
 *
 * Rien n'est saisi ni stocké de notre côté : la saisie et le paiement se font
 * entièrement chez AssoConnect.
 */
export function AssoConnectForm() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);
  const [slow, setSlow] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!ADHESION_ALLOWED_ORIGINS.includes(event.origin as never)) return;
      if (event.data?.action !== "iframe.height") return;

      const value = Number(event.data.height);
      // Bornes volontairement larges : on écarte seulement l'absurde.
      if (!Number.isFinite(value) || value < 300 || value > 20000) return;
      setHeight(value);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    // Au bout de 6 secondes sans chargement, on propose la sortie de secours
    // plus franchement plutôt que de laisser regarder un cadre vide.
    const timer = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="overflow-hidden rounded-3xl border border-brand-light/50 bg-white shadow-sm">
        {!loaded && (
          <div className="flex items-center gap-3 px-6 py-5 text-brand-dark/70">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand bsc-ping"
            />
            {slow
              ? "Le formulaire met du temps à s’afficher — vous pouvez l’ouvrir directement avec le bouton ci-dessous."
              : "Chargement du formulaire d’adhésion…"}
          </div>
        )}
        <iframe
          ref={frame}
          title="Formulaire d’adhésion Banat Sport Club"
          src={ADHESION_IFRAME_URL}
          onLoad={() => setLoaded(true)}
          allow="payment"
          scrolling="no"
          className="block w-full border-0"
          style={{ height }}
        />
      </div>

      <p className="mt-4 text-center text-sm text-brand-dark/70">
        Le formulaire et le paiement sont gérés par AssoConnect.{" "}
        <a
          href={ADHESION_URL}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand underline"
        >
          Ouvrir dans un nouvel onglet
        </a>
      </p>
    </div>
  );
}
