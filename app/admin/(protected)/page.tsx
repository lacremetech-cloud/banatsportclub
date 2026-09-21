import Link from "next/link";

import { StatCard } from "@/components/admin/ui";
import { getTreasurySummary } from "@/lib/accounting";
import { formatEuros } from "@/lib/constants";
import { getDashboardStats } from "@/lib/crm";
import { FEE_TYPE_LABELS } from "@/lib/fees";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, treasury] = await Promise.all([
    getDashboardStats(),
    getTreasurySummary(),
  ]);

  // Une ligne n'apparaît que si elle concerne quelqu'un : tant que toutes les
  // adhérentes sont au tarif standard, rien ne vient encombrer l'écran.
  const specialFees = (["SOLIDARITY", "FREE"] as const).filter(
    (feeType) => (stats.byFeeType[feeType] ?? 0) > 0,
  );

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
            hint={
              specialFees.length > 0
                ? specialFees
                    .map(
                      (feeType) =>
                        `${stats.byFeeType[feeType]} ${FEE_TYPE_LABELS[feeType].toLowerCase()}${stats.byFeeType[feeType] > 1 ? "s" : ""}`,
                    )
                    .join(" · ")
                : `${formatEuros(stats.annualFeeCents)} par adhérente non annulée`
            }
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
          <StatCard
            label="Inscriptions en attente"
            value={String(stats.pendingCount)}
            hint="Aucun règlement encaissé à ce jour"
          />
          <StatCard label="Annulées" value={String(stats.cancelledCount)} />
        </div>
      </section>

      {stats.equipmentPending > 0 && (
        <p className="rounded-2xl border border-brand-light/50 bg-brand-light/10 px-5 py-4 text-brand-dark">
          Équipements à remettre :{" "}
          <strong className="text-brand-dark">{stats.equipmentPending}</strong>
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-dark">Trésorerie suivie</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Recettes" value={formatEuros(treasury.incomeCents)} />
          <StatCard label="Dépenses" value={formatEuros(treasury.expenseCents)} />
          <StatCard label="Solde" value={formatEuros(treasury.balanceCents)} />
        </div>
        <p className="mt-2 text-sm text-brand-dark/60">
          Vue d’ensemble. Le détail des mouvements est dans{" "}
          <Link href="/admin/comptabilite" className="text-brand underline">
            Comptabilité
          </Link>
          .
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/adherentes" className="btn-ghost">
          Voir les adhérentes
        </Link>
        <Link href="/admin/paiements?filtre=unpaid-open" className="btn-ghost">
          Voir le reste à encaisser
        </Link>
        <Link href="/admin/presences" className="btn-ghost">
          Saisir les présences
        </Link>
      </div>
    </div>
  );
}
