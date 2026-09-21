import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { GROUP_NAMES, type GroupName } from "@/lib/constants";
import { getAssociation, getBankDetails, getSiteSettings } from "@/lib/settings";

import { RegistrationWizard } from "./registration-wizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inscription — Banat Sport Club",
};

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ creneau?: string }>;
}) {
  const { creneau } = await searchParams;
  const [{ season, annualFeeCents, groups }, bank, association] = await Promise.all([
    getSiteSettings(),
    getBankDetails(),
    getAssociation(),
  ]);

  // Créneau présélectionné depuis les cartes de la page d'accueil.
  const defaultGroup = GROUP_NAMES.includes(creneau as GroupName) ? creneau! : "";

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <RegistrationWizard
          groups={groups}
          season={season}
          annualFeeCents={annualFeeCents}
          defaultGroup={defaultGroup}
          bank={bank}
          clubPhone={association.phone}
        />
      </main>

      <SiteFooter />
    </>
  );
}
