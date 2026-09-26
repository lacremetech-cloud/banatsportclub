import Image from "next/image";
import Link from "next/link";

import { getAssociation } from "@/lib/settings";

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
 */
export function PageShell({
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
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-dark/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-bsc.png"
              alt=""
              width={512}
              height={512}
              priority
              className="h-9 w-9 shrink-0"
            />
            <span className="text-sm font-extrabold uppercase tracking-tight text-white sm:text-base">
              Banat Sport Club
            </span>
          </Link>
          <Link
            href="/#inscription"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-brand-dark"
          >
            Réserver sa place
          </Link>
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
              Club multisport féminin — Montpellier et Grabels. Association loi
              1901, N° RNA W343034172.
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
          </div>

          <nav className="grid gap-x-10 gap-y-2 text-sm text-brand-dark/75 sm:grid-cols-2">
            <Link href="/#inscription" className="font-semibold text-brand hover:underline">
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
