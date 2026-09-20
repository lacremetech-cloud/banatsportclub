import Link from "next/link";

import { EmptyState, PaymentBadge, StatCard } from "@/components/admin/ui";
import { formatEuros } from "@/lib/constants";
import { getPaymentOverview, type PaymentFilter } from "@/lib/crm";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "PAID", label: "Payés" },
  { value: "PARTIAL", label: "Partiels" },
  { value: "UNPAID", label: "Non payés" },
  { value: "unpaid-open", label: "Impayés" },
];

export default async function PaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const params = await searchParams;
  const filter = (FILTERS.some((f) => f.value === params.filtre)
    ? params.filtre
    : "all") as PaymentFilter;

  const [overview, { groups }] = await Promise.all([
    getPaymentOverview(filter),
    getSiteSettings(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-dark">Paiements</h1>
        <p className="mt-1 text-brand-dark/70">Saison {overview.season}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Cotisations attendues"
          value={formatEuros(overview.expectedCents)}
          hint={`${formatEuros(overview.annualFeeCents)} par adhérente non annulée`}
        />
        <StatCard label="Encaissé" value={formatEuros(overview.collectedCents)} />
        <StatCard
          label="Reste à encaisser"
          value={formatEuros(overview.remainingCents)}
          accent={overview.remainingCents > 0}
        />
      </div>

      <nav className="-mx-5 overflow-x-auto px-5">
        <ul className="flex min-w-max gap-2">
          {FILTERS.map((item) => (
            <li key={item.value}>
              <Link
                href={`/admin/paiements?filtre=${item.value}`}
                aria-current={filter === item.value ? "page" : undefined}
                className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  filter === item.value
                    ? "bg-brand text-white"
                    : "border border-brand-light/50 bg-white text-brand-dark hover:border-brand"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {overview.members.length === 0 ? (
        <EmptyState>Aucune adhérente dans cette catégorie.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {overview.members.map((member) => {
            const group = groups.find((item) => item.key === member.groupName);
            const owes =
              member.dueCents > 0 && member.registrationStatus !== "CANCELLED";
            return (
              <li
                key={member.id}
                className="rounded-2xl border border-brand-light/40 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/adherentes/${member.id}`}
                      className="font-semibold text-brand-dark hover:underline"
                    >
                      {member.firstName} {member.lastName.toUpperCase()}
                    </Link>
                    <p className="mt-0.5 text-sm text-brand-dark/60">
                      {group?.day ?? member.groupName} ·{" "}
                      <span className="font-mono text-xs">{member.memberNumber}</span>
                    </p>
                  </div>
                  <PaymentBadge status={member.paymentStatus} />
                </div>

                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-brand-dark/60">Dû</dt>
                    <dd className="font-medium text-brand-dark">
                      {formatEuros(overview.annualFeeCents)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-brand-dark/60">Réglé</dt>
                    <dd className="font-medium text-brand-dark">
                      {formatEuros(member.paidCents)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-brand-dark/60">Reste</dt>
                    <dd className="font-semibold text-brand">
                      {formatEuros(member.dueCents)}
                    </dd>
                  </div>
                </dl>

                {owes && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-brand-light/30 pt-3 text-sm">
                    <span className="font-medium text-brand-dark">
                      Reste à régler : {formatEuros(member.dueCents)}
                    </span>
                    {member.guardianPhone && (
                      <a
                        href={`tel:${member.guardianPhone}`}
                        className="text-brand underline"
                      >
                        {member.guardianPhone}
                      </a>
                    )}
                    {member.guardianEmail && (
                      <a
                        href={`mailto:${member.guardianEmail}`}
                        className="text-brand underline"
                      >
                        {member.guardianEmail}
                      </a>
                    )}
                    <Link
                      href={`/admin/adherentes/${member.id}`}
                      className="font-semibold text-brand-dark underline"
                    >
                      Ajouter un paiement
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
