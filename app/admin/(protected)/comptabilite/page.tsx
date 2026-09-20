import Link from "next/link";

import { EmptyState, StatCard } from "@/components/admin/ui";
import {
  getAccountingOverview,
  type AccountingKind,
  type AccountingPeriod,
} from "@/lib/accounting";
import { formatDate, formatEuros } from "@/lib/constants";

import { AddEntryForm, DeleteEntryButton } from "./entry-form";

export const dynamic = "force-dynamic";

const PERIODS: { value: AccountingPeriod; label: string }[] = [
  { value: "season", label: "Saison" },
  { value: "month", label: "Ce mois" },
  { value: "all", label: "Toutes les opérations" },
];

const KINDS: { value: AccountingKind; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "INCOME", label: "Recettes" },
  { value: "EXPENSE", label: "Dépenses" },
];

/**
 * Suivi de trésorerie.
 *
 * Ce n'est pas un logiciel comptable : trois chiffres en haut, la liste des
 * mouvements en dessous, et deux boutons pour saisir ce qui n'est pas une
 * cotisation. Les cotisations, elles, arrivent toutes seules.
 */
export default async function ComptabilitePage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; type?: string }>;
}) {
  const params = await searchParams;
  const period = (PERIODS.some((item) => item.value === params.periode)
    ? params.periode
    : "season") as AccountingPeriod;
  const kind = (KINDS.some((item) => item.value === params.type)
    ? params.type
    : "all") as AccountingKind;

  const overview = await getAccountingOverview(period, kind);
  const { partnerClub } = overview;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-dark">Comptabilité</h1>
        <p className="mt-1 text-brand-dark/70">Saison {overview.season}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Recettes" value={formatEuros(overview.incomeCents)} />
        <StatCard label="Dépenses" value={formatEuros(overview.expenseCents)} />
        <StatCard
          label="Solde"
          value={formatEuros(overview.balanceCents)}
          accent
          hint="Recettes moins dépenses"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <AddEntryForm type="INCOME" />
        <AddEntryForm type="EXPENSE" />
      </div>

      {partnerClub.memberCount > 0 && (
        <section className="rounded-2xl border-2 border-brand-light/50 bg-brand-light/10 p-5">
          <h2 className="font-bold text-brand-dark">
            Reversement club partenaire à prévoir
          </h2>
          <p className="mt-2 text-2xl font-bold text-brand-dark">
            {formatEuros(partnerClub.expectedCents)}
          </p>
          <p className="mt-1 text-brand-dark/70">
            {partnerClub.memberCount} adhérente{partnerClub.memberCount > 1 ? "s" : ""} du
            dimanche × {formatEuros(partnerClub.feePerMemberCents)}
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-brand-dark/60">Déjà reversé</dt>
              <dd className="font-semibold text-brand-dark">
                {formatEuros(partnerClub.paidCents)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-brand-dark/60">Reste à reverser</dt>
              <dd className="font-semibold text-brand">
                {formatEuros(partnerClub.remainingCents)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-brand-dark/60">
            Provision indicative : aucune dépense n’est créée automatiquement. Le
            reversement n’apparaît dans les dépenses que lorsque le bureau le
            saisit réellement.
          </p>
        </section>
      )}

      <nav className="-mx-5 space-y-2 overflow-x-auto px-5">
        <ul className="flex min-w-max gap-2">
          {PERIODS.map((item) => (
            <li key={item.value}>
              <Link
                href={`/admin/comptabilite?periode=${item.value}&type=${kind}`}
                aria-current={period === item.value ? "page" : undefined}
                className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  period === item.value
                    ? "bg-brand text-white"
                    : "border border-brand-light/50 bg-white text-brand-dark hover:border-brand"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex min-w-max gap-2">
          {KINDS.map((item) => (
            <li key={item.value}>
              <Link
                href={`/admin/comptabilite?periode=${period}&type=${item.value}`}
                aria-current={kind === item.value ? "page" : undefined}
                className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  kind === item.value
                    ? "bg-brand-dark text-white"
                    : "border border-brand-light/50 bg-white text-brand-dark hover:border-brand"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-dark">Historique</h2>
        {overview.movements.length === 0 ? (
          <EmptyState>Aucun mouvement sur cette période.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {overview.movements.map((movement) => {
              const income = movement.amountCents > 0;
              return (
                <li
                  key={`${movement.source}-${movement.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-brand-light/40 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-dark">{movement.label}</p>
                    <p className="text-sm text-brand-dark/60">
                      {formatDate(movement.date)} · {movement.category}
                      {movement.note ? ` · ${movement.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold ${income ? "text-emerald-700" : "text-brand"}`}
                    >
                      {income ? "+" : "−"}
                      {formatEuros(Math.abs(movement.amountCents))}
                    </span>
                    {movement.deletable ? (
                      <DeleteEntryButton
                        entryId={movement.id}
                        label={movement.label}
                        amountCents={movement.amountCents}
                      />
                    ) : movement.memberId ? (
                      <Link
                        href={`/admin/adherentes/${movement.memberId}`}
                        className="min-h-11 px-2 py-2 text-sm font-semibold text-brand-dark/60 underline hover:text-brand"
                      >
                        Voir la fiche
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-sm text-brand-dark/60">
          Les cotisations encaissées apparaissent ici automatiquement. Elles ne se
          corrigent que depuis la page Paiements, jamais d’ici.
        </p>
      </section>
    </div>
  );
}
