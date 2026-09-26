import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Section, VitrineFooter } from "@/components/vitrine/page-shell";
import { getAssociation } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Données personnelles — Banat Sport Club",
  description:
    "Quelles données Banat Sport Club collecte à l’inscription, pourquoi, où elles sont hébergées et comment les faire corriger ou supprimer.",
  robots: { index: false },
};

/**
 * Politique de confidentialité.
 *
 * Elle ne dit rien de plus que l'article 16 du règlement intérieur : mêmes
 * finalités, mêmes destinataires, même hébergeur. Le règlement reste le
 * document de référence ; cette page l'explique en clair, sans rien y ajouter
 * que le club ne se soit engagé à respecter.
 */
export default async function ConfidentialitePage() {
  const association = await getAssociation();

  return (
    <>
      <PageShell
        eyebrow="Données personnelles"
        title="Ce que nous collectons, et pourquoi"
        intro="Le strict nécessaire pour accueillir votre fille en séance et vous joindre. Rien n’est revendu, rien n’est transmis à des tiers en dehors de ce qui est écrit ici."
      >
        <Section title="Ce que nous collectons">
          <p>À l’inscription, le formulaire demande :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              l’identité de l’adhérente : prénom, nom, date de naissance, classe
              et établissement ;
            </li>
            <li>
              vos coordonnées de responsable légal : prénom, nom, téléphone,
              adresse électronique ;
            </li>
            <li>
              deux contacts à joindre en cas d’urgence, avec leur lien avec
              l’adhérente ;
            </li>
            <li>
              une déclaration de santé : allergies, traitement en cours et
              remarques utiles à l’encadrement — uniquement si vous avez
              quelque chose à signaler ;
            </li>
            <li>
              vos réponses aux autorisations : règlement intérieur, autorisation
              parentale, intervention en cas d’urgence, droit à l’image.
            </li>
          </ul>
          <p>
            Aucun certificat médical, aucune attestation d’assurance et aucune
            photo ne sont demandés ni conservés.
          </p>
        </Section>

        <Section title="À quoi elles servent">
          <p>
            Exclusivement à la gestion de l’association et à la communication
            avec les familles : constituer le dossier d’inscription, faire
            l’appel, vous prévenir en cas d’absence ou de changement de
            planning, suivre la cotisation, et joindre la bonne personne si
            votre fille se blesse pendant une séance.
          </p>
          <p>
            Les informations de santé ne sont vues que par le bureau et
            l’encadrement. Elles ne figurent dans aucun export ni dans aucun
            courriel.
          </p>
        </Section>

        <Section title="Où elles sont hébergées">
          <p>
            Les inscriptions, les paiements et la comptabilité sont gérés sur la
            plateforme <strong>AssoConnect</strong>, qui héberge les données
            correspondantes. Le paiement est traité par son prestataire : le
            club ne voit ni ne conserve votre numéro de carte.
          </p>
          <p>
            Pour les adhérentes inscrites au créneau du dimanche, les données
            nécessaires à la licence loisir — nom, prénom, date de naissance —
            sont transmises au club partenaire, le Football Club de Grabels, et
            servent uniquement à cela.
          </p>
        </Section>

        <Section title="Combien de temps nous les gardons">
          <p>
            Le temps de l’adhésion, puis la durée nécessaire aux obligations
            comptables de l’association. Une famille qui ne réadhère pas peut
            demander la suppression de son dossier à tout moment.
          </p>
        </Section>

        <Section title="Vos droits">
          <p>
            Conformément au RGPD, vous pouvez demander l’accès à vos données,
            leur rectification ou leur suppression. Une seule adresse pour
            cela :{" "}
            <a href={`mailto:${association.email}`} className="text-brand underline">
              {association.email}
            </a>
            . Nous répondons dans un délai d’un mois.
          </p>
          <p>
            Refuser le droit à l’image n’a aucune conséquence sur l’inscription :
            l’adhérente participe normalement et est exclue des prises de vue.
          </p>
        </Section>

        <Section title="Traceurs">
          <p>
            Ce site ne dépose aucun cookie publicitaire et ne fait aucun suivi
            d’audience. Le formulaire d’inscription affiché sur la page d’accueil
            est fourni par AssoConnect et suit sa propre politique.
          </p>
        </Section>

        <p className="mt-12 text-sm text-brand-dark/60">
          Ces engagements reprennent l’article 16 du{" "}
          <Link href="/reglement" className="text-brand underline">
            règlement intérieur
          </Link>
          , qui reste le document de référence.
        </p>
      </PageShell>

      <VitrineFooter />
    </>
  );
}
