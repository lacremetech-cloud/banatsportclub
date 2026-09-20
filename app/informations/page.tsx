import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { GROUPS, formatEuros } from "@/lib/constants";
import { getAnnualFeeCents, getSeason } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function InformationsPage() {
  const [season, feeCents] = await Promise.all([getSeason(), getAnnualFeeCents()]);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="text-3xl font-bold text-brand-dark">Informations pratiques</h1>

        <section className="mt-8 grid gap-5 sm:grid-cols-2">
          {Object.entries(GROUPS).map(([key, group]) => (
            <div key={key} className="card">
              <h2 className="text-lg font-semibold text-brand-dark">
                Groupe {group.label}
              </h2>
              <p className="mt-2 text-brand">{group.schedule}</p>
              <p className="mt-1 text-brand-dark/70">{group.place}</p>
            </div>
          ))}
        </section>

        <section className="card mt-5">
          <h2 className="text-lg font-semibold text-brand-dark">Saison {season}</h2>
          <dl className="mt-4 space-y-3 text-brand-dark/80">
            <div>
              <dt className="font-medium text-brand-dark">Cotisation annuelle</dt>
              <dd>{formatEuros(feeCents)} pour la saison complète.</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-dark">Public</dt>
              <dd>Collégiennes et lycéennes, de la 6e à la Terminale.</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-dark">Moyens de paiement</dt>
              <dd>Carte bancaire, virement, chèque ou espèces.</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-dark">Documents à fournir</dt>
              <dd>
                Autorisation parentale signée et certificat médical de non
                contre-indication à la pratique sportive.
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-8">
          <Link href="/inscription" className="btn">
            Inscrire mon enfant
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
