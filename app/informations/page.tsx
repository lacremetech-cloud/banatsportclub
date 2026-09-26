import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Section, VitrineFooter } from "@/components/vitrine/page-shell";
import { formatEuros } from "@/lib/constants";
import { getAssociation, getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Informations pratiques — Banat Sport Club",
  description:
    "Horaires, lieux, tenue, cotisation et fonctionnement des séances de Banat Sport Club, à Montpellier et Grabels.",
};

/** Ce que chaque lieu a de particulier, en une phrase utile. */
const LIEUX: Record<string, string> = {
  jeudi: "Plus de 200 m² de tatamis, en salle.",
  dimanche: "Un stade en plein air, terrain complet.",
};

const TENUE = [
  "Haut de sport à manches (t-shirt, sweat, pull…)",
  "Bas de survêtement",
  "Chaussures de sport propres",
  "Bouteille d’eau et serviette",
];

const AVANT_LA_SEANCE = [
  "Retirer ses bijoux : bagues, boucles d’oreilles, colliers, bracelets.",
  "S’attacher les cheveux.",
  "Signaler à l’encadrante tout problème de santé ou blessure.",
];

export default async function InformationsPage() {
  const [{ season, annualFeeCents, groups }, association] = await Promise.all([
    getSiteSettings(),
    getAssociation(),
  ]);

  return (
    <>
      <PageShell
        eyebrow={`Saison ${season}`}
        title="Informations pratiques"
        intro="Les horaires, les lieux, la tenue à prévoir et le fonctionnement des séances."
      >
        <Section title="Les créneaux">
          <p>
            Deux créneaux ouvrent cette saison, un par tranche d’âge. Votre
            fille suit celui qui correspond à sa classe — une séance par
            semaine. En 3e, elle peut choisir l’un ou l’autre.
          </p>
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group.key}
                className="rounded-2xl border border-brand-light/50 bg-white p-5"
              >
                <p className="text-lg font-extrabold uppercase tracking-tight text-brand-dark">
                  {group.day}
                </p>
                <p className="mt-1 text-xl font-bold text-brand">{group.time}</p>
                <p className="mt-2 inline-flex rounded-full bg-brand-light/25 px-3 py-1 text-sm font-bold text-brand-dark">
                  Pour les {group.levels}
                </p>
                <p className="mt-3 font-semibold text-brand-dark">{group.place}</p>
                <a
                  href={group.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-brand underline"
                >
                  {group.address} — itinéraire
                </a>
                {LIEUX[group.key] && (
                  <p className="mt-3 text-sm text-brand-dark/70">
                    {LIEUX[group.key]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-brand-dark/70">
            Les séances régulières ont lieu jusqu’au 20 juin 2027, hors vacances
            scolaires. Des activités ponctuelles peuvent être proposées pendant
            les vacances.
          </p>
        </Section>

        <Section title="La cotisation">
          <p>
            <strong className="text-brand-dark">
              {formatEuros(annualFeeCents)}
            </strong>{" "}
            pour la saison complète. Elle comprend l’accès à toutes les séances,
            l’encadrement et l’assurance responsabilité civile de l’association.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Pour cette première saison, le kit BSC — sac, gourde, accessoires
              — est offert.
            </li>
            <li>
              Les adhérentes du créneau du dimanche bénéficient d’une licence
              loisir au club partenaire, le Football Club de Grabels, incluse
              dans la cotisation.
            </li>
          </ul>
          <p>
            L’inscription et le paiement se font en ligne depuis{" "}
            <Link href="/#inscription" className="text-brand underline">
              la page d’accueil
            </Link>
            . Le détail figure dans les{" "}
            <Link href="/conditions" className="text-brand underline">
              conditions d’adhésion
            </Link>
            .
          </p>
        </Section>

        <Section title="La tenue à prévoir">
          <ul className="space-y-1.5">
            {TENUE.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden className="mt-0.5 font-bold text-brand">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-brand-dark/70">
            Une tenue propre est attendue à chaque séance.
          </p>
        </Section>

        <Section title="Avant chaque séance">
          <ul className="space-y-1.5">
            {AVANT_LA_SEANCE.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden className="mt-0.5 text-brand">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Absences et communication">
          <p>
            Un appel est fait au début de chaque séance, et vous recevez un
            message si votre fille est absente. Si vous savez à l’avance qu’elle
            ne viendra pas, prévenez l’encadrante.
          </p>
          <p>
            Un groupe de communication dédié aux parents transmet les
            informations régulières : planning, événements, changements. En cas
            de météo défavorable, l’annulation d’une séance en extérieur y est
            annoncée.
          </p>
        </Section>

        <Section title="Les téléphones">
          <p>
            Les téléphones restent au vestiaire pendant toute la durée de la
            séance. Ce n’est pas une punition : c’est ce qui fait qu’elles sont
            vraiment là.
          </p>
        </Section>

        <Section title="Une question ?">
          <p>
            Écrivez-nous à{" "}
            <a href={`mailto:${association.email}`} className="text-brand underline">
              {association.email}
            </a>
            {association.phone && (
              <>
                {" ou appelez le "}
                <a
                  href={`tel:${association.phone.replace(/\s/g, "")}`}
                  className="text-brand underline"
                >
                  {association.phone}
                </a>
              </>
            )}
            . Une séance d’essai gratuite peut être proposée avant de
            s’inscrire.
          </p>
        </Section>

        <p className="mt-12 text-sm text-brand-dark/60">
          Le détail complet figure dans le{" "}
          <Link href="/reglement" className="text-brand underline">
            règlement intérieur
          </Link>
          .
        </p>
      </PageShell>

      <VitrineFooter />
    </>
  );
}
