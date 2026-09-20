import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CLUB_EMAIL, formatEuros } from "@/lib/constants";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Règlement intérieur — Banat Sport Club",
};

const SPIRIT = [
  "On respecte les autres.",
  "On s’encourage.",
  "On ne se moque pas.",
  "On ne juge pas.",
  "On arrive à l’heure.",
  "On s’entraide.",
  "On écoute les consignes.",
  "On pose son téléphone.",
  "On profite du moment.",
];

const OUTFIT = [
  "Haut de sport à manches",
  "Bas de survêtement",
  "Chaussures de sport propres",
  "Bouteille d’eau",
  "Serviette",
];

export default async function ReglementPage() {
  const { season, annualFeeCents, groups } = await getSiteSettings();

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
          Règlement intérieur
        </h1>
        <p className="mt-2 text-brand-dark/70">Saison {season}</p>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-dark">1. Objet du club</h2>
          <p className="mt-3 leading-relaxed text-brand-dark/80">
            Banat Sport Club est une association multisport loisir féminine
            basée à Montpellier. Le club accueille des filles de la 6e à la
            Terminale. Sa mission est de remettre en mouvement des jeunes filles
            qui ont décroché, par le sport plaisir, le collectif et la
            reconnexion à soi. Il ne s’agit pas d’un club de compétition.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-brand-dark">2. Créneaux</h2>
          <ul className="mt-3 space-y-2">
            {groups.map((group) => (
              <li key={group.key} className="text-brand-dark/80">
                <strong className="text-brand-dark">{group.day}</strong> —{" "}
                {group.time}, {group.place}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-brand-dark">
            3. Adhésion et cotisation
          </h2>
          <p className="mt-3 leading-relaxed text-brand-dark/80">
            La cotisation annuelle s’élève à {formatEuros(annualFeeCents)} par
            adhérente. Elle comprend l’accès aux séances de l’année,
            l’assurance, le kit BSC (sac, gourde, accessoires) et l’affiliation.
          </p>
          <p className="mt-3 leading-relaxed text-brand-dark/80">
            L’adhésion n’est définitivement validée qu’après réception du
            dossier complet et du règlement de la cotisation.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-brand-dark">4. L’esprit BSC</h2>
          <ul className="mt-3 space-y-2">
            {SPIRIT.map((rule) => (
              <li key={rule} className="flex gap-3 text-brand-dark/80">
                <span aria-hidden className="text-brand">
                  ✦
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-brand-dark">
            5. Téléphones et écrans
          </h2>
          <p className="mt-3 leading-relaxed text-brand-dark/80">
            Pendant les séances, les téléphones restent au vestiaire. Cette
            règle, résumée par la signature « Déconnexion — Reconnexion », permet
            aux adhérentes de profiter réellement du moment : sport, jeux,
            échanges et collectif.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-brand-dark">6. Tenue</h2>
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
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-brand-dark">7. Droit à l’image</h2>
          <p className="mt-3 leading-relaxed text-brand-dark/80">
            Le club peut être amené à prendre des photos ou vidéos pendant les
            activités. Ces images sont destinées à l’archivage interne et ne sont
            pas diffusées publiquement.
          </p>
          <p className="mt-3 leading-relaxed text-brand-dark/80">
            L’autorisation de droit à l’image est facultative. Un refus ne
            bloque pas l’inscription : l’adhérente participe normalement aux
            activités et est exclue des prises de vue.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-brand-dark">8. Contact</h2>
          <p className="mt-3 text-brand-dark/80">
            Pour toute question :{" "}
            <a href={`mailto:${CLUB_EMAIL}`} className="text-brand underline">
              {CLUB_EMAIL}
            </a>
          </p>
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
