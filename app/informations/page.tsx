import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  CLUB_EMAIL,
  PREFERRED_PAYMENT_METHODS,
  PREFERRED_PAYMENT_METHOD_LABELS,
  formatEuros,
} from "@/lib/constants";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const OUTFIT = [
  "Haut de sport à manches",
  "Bas de survêtement",
  "Chaussures de sport propres",
  "Bouteille d’eau",
  "Serviette",
];

const ESSENTIAL_RULES = [
  "Téléphones laissés au vestiaire",
  "Respect des encadrantes",
  "Respect des autres adhérentes",
  "Zéro moquerie",
  "Zéro exclusion",
  "Zéro jugement",
  "Ponctualité",
  "Respect des consignes",
  "Participation active",
];

export default async function InformationsPage() {
  const { season, annualFeeCents, groups } = await getSiteSettings();

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
          Informations pratiques
        </h1>
        <p className="mt-3 text-brand-dark/75">
          Tout ce qu’il faut savoir avant de rejoindre le club.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-dark">Les créneaux</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <div key={group.key} className="card">
                <p className="text-lg font-extrabold uppercase tracking-tight text-brand-dark">
                  {group.day}
                </p>
                <p className="mt-2 font-semibold text-brand">{group.time}</p>
                <p className="mt-1 text-brand-dark/70">{group.place}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-dark">La saison {season}</h2>
          <dl className="card mt-4 space-y-4">
            <div>
              <dt className="font-semibold text-brand-dark">Public</dt>
              <dd className="text-brand-dark/75">
                Filles de la 6e à la Terminale — collégiennes et lycéennes.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-dark">Cotisation annuelle</dt>
              <dd className="text-brand-dark/75">
                {formatEuros(annualFeeCents)} par adhérente, pour la saison
                complète. Elle comprend l’accès aux séances de l’année,
                l’assurance, le kit BSC (sac, gourde, accessoires) et
                l’affiliation.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-dark">Moyens de paiement</dt>
              <dd className="text-brand-dark/75">
                {PREFERRED_PAYMENT_METHODS.map(
                  (method) => PREFERRED_PAYMENT_METHOD_LABELS[method],
                ).join(", ")}
                .
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-dark">Contact</dt>
              <dd>
                <a href={`mailto:${CLUB_EMAIL}`} className="text-brand underline">
                  {CLUB_EMAIL}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-dark">Avant de venir</h2>

          <div className="card mt-4">
            <h3 className="font-semibold text-brand-dark">Tenue attendue</h3>
            <ul className="mt-3 space-y-2">
              {OUTFIT.map((item) => (
                <li key={item} className="flex gap-3 text-brand-dark/80">
                  <span aria-hidden className="text-brand">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card mt-4">
            <h3 className="font-semibold text-brand-dark">Règles essentielles</h3>
            <ul className="mt-3 space-y-2">
              {ESSENTIAL_RULES.map((rule) => (
                <li key={rule} className="flex gap-3 text-brand-dark/80">
                  <span aria-hidden className="text-brand">
                    ✦
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-brand-dark/70">
              Le détail complet figure dans le{" "}
              <Link href="/reglement" className="text-brand underline">
                règlement intérieur
              </Link>
              .
            </p>
          </div>
        </section>

        <div className="mt-10">
          <Link href="/inscription" className="btn w-full sm:w-auto">
            S’inscrire au club
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
