import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Section, VitrineFooter } from "@/components/vitrine/page-shell";
import { ADHESION_URL } from "@/lib/adhesion";
import { formatEuros } from "@/lib/constants";
import { getAssociation, getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conditions d’adhésion — Banat Sport Club",
  description:
    "Ce que comprend l’adhésion à Banat Sport Club, comment elle se règle, sa durée et les conditions de remboursement.",
  robots: { index: false },
};

/**
 * Conditions générales d'adhésion.
 *
 * Tout ce qui est écrit ici vient du règlement intérieur ou des réglages du
 * club : durée de l'adhésion, montant, absence de remboursement, dossier
 * complet. Rien n'est inventé, et aucune clause n'est plus stricte que le
 * règlement — sinon deux documents diraient deux choses différentes, et c'est
 * toujours la famille qui en pâtirait.
 *
 * Le paiement se fait chez AssoConnect : le droit de rétractation du code de
 * la consommation ne s'applique pas ici (il vise les contrats conclus entre un
 * professionnel et un consommateur), et on ne le mentionne donc pas pour ne
 * pas laisser croire à un droit qui n'existe pas dans ce cadre. Les conditions
 * de remboursement de l'article 3 du règlement font foi.
 */
export default async function ConditionsPage() {
  const [{ season, annualFeeCents }, association] = await Promise.all([
    getSiteSettings(),
    getAssociation(),
  ]);

  return (
    <>
      <PageShell
        eyebrow={`Saison ${season}`}
        title="Conditions d’adhésion"
        intro="Ce que comprend l’adhésion, comment elle se règle, et ce qui se passe en cas d’imprévu."
      >
        <Section title="Objet">
          <p>
            L’adhésion à {association.name} donne accès aux séances
            hebdomadaires du créneau attribué, pour la saison {season}. Elle est
            souscrite par le représentant légal de l’adhérente mineure.
          </p>
        </Section>

        <Section title="Durée">
          <p>
            L’adhésion est annuelle et valable du 1<sup>er</sup> septembre 2026
            au 31 août 2027. Les séances régulières ont lieu jusqu’au 20 juin
            2027, hors vacances scolaires.
          </p>
        </Section>

        <Section title="Montant et ce qu’il comprend">
          <p>
            Cotisation annuelle :{" "}
            <strong className="text-brand-dark">
              {formatEuros(annualFeeCents)}
            </strong>
            . Elle comprend l’accès à toutes les séances de la saison,
            l’encadrement et l’assurance responsabilité civile de l’association.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Pour la saison {season}, le kit BSC — sac, gourde, accessoires —
              est offert à chaque adhérente.
            </li>
            <li>
              D’autres activités peuvent être proposées pendant l’année, les
              vacances et l’été ; leurs conditions sont communiquées le moment
              venu et certaines peuvent demander une participation
              complémentaire.
            </li>
          </ul>
        </Section>

        <Section title="Inscription et paiement">
          <p>
            L’inscription se fait en ligne, sur le formulaire hébergé par{" "}
            <a
              href={ADHESION_URL}
              target="_blank"
              rel="noreferrer"
              className="text-brand underline"
            >
              AssoConnect
            </a>
            . Le paiement est traité par la plateforme et son prestataire : le
            club ne voit ni ne conserve vos données bancaires.
          </p>
          <p>
            Le paiement en ligne se fait uniquement par carte bancaire, en une
            ou plusieurs fois. Pour un règlement par chèque ou en espèces,
            contactez le club afin de convenir d’un rendez-vous : le dossier est
            alors complété et réglé en présentiel.
          </p>
          <p>
            L’adhésion est validée après réception du dossier complet et du
            règlement de la cotisation. Aucune adhérente n’est autorisée à
            participer aux séances sans dossier complet.
          </p>
        </Section>

        <Section title="Séance d’essai">
          <p>
            Une séance d’essai gratuite peut être proposée avant de s’inscrire.
            L’autorisation parentale et la fiche sanitaire restent obligatoires
            pour y participer.
          </p>
        </Section>

        <Section title="Remboursement">
          <p>
            Aucun remboursement n’est effectué en cas d’abandon en cours
            d’année, sauf cas exceptionnel examiné par le Bureau. Si votre
            situation le justifie, écrivez-nous : chaque demande est regardée.
          </p>
        </Section>

        <Section title="Annulation d’une séance">
          <p>
            Le planning peut évoluer en cours d’année ; les familles en sont
            informées à l’avance. En cas de conditions météorologiques
            défavorables, une séance en extérieur peut être annulée et les
            familles sont prévenues par message.
          </p>
        </Section>

        <Section title="Engagements de l’adhérente et de sa famille">
          <p>
            L’acceptation du règlement intérieur est une condition de
            l’adhésion. Il fixe la tenue, les règles de sécurité, le
            comportement attendu, les absences et les sanctions possibles.
          </p>
          <p>
            L’association décline toute responsabilité en cas de perte ou de vol
            d’effets personnels. Les parents sont responsables de
            l’acheminement de leur enfant avant et après les séances.
          </p>
        </Section>

        <Section title="Assurance">
          <p>
            L’association est couverte par une assurance responsabilité civile.
            Il est recommandé aux familles de souscrire une assurance
            individuelle accident complémentaire, souvent incluse dans
            l’assurance scolaire ou extrascolaire.
          </p>
        </Section>

        <Section title="Réclamation">
          <p>
            Pour toute question ou réclamation :{" "}
            <a href={`mailto:${association.email}`} className="text-brand underline">
              {association.email}
            </a>
            {association.phone && (
              <>
                {" ou "}
                <a
                  href={`tel:${association.phone.replace(/\s/g, "")}`}
                  className="text-brand underline"
                >
                  {association.phone}
                </a>
              </>
            )}
            .
          </p>
        </Section>

        <p className="mt-12 text-sm text-brand-dark/60">
          Ces conditions reprennent le{" "}
          <Link href="/reglement" className="text-brand underline">
            règlement intérieur
          </Link>
          , qui reste le document de référence en cas de divergence.
        </p>
      </PageShell>

      <VitrineFooter />
    </>
  );
}
