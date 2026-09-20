import { and, asc, eq } from "drizzle-orm";

import { GROUPS, GROUP_NAMES, type GroupName } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

import { AttendanceSheet } from "./attendance-sheet";

export const dynamic = "force-dynamic";

/** Dernière date (aujourd'hui inclus) correspondant au jour du groupe. */
function lastSessionDate(weekday: number): string {
  const date = new Date();
  const diff = (date.getDay() - weekday + 7) % 7;
  date.setDate(date.getDate() - diff);
  return date.toISOString().slice(0, 10);
}

export default async function PresencesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; date?: string }>;
}) {
  const params = await searchParams;
  const { season, groups } = await getSiteSettings();

  const groupName: GroupName = GROUP_NAMES.includes(params.group as GroupName)
    ? (params.group as GroupName)
    : "jeudi";
  const sessionDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? (params.date as string)
    : lastSessionDate(GROUPS[groupName].weekday);

  const members = await db
    .select({
      id: schema.members.id,
      memberNumber: schema.members.memberNumber,
      firstName: schema.members.firstName,
      lastName: schema.members.lastName,
    })
    .from(schema.members)
    .where(and(eq(schema.members.season, season), eq(schema.members.groupName, groupName)))
    .orderBy(asc(schema.members.lastName), asc(schema.members.firstName));

  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.groupName, groupName),
        eq(schema.sessions.sessionDate, sessionDate),
      ),
    );

  const existing = session
    ? await db
        .select({
          memberId: schema.attendance.memberId,
          status: schema.attendance.status,
        })
        .from(schema.attendance)
        .where(eq(schema.attendance.sessionId, session.id))
    : [];

  const currentGroup = groups.find((item) => item.key === groupName)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Présences</h1>
        <p className="mt-1 text-brand-dark/70">
          {currentGroup.day} {currentGroup.time} — {currentGroup.place}
        </p>
      </div>

      <form method="get" className="card grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="group">
            Groupe
          </label>
          <select id="group" name="group" className="field" defaultValue={groupName}>
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
          <input id="date" name="date" type="date" className="field" defaultValue={sessionDate} />
        </div>
        <button type="submit" className="btn-ghost h-[46px]">
          Afficher
        </button>
      </form>

      <AttendanceSheet
        groupName={groupName}
        sessionDate={sessionDate}
        members={members}
        existing={Object.fromEntries(existing.map((row) => [row.memberId, row.status]))}
      />
    </div>
  );
}
