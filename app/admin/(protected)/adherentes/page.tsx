import Link from "next/link";

import { EmptyState, PaymentBadge, RegistrationBadge } from "@/components/admin/ui";
import {
  REGISTRATION_STATUSES,
  REGISTRATION_STATUS_LABELS,
  SCHOOL_LEVEL_LABELS,
  formatEuros,
} from "@/lib/constants";
import { listMembers } from "@/lib/crm";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Les filtres passent par l'URL, dans un simple formulaire GET : ils sont
 * combinables, partageables, et fonctionnent sans JavaScript.
 */
export default async function AdherentesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; groupe?: string; statut?: string }>;
}) {
  const params = await searchParams;
  const { groups } = await getSiteSettings();

  const search = params.q?.trim() ?? "";
  const group = groups.some((g) => g.key === params.groupe) ? params.groupe! : "";
  const status = REGISTRATION_STATUSES.includes(params.statut as never)
    ? params.statut!
    : "";

  const { members, season } = await listMembers({ search, group, status });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Adhérentes</h1>
          <p className="mt-1 text-brand-dark/70">
            {members.length} résultat{members.length > 1 ? "s" : ""} — saison {season}
          </p>
        </div>
        {/* L'export porte sur toute la saison, pas sur le filtre affiché :
            c'est le fichier que le bureau attend pour l'assurance ou la
            mairie. Aucune donnée médicale n'y figure. */}
        <a href="/api/admin/export/adherentes" className="btn-ghost" download>
          Exporter CSV
        </a>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-brand-light/40 bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label className="label" htmlFor="q">
            Rechercher
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Nom, prénom ou numéro"
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="groupe">
            Créneau
          </label>
          <select id="groupe" name="groupe" defaultValue={group} className="field">
            <option value="">Toutes</option>
            {groups.map((item) => (
              <option key={item.key} value={item.key}>
                {item.shortLabel}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="statut">
            Statut
          </label>
          <select id="statut" name="statut" defaultValue={status} className="field">
            <option value="">Tous</option>
            {REGISTRATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {REGISTRATION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn h-[46px] w-full sm:w-auto">
          Filtrer
        </button>
      </form>

      {members.length === 0 ? (
        <EmptyState>Aucune adhérente ne correspond à cette recherche.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => {
            const group = groups.find((item) => item.key === member.groupName);
            return (
              <li key={member.id}>
                <Link
                  href={`/admin/adherentes/${member.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-light/40 bg-white p-4 transition hover:border-brand"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-brand-dark">
                      {member.firstName} {member.lastName.toUpperCase()}
                    </span>
                    <span className="mt-0.5 block text-sm text-brand-dark/60">
                      {SCHOOL_LEVEL_LABELS[
                        member.schoolLevel as keyof typeof SCHOOL_LEVEL_LABELS
                      ] ?? member.schoolLevel}{" "}
                      · {group?.shortLabel ?? member.groupName}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-brand-dark/50">
                      {member.memberNumber}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <RegistrationBadge status={member.registrationStatus} />
                    <PaymentBadge status={member.paymentStatus} />
                    {member.dueCents > 0 &&
                      member.registrationStatus !== "CANCELLED" && (
                        <span className="text-sm font-medium text-brand-dark/70">
                          reste {formatEuros(member.dueCents)}
                        </span>
                      )}
                    {/* Une seule mention, et seulement là où elle sert : on
                        n'affiche « kit à remettre » que pour les adhésions
                        validées, celles dont le kit est réellement attendu. */}
                    {member.registrationStatus === "ACTIVE" &&
                      (member.equipmentDelivered ? (
                        <span className="text-sm text-brand-dark/50">Kit remis</span>
                      ) : (
                        <span className="text-sm font-medium text-brand">
                          Kit à remettre
                        </span>
                      ))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
