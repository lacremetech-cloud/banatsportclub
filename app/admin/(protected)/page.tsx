import Link from "next/link";

import { StatCard } from "@/components/admin/ui";
import { formatEuros } from "@/lib/constants";
import { getDashboardStats } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Banat Sport Club
        </p>
        <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
          Saison {stats.season}
        </h1>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-dark">Adhérentes</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total inscrites" value={String(stats.totalMembers)} accent />
          {stats.groups.map((group) => (
            <StatCard
              key={group.key}
              label={group.day}
              value={String(stats.byGroup[group.key] ?? 0)}
              hint={`${group.time} — ${group.place}`}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-dark">Paiements</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Cotisations attendues"
            value={formatEuros(stats.expectedCents)}
            hint={`${formatEuros(stats.annualFeeCents)} par adhérente non annulée`}
          />
          <StatCard label="Montant encaissé" value={formatEuros(stats.collectedCents)} />
          <StatCard
            label="Reste à encaisser"
            value={formatEuros(stats.remainingCents)}
            accent={stats.remainingCents > 0}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Adhésions validées" value={String(stats.activeCount)} />
          <StatCard label="En attente de règlement" value={String(stats.pendingCount)} />
          <StatCard label="Annulées" value={String(stats.cancelledCount)} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/adherentes" className="btn-ghost">
          Voir les adhérentes
        </Link>
        <Link href="/admin/paiements?filtre=unpaid-open" className="btn-ghost">
          Voir les impayés
        </Link>
        <Link href="/admin/presences" className="btn-ghost">
          Saisir les présences
        </Link>
      </div>
    </div>
  );
}
