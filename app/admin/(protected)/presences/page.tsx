import { EmptyState } from "@/components/admin/ui";
import { GROUP_NAMES, formatDate, type GroupName } from "@/lib/constants";
import {
  findSession,
  getAttendanceForSession,
  listActiveMembersForGroup,
} from "@/lib/crm";
import { getSiteSettings } from "@/lib/settings";

import { AttendanceSheet } from "./attendance-sheet";
import { CreateSessionButton } from "./create-session-button";

export const dynamic = "force-dynamic";

/** Date du jour au format AAAA-MM-JJ, heure de Paris. */
function today(): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

export default async function PresencesPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string; date?: string }>;
}) {
  const params = await searchParams;
  const { groups } = await getSiteSettings();

  const groupName: GroupName = GROUP_NAMES.includes(params.groupe as GroupName)
    ? (params.groupe as GroupName)
    : "jeudi";
  const sessionDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? params.date!
    : today();

  const group = groups.find((item) => item.key === groupName)!;
  const session = await findSession(groupName, sessionDate);

  const [members, existing] = await Promise.all([
    listActiveMembersForGroup(groupName),
    session ? getAttendanceForSession(session.id) : Promise.resolve(new Map()),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-dark">Présences</h1>
        <p className="mt-1 text-brand-dark/70">
          {group.day} {group.time} — {group.place}
        </p>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-brand-light/40 bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label className="label" htmlFor="groupe">
            Groupe
          </label>
          <select id="groupe" name="groupe" defaultValue={groupName} className="field">
            {groups.map((item) => (
              <option key={item.key} value={item.key}>
                {item.day}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="date">
            Date de la séance
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={sessionDate}
            className="field"
          />
        </div>
        <button type="submit" className="btn-ghost h-[46px]">
          Afficher
        </button>
      </form>

      {session ? (
        <>
          <p className="text-brand-dark/70">
            Séance du {formatDate(sessionDate)} — {members.length} adhérente
            {members.length > 1 ? "s" : ""} au créneau.
          </p>
          <AttendanceSheet
            sessionId={session.id}
            members={members}
            existing={Object.fromEntries(existing)}
          />
        </>
      ) : (
        <div className="rounded-2xl border border-brand-light/40 bg-white p-5">
          <h2 className="font-bold text-brand-dark">
            Aucune séance enregistrée le {formatDate(sessionDate)}
          </h2>
          <p className="mt-2 text-brand-dark/70">
            Créez-la pour pouvoir saisir les présences. Les horaires du créneau
            sont appliqués automatiquement.
          </p>
          <div className="mt-4">
            <CreateSessionButton
              groupName={groupName}
              sessionDate={sessionDate}
              label={
                sessionDate === today()
                  ? "Créer la séance du jour"
                  : `Créer la séance du ${formatDate(sessionDate)}`
              }
            />
          </div>
          {members.length === 0 && (
            // `EmptyState` rend déjà un <p> : l'envelopper dans un autre <p>
            // produisait du HTML invalide, que le navigateur réorganise, d'où
            // une erreur d'hydratation React (#418).
            <div className="mt-4">
              <EmptyState>
                Aucune adhérente avec une adhésion validée dans ce groupe pour
                l’instant.
              </EmptyState>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
