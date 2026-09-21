"use client";

import Link from "next/link";
import { useState } from "react";

import { BankTransferDetails } from "@/components/bank-transfer";
import {
  PREFERRED_PAYMENT_METHOD_LABELS,
  formatEuros,
  type PreferredPaymentMethod,
} from "@/lib/constants";
import { installmentLabel, splitInstallments } from "@/lib/fees";
import type { BankDetails, GroupInfo } from "@/lib/settings";

export type RegistrationResult = {
  id: string;
  memberNumber: string;
  paymentInstallments: number;
  firstName: string;
  lastName: string;
  groupName: string;
  preferredPaymentMethod: string;
  feeAmountCents: number;
  season: string;
};

export type { BankDetails };

/** Bouton de paiement carte : le montant est calculé côté serveur. */
function PayByCard({
  memberId,
  amountCents,
  installments,
}: {
  memberId: string;
  amountCents: number;
  installments: number;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/mollie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) {
        setError(data.message ?? "Le paiement en ligne est indisponible.");
        setPending(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Connexion impossible. Réessayez dans un instant.");
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn w-full" onClick={start} disabled={pending}>
        {pending ? "Ouverture du paiement…" : `Payer ${formatEuros(amountCents)} par carte`}
      </button>
      {error && (
        <p className="mt-3 rounded-xl bg-brand-light/25 px-4 py-3 text-brand-dark">
          {error}
        </p>
      )}
      <p className="mt-3 text-sm text-brand-dark/60">
        {installments > 1
          ? `Paiement sécurisé. Vous réglez la première des ${installments} échéances ; la suivante pourra être payée plus tard.`
          : "Paiement sécurisé. Vous pouvez aussi régler plus tard : le bureau vous recontactera."}
      </p>
    </div>
  );
}

export function ConfirmationScreen({
  result,
  groups,
  bank,
}: {
  result: RegistrationResult;
  groups: GroupInfo[];
  bank: BankDetails;
}) {
  const group = groups.find((item) => item.key === result.groupName);
  const method = result.preferredPaymentMethod as PreferredPaymentMethod;
  // Le serveur recalcule toujours le montant : ce qui suit ne sert qu'à
  // annoncer la bonne somme avant de cliquer.
  const installments = result.paymentInstallments;
  const firstDueCents = splitInstallments(result.feeAmountCents, installments)[0];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
        Inscription enregistrée ✓
      </h1>
      <p className="mt-3 text-brand-dark/80">
        Votre inscription est enregistrée. Un email de confirmation vient de
        vous être envoyé.
      </p>

      <dl className="card mt-6 space-y-3">
        <Line
          label="Adhérente"
          value={`${result.firstName} ${result.lastName.toUpperCase()}`}
        />
        <Line label="Numéro adhérente" value={result.memberNumber} mono />
        <Line
          label="Créneau"
          value={group ? `${group.day} ${group.time} — ${group.place}` : "—"}
        />
        <Line label="Cotisation" value={formatEuros(result.feeAmountCents)} />
        {installments > 1 && (
          <Line
            label="Rythme"
            value={`${installmentLabel(installments)} — ${installments} × ${formatEuros(firstDueCents)}`}
          />
        )}
        <Line
          label="Mode de paiement choisi"
          value={PREFERRED_PAYMENT_METHOD_LABELS[method] ?? "—"}
        />
        <Line label="Saison" value={result.season} />
      </dl>

      <div className="mt-6">
        {method === "CARD" && (
          <PayByCard
            memberId={result.id}
            amountCents={firstDueCents}
            installments={installments}
          />
        )}

        {method === "BANK_TRANSFER" && (
          /* À cet instant rien n'a encore été encaissé : le reste dû est la
             cotisation entière, et le montant à virer la première échéance. */
          <BankTransferDetails
            memberNumber={result.memberNumber}
            amountCents={firstDueCents}
            remainingCents={result.feeAmountCents}
            installments={installments}
            bank={bank}
          />
        )}

        {method === "CHEQUE" && (
          <div className="rounded-2xl bg-brand-light/15 px-5 py-4 text-brand-dark/85">
            <p className="font-semibold text-brand-dark">Paiement choisi : chèque</p>
            <p className="mt-2">
              Votre adhésion sera validée par le bureau après réception du
              règlement. Merci d’indiquer {result.memberNumber} au dos du chèque.
              {installments > 1 &&
                ` Vous avez choisi le paiement en ${installments} fois : prévoyez ${installments} chèques de ${formatEuros(firstDueCents)}.`}
            </p>
          </div>
        )}

        {method === "CASH" && (
          <div className="rounded-2xl bg-brand-light/15 px-5 py-4 text-brand-dark/85">
            <p className="font-semibold text-brand-dark">Paiement choisi : espèces</p>
            <p className="mt-2">
              Votre adhésion sera validée par le bureau lors de la remise du
              règlement.
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-brand-dark/60">
        L’adhésion sera définitivement validée après réception du règlement.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-ghost w-full justify-center py-3 sm:w-auto">
          Retour à l’accueil
        </Link>
        <Link
          href="/informations"
          className="btn-ghost w-full justify-center py-3 sm:w-auto"
        >
          Informations pratiques
        </Link>
      </div>
    </div>
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
