import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatEuros } from "@/lib/constants";
import { getPaymentSummary } from "@/lib/payments";

import { RetryPaymentButton } from "./retry-payment-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Paiement — Banat Sport Club" };

/**
 * Retour de navigateur après Mollie.
 *
 * Ce retour n'est pas une preuve de paiement : c'est le webhook qui fait foi.
 * La page se contente donc d'afficher ce que la base sait à cet instant.
 */
export default async function PaiementPage({
  searchParams,
}: {
  searchParams: Promise<{ adherente?: string }>;
}) {
  const { adherente } = await searchParams;
  const summary = adherente ? await getPaymentSummary(adherente) : null;

  if (!summary) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-5 py-12">
          <h1 className="text-3xl font-bold text-brand-dark">Paiement</h1>
          <p className="mt-4 text-brand-dark/80">
            Nous n’avons pas retrouvé cette inscription. Si vous venez de payer,
            le bureau vous recontactera.
          </p>
          <Link href="/" className="btn mt-8">
            Retour à l’accueil
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const fullyPaid = summary.remainingCents <= 0;
  const partiallyPaid = summary.paidCents > 0 && !fullyPaid;

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-5 py-12">
        {fullyPaid ? (
          <>
            <h1 className="text-3xl font-bold text-brand-dark sm:text-4xl">
              Paiement reçu ✓
            </h1>
            <p className="mt-3 text-lg text-brand-dark/80">
              {summary.registrationStatus === "ACTIVE"
                ? `L’inscription de ${summary.firstName} est maintenant validée.`
                : `Le règlement de ${summary.firstName} est enregistré. Le bureau finalise l’adhésion.`}
            </p>
          </>
        ) : partiallyPaid ? (
          <>
            <h1 className="text-3xl font-bold text-brand-dark sm:text-4xl">
              Paiement partiel enregistré
            </h1>
            <p className="mt-3 text-brand-dark/80">
              Il reste {formatEuros(summary.remainingCents)} à régler pour
              valider l’adhésion de {summary.firstName}.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-brand-dark sm:text-4xl">
              Paiement en cours de confirmation
            </h1>
            <p className="mt-3 text-brand-dark/80">
              Si vous venez de payer, la confirmation peut prendre quelques
              instants. Si le paiement n’a pas été finalisé, vous pouvez le
              relancer ci-dessous.
            </p>
          </>
        )}

        <dl className="card mt-6 space-y-3">
          <Line label="Adhérente" value={summary.firstName} />
          <Line label="Numéro adhérente" value={summary.memberNumber} mono />
          <Line label="Cotisation" value={formatEuros(summary.annualFeeCents)} />
          <Line label="Déjà réglé" value={formatEuros(summary.paidCents)} />
          <Line label="Reste à régler" value={formatEuros(summary.remainingCents)} />
        </dl>

        {!fullyPaid && (
          <div className="mt-6">
            <RetryPaymentButton
              memberId={summary.memberId}
              amountCents={summary.remainingCents}
            />
          </div>
        )}

        <p className="mt-6 text-sm text-brand-dark/60">
          La confirmation définitive nous est transmise directement par notre
          prestataire de paiement. En cas de doute, le bureau vous recontactera.
        </p>

        <div className="mt-8">
          <Link href="/" className="btn-ghost w-full justify-center py-3 sm:w-auto">
            Retour à l’accueil
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Line({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <dt className="text-sm text-brand-dark/60">{label}</dt>
      <dd className={`font-semibold text-brand-dark ${mono ? "font-mono text-brand" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
