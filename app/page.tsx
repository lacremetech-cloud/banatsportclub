import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { GROUPS } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-5">
        <section className="py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Montpellier
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-brand-dark sm:text-5xl">
            Le sport pour toutes,
            <br />
            de la 6<sup>e</sup> à la Terminale.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-brand-dark/80">
            Banat Sport Club est une association sportive féminine qui accueille
            collégiennes et lycéennes deux fois par semaine, dans une ambiance
            bienveillante et encadrée.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/inscription" className="btn">
              S&apos;inscrire
            </Link>
            <Link href="/informations" className="btn-ghost">
              Informations pratiques
            </Link>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          {Object.entries(GROUPS).map(([key, group]) => (
            <div key={key} className="card">
              <h2 className="text-xl font-semibold text-brand-dark">
                Groupe {group.label}
              </h2>
              <p className="mt-2 text-brand">{group.schedule}</p>
              <p className="mt-1 text-brand-dark/70">{group.place}</p>
            </div>
          ))}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
