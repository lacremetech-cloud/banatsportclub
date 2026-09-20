import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { GROUPS, type GroupName } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { attendanceSchema, formatZodErrors } from "@/lib/validation";

/** GET admin : présences déjà saisies pour un groupe et une date. */
export async function GET(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupName = searchParams.get("group");
  const sessionDate = searchParams.get("date");

  if (!groupName || !sessionDate) {
    return NextResponse.json(
      { message: "Paramètres `group` et `date` obligatoires." },
      { status: 400 },
    );
  }

  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.groupName, groupName),
        eq(schema.sessions.sessionDate, sessionDate),
      ),
    );

  if (!session) return NextResponse.json({ session: null, entries: [] });

  const entries = await db
    .select()
    .from(schema.attendance)
    .where(eq(schema.attendance.sessionId, session.id));

  return NextResponse.json({ session, entries });
}

/**
 * POST admin : enregistre la feuille de présence d'une séance.
 * La séance est créée à la volée si elle n'existe pas encore.
 */
export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Feuille de présence invalide.", errors: formatZodErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { groupName, sessionDate, entries } = parsed.data;
  const group = GROUPS[groupName as GroupName];

  const [session] = await db
    .insert(schema.sessions)
    .values({
      groupName,
      sessionDate,
      startTime: group.startTime,
      endTime: group.endTime,
      status: "done",
    })
    .onConflictDoUpdate({
      target: [schema.sessions.groupName, schema.sessions.sessionDate],
      set: { status: "done" },
    })
    .returning();

  const upserts = entries.map((entry) =>
    db
      .insert(schema.attendance)
      .values({
        sessionId: session.id,
        memberId: entry.memberId,
        status: entry.status,
        notes: entry.notes,
      })
      .onConflictDoUpdate({
        target: [schema.attendance.sessionId, schema.attendance.memberId],
        set: { status: entry.status, notes: entry.notes ?? null, recordedAt: new Date() },
      }),
  );

  // Zod garantit au moins une entrée : on reconstruit un tuple non vide,
  // que db.batch() exige.
  const [firstUpsert, ...otherUpserts] = upserts;
  await db.batch([firstUpsert, ...otherUpserts]);

  return NextResponse.json({ sessionId: session.id, saved: entries.length }, { status: 201 });
}
