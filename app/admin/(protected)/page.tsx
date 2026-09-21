import Link from "next/link";

import { StatCard } from "@/components/admin/ui";
import { getTreasurySummary } from "@/lib/accounting";
import { formatEuros } from "@/lib/constants";
import { getDashboardStats } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, treasury] = await Promise.all([
    getDashboardStats(),
    getTreasurySummary(),
  ]);

  /**
   * Points d'attention.
   *
   * Chaque ligne n'apparaît que si elle concerne réellement quelqu'un : tant
   * que tous les dossiers sont complets et que toutes les adhérentes sont au
   * tarif standard, cette rangée disparaît entièrement et le tableau de bord
   * reste aussi léger qu'avant.
   */
  const attention = [
    {
      label: "Dossiers à vérifier",
      value: stats.dossiersToCheck,
      href: "/admin/adherentes",
    },
    { label: "Équipements à remettre", value: stats.equipmentPending, href: "/admin/adherentes" },
    { label: "Cotisations solidaires", value: stats.byFeeType.SOLIDARITY ?? 0, href: null },
    { label: "Cotisations offertes", value: stats.byFeeType.FREE ?? 0, href: null },
  ].filter((item) => item.value > 0);

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
            /* Libellé court : le bureau sait où ont lieu les séances, une
               adresse complète n'apporterait rien ici. */
            <StatCard
              key={group.key}
              label={group.shortLabel}
              value={String(stats.byGroup[group.key] ?? 0)}
              hint={group.time}
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
            hint="Somme des cotisations réellement dues, hors adhésions annulées"
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

      {attention.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-brand-dark">À suivre</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {attention.map((item) => (
              <li
                key={item.label}
                className="rounded-2xl border border-brand-light/50 bg-brand-light/10 px-4 py-3"
              >
                <p className="text-2xl font-bold text-brand-dark">{item.value}</p>
                {item.href ? (
                  <Link href={item.href} className="text-sm text-brand underline">
                    {item.label}
                  </Link>
                ) : (
                  <p className="text-sm text-brand-dark/70">{item.label}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
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
