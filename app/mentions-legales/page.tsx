import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Section, VitrineFooter } from "@/components/vitrine/page-shell";
import { getAssociation } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentions légales — Banat Sport Club",
  description:
    "Éditeur, hébergement et contact du site de Banat Sport Club, association loi 1901.",
  robots: { index: false },
};

/**
 * Mentions légales.
 *
 * Deux informations obligatoires ne figurent dans aucun document dont dispose
 * le code : le siège social et le directeur de publication. Elles se saisissent
 * depuis l'espace bureau ; tant qu'elles sont vides, la ligne est simplement
 * absente. Inventer une adresse sur une page légale serait pire que de ne rien
 * afficher.
 */
export default async function MentionsLegalesPage() {
  const association = await getAssociation();

  return (
    <>
      <PageShell
        eyebrow="Informations légales"
        title="Mentions légales"
        intro="Qui édite ce site, où il est hébergé, et comment nous joindre."
      >
        <Section title="Éditeur du site">
          <p>
            <strong className="text-brand-dark">{association.name}</strong>,
            association régie par la loi du 1<sup>er</sup> juillet 1901.
          </p>
          <ul className="space-y-1">
            <li>Numéro RNA : W343034172</li>
            {association.address && <li>Siège social : {association.address}</li>}
            {association.publisher && (
              <li>Directrice de la publication : {association.publisher}</li>
            )}
            <li>
              Courriel :{" "}
              <a
                href={`mailto:${association.email}`}
                className="text-brand underline"
              >
                {association.email}
              </a>
            </li>
            {association.phone && (
              <li>
                Téléphone :{" "}
                <a
                  href={`tel:${association.phone.replace(/\s/g, "")}`}
                  className="text-brand underline"
                >
                  {association.phone}
                </a>
              </li>
            )}
          </ul>
        </Section>

        <Section title="Hébergement">
          <p>
            Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave
            #4133, Walnut, CA 91789, États-Unis —{" "}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
              className="text-brand underline"
            >
              vercel.com
            </a>
            .
          </p>
          <p>
            Les inscriptions, les paiements et la comptabilité de l’association
            sont gérés sur la plateforme <strong>AssoConnect</strong>, qui
            héberge les données correspondantes.
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            Le nom, le logo et les contenus de ce site appartiennent à{" "}
            {association.name}. Leur reproduction, même partielle, est soumise à
            autorisation préalable.
          </p>
        </Section>

        <Section title="Photos et vidéos">
          <p>
            Aucune image d’adhérente n’est publiée sur ce site ni sur les
            réseaux sociaux. Conformément à l’article 15 du règlement intérieur,
            les photos et vidéos prises pendant les séances servent uniquement à
            l’archivage interne, et une adhérente dont la famille a refusé le
            droit à l’image est exclue des prises de vue.
          </p>
        </Section>

        <Section title="Signaler une erreur">
          <p>
            Une information inexacte sur ce site ? Écrivez-nous à{" "}
            <a
              href={`mailto:${association.email}`}
              className="text-brand underline"
            >
              {association.email}
            </a>{" "}
            et nous la corrigerons.
          </p>
        </Section>

        <p className="mt-12 text-sm text-brand-dark/60">
          Voir aussi :{" "}
          <Link href="/confidentialite" className="text-brand underline">
            données personnelles
          </Link>{" "}
          et{" "}
          <Link href="/conditions" className="text-brand underline">
            conditions d’adhésion
          </Link>
          .
        </p>
      </PageShell>

      <VitrineFooter />
    </>
  );
}
