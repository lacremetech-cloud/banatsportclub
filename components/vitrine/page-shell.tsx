import Image from "next/image";
import Link from "next/link";

import { mapsUrl, RENDEZ_VOUS, RENDEZ_VOUS_FULL } from "@/lib/constants";
import { getAssociation } from "@/lib/settings";

/**
 * Combiné téléphonique, en SVG plutôt qu'en émoji.
 *
 * L'émoji 📞 se dessine en vert sombre chez la plupart des polices : sur
 * l'en-tête framboise, il faisait une tache peu lisible. Un tracé en
 * `currentColor` prend la couleur du bouton qui le porte, quel que soit le
 * fond.
 */
export function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      focusable="false"
      className={className}
    >
      <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

/**
 * Coquille des pages secondaires : informations, règlement, pages légales.
 *
 * Elle reprend l'en-tête sombre et le bouton unique de l'accueil, pour que le
 * site tienne d'un seul tenant. L'ancien en-tête clair (`components/site-header`)
 * appartient à la première version du site et n'est plus utilisé nulle part
 * côté public.
 *
 * Contrairement à l'accueil, ces pages portent un bouton « Retour à l'accueil » :
 * on y arrive par un lien du pied de page, et il faut pouvoir en repartir.
 *
 * Composant asynchrone : l'en-tête affiche le téléphone du club, qui vient des
 * réglages. Il est lu ici plutôt que passé par chaque page — cinq pages
 * auraient eu à le transmettre pour la même chose.
 */
export async function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  const association = await getAssociation();
  const phoneHref = association.phone?.replace(/\s/g, "");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-dark/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-bsc.png"
              alt=""
              width={512}
              height={512}
              priority
              className="h-9 w-9 shrink-0"
            />
            <span className="text-sm font-extrabold uppercase tracking-tight text-white max-[379px]:hidden sm:text-base">
              Banat Sport Club
            </span>
          </Link>
          {/*
            Le téléphone à côté du bouton d'inscription, comme sur l'accueil :
            une famille qui lit le règlement ou les conditions est souvent
            celle qui a une question. `tel:` compose directement.
          */}
          <div className="flex shrink-0 items-center gap-2">
            {phoneHref && (
              <a
                href={`tel:${phoneHref}`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/30 px-2.5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-4"
              >
                <PhoneIcon />
                <span className="hidden sm:inline">{association.phone}</span>
                <span className="sr-only sm:hidden">Nous appeler</span>
              </a>
            )}
            <Link
              href="/#adherer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-brand-dark sm:px-5"
            >
              Réserver sa place
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-brand-light/40 bg-brand-dark py-14 text-white sm:py-16">
          <div className="mx-auto max-w-4xl px-5">
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-light">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
              {title}
            </h1>
            {intro && (
              <div className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
                {intro}
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-5 py-12 sm:py-16">{children}</div>
      </main>
    </>
  );
}

/** Titre de section, pour les pages de texte. */
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-bold tracking-tight text-brand-dark sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-brand-dark/80">
        {children}
      </div>
    </section>
  );
}

/**
 * Pied de page du site public.
 *
 * Il ne mène qu'à des pages de la version actuelle : aucune trace de la
 * première mouture du site. « Espace bureau » reste, c'est l'entrée de
 * l'administration du club et non une page publique.
 */
export async function VitrineFooter() {
  const association = await getAssociation();
  const phoneHref = association.phone?.replace(/\s/g, "");

  return (
    <footer className="border-t border-brand-light/40 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/logo-bsc.png"
                alt=""
                width={512}
                height={512}
                className="h-12 w-12 shrink-0"
              />
              <div>
                <p className="text-base font-extrabold uppercase tracking-tight text-brand-dark">
                  {association.name}
                </p>
                <p className="text-brand">Remettre les filles en jeu</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-brand-dark/70">
              Club multisport féminin — Montpellier. Association loi 1901,
              N° RNA W343034172.
            </p>
            <p className="mt-3 text-sm text-brand-dark/70">
              {phoneHref && (
                <>
                  <a href={`tel:${phoneHref}`} className="hover:underline">
                    {association.phone}
                  </a>
                  {" · "}
                </>
              )}
              <a href={`mailto:${association.email}`} className="hover:underline">
                {association.email}
              </a>
            </p>

            {/*
              L'adresse du bureau, en bas de chaque page.

              Elle est annoncée comme ce qu'elle est — le lieu où l'on reçoit
              sur rendez-vous — et non comme un lieu d'entraînement : les deux
              gymnases ont leurs propres adresses, plus haut. Rien n'affirme
              non plus que ce soit le siège social, tant que ce n'est pas
              confirmé.
            */}
            <p className="mt-3 text-sm text-brand-dark/70">
              Sur rendez-vous :{" "}
              <a
                href={mapsUrl(RENDEZ_VOUS.place, RENDEZ_VOUS.address)}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {RENDEZ_VOUS_FULL}
              </a>
            </p>
          </div>

          <nav className="grid gap-x-10 gap-y-2 text-sm text-brand-dark/75 sm:grid-cols-2">
            <Link href="/#adherer" className="font-semibold text-brand hover:underline">
              Réserver sa place
            </Link>
            <Link href="/informations" className="hover:underline">
              Informations pratiques
            </Link>
            <Link href="/reglement" className="hover:underline">
              Règlement intérieur
            </Link>
            <Link href="/conditions" className="hover:underline">
              Conditions d’adhésion
            </Link>
            <Link href="/confidentialite" className="hover:underline">
              Données personnelles
            </Link>
            <Link href="/mentions-legales" className="hover:underline">
              Mentions légales
            </Link>
            <Link href="/admin" className="hover:underline">
              Espace bureau
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
