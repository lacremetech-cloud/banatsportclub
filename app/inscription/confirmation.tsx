"use client";

import Link from "next/link";
import { useState } from "react";

import {
  PREFERRED_PAYMENT_METHOD_LABELS,
  formatEuros,
  type PreferredPaymentMethod,
} from "@/lib/constants";
import type { GroupInfo } from "@/lib/settings";

export type RegistrationResult = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  groupName: string;
  preferredPaymentMethod: string;
  annualFeeCents: number;
  season: string;
};

export type BankDetails = {
  holder: string | null;
  iban: string | null;
  bic: string | null;
};

/** Bouton de paiement carte : le montant est calculé côté serveur. */
function PayByCard({ memberId, amountCents }: { memberId: string; amountCents: number }) {
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
        Paiement sécurisé. Vous pouvez aussi régler plus tard : le bureau vous
        recontactera.
      </p>
    </div>
  );
}

function BankTransfer({
  memberNumber,
  amountCents,
  bank,
}: {
  memberNumber: string;
  amountCents: number;
  bank: BankDetails;
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-light/50 bg-white p-5">
      <h3 className="font-bold text-brand-dark">Paiement par virement</h3>
      <p className="mt-2 text-brand-dark/80">
        Montant à virer : <strong>{formatEuros(amountCents)}</strong>
      </p>

      <div className="mt-4 rounded-xl bg-brand-light/20 px-4 py-3">
        <p className="text-sm text-brand-dark/70">
          Référence à indiquer obligatoirement dans le libellé
        </p>
        <p className="mt-1 font-mono text-lg font-bold text-brand-dark">
          {memberNumber}
        </p>
      </div>

      {bank.iban ? (
        <dl className="mt-4 space-y-2 text-sm">
          {bank.holder && (
            <div className="flex flex-wrap gap-2">
              <dt className="text-brand-dark/60">Bénéficiaire</dt>
              <dd className="font-medium text-brand-dark">{bank.holder}</dd>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <dt className="text-brand-dark/60">IBAN</dt>
            <dd className="font-mono font-medium text-brand-dark">{bank.iban}</dd>
          </div>
          {bank.bic && (
            <div className="flex flex-wrap gap-2">
              <dt className="text-brand-dark/60">BIC</dt>
              <dd className="font-mono font-medium text-brand-dark">{bank.bic}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-4 text-brand-dark/70">
          Les coordonnées bancaires vous seront communiquées par le bureau.
        </p>
      )}

      <p className="mt-4 text-sm text-brand-dark/60">
        Sans cette référence, le bureau ne peut pas rattacher votre virement à
        l’inscription.
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
        <Line label="Cotisation" value={formatEuros(result.annualFeeCents)} />
        <Line
          label="Mode de paiement choisi"
          value={PREFERRED_PAYMENT_METHOD_LABELS[method] ?? "—"}
        />
        <Line label="Saison" value={result.season} />
      </dl>

      <div className="mt-6">
        {method === "CARD" && (
          <PayByCard memberId={result.id} amountCents={result.annualFeeCents} />
        )}

        {method === "BANK_TRANSFER" && (
          <BankTransfer
            memberNumber={result.memberNumber}
            amountCents={result.annualFeeCents}
            bank={bank}
          />
        )}

        {method === "CHEQUE" && (
          <div className="rounded-2xl bg-brand-light/15 px-5 py-4 text-brand-dark/85">
            <p className="font-semibold text-brand-dark">Paiement choisi : chèque</p>
            <p className="mt-2">
              Votre adhésion sera validée par le bureau après réception du
              règlement. Merci d’indiquer {result.memberNumber} au dos du chèque.
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
