import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { formatEuros } from "@/lib/constants";
import { getAnnualFeeCents, getSeason } from "@/lib/settings";

import { RegistrationForm } from "./registration-form";

export const dynamic = "force-dynamic";

export default async function InscriptionPage() {
  const [season, feeCents] = await Promise.all([getSeason(), getAnnualFeeCents()]);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold text-brand-dark">Inscription</h1>
        <p className="mt-3 text-brand-dark/80">
          Saison {season} — cotisation annuelle {formatEuros(feeCents)}. Le
          paiement se fait après validation de l&apos;inscription par le bureau.
        </p>

        <div className="mt-8">
          <RegistrationForm />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
