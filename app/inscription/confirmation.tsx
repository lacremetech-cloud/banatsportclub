"use client";

import Link from "next/link";

import {
  PREFERRED_PAYMENT_METHOD_CONFIRMATIONS,
  PREFERRED_PAYMENT_METHOD_LABELS,
  formatEuros,
  type PreferredPaymentMethod,
} from "@/lib/constants";
import type { GroupInfo } from "@/lib/settings";

export type RegistrationResult = {
  memberNumber: string;
  firstName: string;
  lastName: string;
  groupName: string;
  preferredPaymentMethod: string;
  annualFeeCents: number;
  season: string;
};

export function ConfirmationScreen({
  result,
  groups,
}: {
  result: RegistrationResult;
  groups: GroupInfo[];
}) {
  const group = groups.find((item) => item.key === result.groupName);
  const method = result.preferredPaymentMethod as PreferredPaymentMethod;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
        Inscription enregistrée ✓
      </h1>
      <p className="mt-3 text-brand-dark/80">
        L’inscription a bien été enregistrée.
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

      <p className="mt-6 rounded-2xl bg-brand-light/15 px-5 py-4 text-brand-dark/85">
        {PREFERRED_PAYMENT_METHOD_CONFIRMATIONS[method]}
      </p>

      <p className="mt-4 text-sm text-brand-dark/60">
        L’adhésion sera définitivement validée après réception du règlement.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn w-full sm:w-auto">
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
      <dd
        className={`font-semibold text-brand-dark ${mono ? "font-mono text-brand" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
