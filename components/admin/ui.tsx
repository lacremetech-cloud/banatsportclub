import Link from "next/link";

import {
  REGISTRATION_STATUS_LABELS,
  type RegistrationStatus,
} from "@/lib/constants";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_SHORT_LABELS,
  type PaymentStatus,
} from "@/lib/crm";

/** Briques d'interface de l'espace bureau. Volontairement minimales. */

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-brand bg-brand-light/15"
          : "border-brand-light/40 bg-white"
      }`}
    >
      <p className="text-sm text-brand-dark/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-dark">{value}</p>
      {hint && <p className="mt-1 text-sm text-brand-dark/60">{hint}</p>}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-brand-light/40 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-dark">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DataLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 border-b border-brand-light/20 py-2 last:border-0">
      <dt className="min-w-44 text-sm text-brand-dark/60">{label}</dt>
      <dd className="font-medium text-brand-dark">{children}</dd>
    </div>
  );
}

const REGISTRATION_TONES: Record<RegistrationStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-900",
  PENDING_PAYMENT: "bg-amber-100 text-amber-900",
  CANCELLED: "bg-brand-dark/10 text-brand-dark/70",
};

export function RegistrationBadge({ status }: { status: string }) {
  const key = status as RegistrationStatus;
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
        REGISTRATION_TONES[key] ?? "bg-brand-light/25 text-brand-dark"
      }`}
    >
      {REGISTRATION_STATUS_LABELS[key] ?? status}
    </span>
  );
}

const PAYMENT_TONES: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-100 text-emerald-900",
  EXEMPT: "bg-sky-100 text-sky-900",
  // Un échéancier suivi n'est pas un impayé : il a sa propre couleur, pour
  // que le bureau fasse la différence d'un coup d'œil.
  ON_SCHEDULE: "bg-indigo-100 text-indigo-900",
  PARTIAL: "bg-amber-100 text-amber-900",
  UNPAID: "bg-rose-100 text-rose-900",
};

export function PaymentBadge({
  status,
  full,
}: {
  status: PaymentStatus;
  /** Libellé complet quand la place le permet (fiche adhérente). */
  full?: boolean;
}) {
  return (
    <span
      title={PAYMENT_STATUS_LABELS[status]}
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_TONES[status]}`}
    >
      {full ? PAYMENT_STATUS_LABELS[status] : PAYMENT_STATUS_SHORT_LABELS[status]}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-brand-dark/60">{children}</p>;
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-semibold text-brand hover:underline">
      ← {children}
    </Link>
  );
}
