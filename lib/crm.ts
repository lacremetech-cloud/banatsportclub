import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import {
  type RegistrationStatus,
  type GroupName,
} from "./constants";
import { db, schema } from "./db";
import { getSiteSettings, type GroupInfo } from "./settings";

/**
 * Lectures du mini-CRM.
 *
 * Deux règles structurantes :
 *
 * 1. Le statut de paiement n'est JAMAIS stocké. Il se déduit à chaque lecture
 *    de la somme des lignes `payments` réellement encaissées, comparée à la
 *    cotisation de la saison. `preferred_payment_method` est une intention de
 *    la famille, jamais un montant.
 *
 * 2. Les séances comptabilisées pour une adhérente sont celles pour lesquelles
 *    une présence a été saisie la concernant. Une adhérente inscrite en cours
 *    de saison ne se voit donc pas attribuer d'absences pour les séances
 *    antérieures : aucune ligne `attendance` n'existe pour elle.
 */

/** Un paiement n'est compté que s'il a effectivement été encaissé. */
const PAID = "paid";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Non payé",
  PARTIAL: "Partiel",
  PAID: "Payé",
};

export function computePaymentStatus(paidCents: number, feeCents: number): PaymentStatus {
  if (paidCents <= 0) return "UNPAID";
  if (paidCents < feeCents) return "PARTIAL";
  return "PAID";
}

export type MemberRow = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  schoolLevel: string;
  groupName: string;
  registrationStatus: string;
  paidCents: number;
  dueCents: number;
  paymentStatus: PaymentStatus;
};

/** Totaux encaissés par adhérente, en une requête. */
async function paidTotalsByMember(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      memberId: schema.payments.memberId,
      total: sql<number>`coalesce(sum(${schema.payments.amountCents}), 0)::int`,
    })
    .from(schema.payments)
    .where(eq(schema.payments.status, PAID))
    .groupBy(schema.payments.memberId);

  return new Map(rows.map((row) => [row.memberId, Number(row.total)]));
}

export type MemberFilters = {
  search?: string;
  group?: string;
  status?: string;
};

export async function listMembers(filters: MemberFilters = {}) {
  const { season, annualFeeCents } = await getSiteSettings();

  const conditions = [eq(schema.members.season, season)];

  if (filters.group) {
    conditions.push(eq(schema.members.groupName, filters.group));
  }
  if (filters.status) {
    conditions.push(eq(schema.members.registrationStatus, filters.status));
  }

  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    // ilike : insensible à la casse, suffisant pour une cinquantaine de lignes.
    conditions.push(
      or(
        ilike(schema.members.firstName, pattern),
        ilike(schema.members.lastName, pattern),
        ilike(schema.members.memberNumber, pattern),
      )!,
    );
  }

  const [rows, paidTotals] = await Promise.all([
    db
      .select({
        id: schema.members.id,
        memberNumber: schema.members.memberNumber,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
        schoolLevel: schema.members.schoolLevel,
        groupName: schema.members.groupName,
        registrationStatus: schema.members.registrationStatus,
      })
      .from(schema.members)
      .where(and(...conditions))
      .orderBy(asc(schema.members.lastName), asc(schema.members.firstName)),
    paidTotalsByMember(),
  ]);

  const members: MemberRow[] = rows.map((row) => {
    const paidCents = paidTotals.get(row.id) ?? 0;
    return {
      ...row,
      paidCents,
      dueCents: Math.max(annualFeeCents - paidCents, 0),
      paymentStatus: computePaymentStatus(paidCents, annualFeeCents),
    };
  });

  return { members, season, annualFeeCents };
}

export type DashboardStats = {
  season: string;
  annualFeeCents: number;
  groups: GroupInfo[];
  totalMembers: number;
  byGroup: Record<string, number>;
  activeCount: number;
  pendingCount: number;
  cancelledCount: number;
  expectedCents: number;
  collectedCents: number;
  remainingCents: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { season, annualFeeCents, groups } = await getSiteSettings();

  const [rows, paidTotals] = await Promise.all([
    db
      .select({
        id: schema.members.id,
        groupName: schema.members.groupName,
        registrationStatus: schema.members.registrationStatus,
      })
      .from(schema.members)
      .where(eq(schema.members.season, season)),
    paidTotalsByMember(),
  ]);

  const byGroup: Record<string, number> = {};
  let activeCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  let billableMembers = 0;

  for (const row of rows) {
    byGroup[row.groupName] = (byGroup[row.groupName] ?? 0) + 1;
    if (row.registrationStatus === "ACTIVE") activeCount += 1;
    if (row.registrationStatus === "PENDING_PAYMENT") pendingCount += 1;
    if (row.registrationStatus === "CANCELLED") cancelledCount += 1;
    // Une adhésion annulée ne génère aucune attente de cotisation.
    if (row.registrationStatus !== "CANCELLED") billableMembers += 1;
  }

  const collectedCents = rows.reduce(
    (total, row) => total + (paidTotals.get(row.id) ?? 0),
    0,
  );
  const expectedCents = billableMembers * annualFeeCents;

  return {
    season,
    annualFeeCents,
    groups,
    totalMembers: rows.length,
    byGroup,
    activeCount,
    pendingCount,
    cancelledCount,
    expectedCents,
    collectedCents,
    remainingCents: Math.max(expectedCents - collectedCents, 0),
  };
}

export type AttendanceStats = {
  sessions: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  /** (présentes + retards) / séances saisies, en pourcentage entier. */
  rate: number | null;
};

export async function getMemberDetail(memberId: string) {
  const { season, annualFeeCents, groups } = await getSiteSettings();

  const [member] = await db
    .select()
    .from(schema.members)
    .where(eq(schema.members.id, memberId));

  if (!member) return null;

  const [guardian] = await db
    .select()
    .from(schema.guardians)
    .where(eq(schema.guardians.memberId, memberId));
  const [emergency] = await db
    .select()
    .from(schema.emergencyContacts)
    .where(eq(schema.emergencyContacts.memberId, memberId));
  const [medical] = await db
    .select()
    .from(schema.medicalInfo)
    .where(eq(schema.medicalInfo.memberId, memberId));

  const [consents, payments, notes, attendance] = await Promise.all([
    db.select().from(schema.consents).where(eq(schema.consents.memberId, memberId)),
    db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.memberId, memberId))
      .orderBy(desc(schema.payments.createdAt)),
    db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.memberId, memberId))
      .orderBy(desc(schema.notes.createdAt)),
    db
      .select({
        status: schema.attendance.status,
        sessionDate: schema.sessions.sessionDate,
        groupName: schema.sessions.groupName,
      })
      .from(schema.attendance)
      .innerJoin(schema.sessions, eq(schema.sessions.id, schema.attendance.sessionId))
      .where(eq(schema.attendance.memberId, memberId))
      .orderBy(desc(schema.sessions.sessionDate)),
  ]);

  const paidCents = payments
    .filter((payment) => payment.status === PAID)
    .reduce((total, payment) => total + payment.amountCents, 0);

  const stats: AttendanceStats = {
    sessions: attendance.length,
    present: attendance.filter((row) => row.status === "present").length,
    absent: attendance.filter((row) => row.status === "absent").length,
    excused: attendance.filter((row) => row.status === "excused").length,
    late: attendance.filter((row) => row.status === "late").length,
    rate: null,
  };
  if (stats.sessions > 0) {
    stats.rate = Math.round(((stats.present + stats.late) / stats.sessions) * 100);
  }

  return {
    member,
    guardian,
    emergency,
    medical,
    consents,
    payments,
    notes,
    attendance,
    attendanceStats: stats,
    paidCents,
    dueCents: Math.max(annualFeeCents - paidCents, 0),
    paymentStatus: computePaymentStatus(paidCents, annualFeeCents),
    season,
    annualFeeCents,
    group: groups.find((item) => item.key === member.groupName),
    groups,
  };
}

export type PaymentFilter = "all" | "PAID" | "PARTIAL" | "UNPAID" | "unpaid-open";

export type PaymentRow = MemberRow & {
  guardianPhone: string | null;
  guardianEmail: string | null;
};

/** Vue « qui a payé quoi », avec les coordonnées pour relancer. */
export async function getPaymentOverview(filter: PaymentFilter = "all") {
  const { season, annualFeeCents } = await getSiteSettings();

  const [rows, paidTotals] = await Promise.all([
    db
      .select({
        id: schema.members.id,
        memberNumber: schema.members.memberNumber,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
        schoolLevel: schema.members.schoolLevel,
        groupName: schema.members.groupName,
        registrationStatus: schema.members.registrationStatus,
        guardianPhone: schema.guardians.phone,
        guardianEmail: schema.guardians.email,
      })
      .from(schema.members)
      .leftJoin(schema.guardians, eq(schema.guardians.memberId, schema.members.id))
      .where(eq(schema.members.season, season))
      .orderBy(asc(schema.members.lastName), asc(schema.members.firstName)),
    paidTotalsByMember(),
  ]);

  const all: PaymentRow[] = rows.map((row) => {
    const paidCents = paidTotals.get(row.id) ?? 0;
    return {
      ...row,
      paidCents,
      dueCents: Math.max(annualFeeCents - paidCents, 0),
      paymentStatus: computePaymentStatus(paidCents, annualFeeCents),
    };
  });

  const members = all.filter((row) => {
    if (filter === "all") return true;
    // « Impayés » : il reste quelque chose à encaisser, hors adhésions annulées.
    if (filter === "unpaid-open") {
      return row.paymentStatus !== "PAID" && row.registrationStatus !== "CANCELLED";
    }
    return row.paymentStatus === filter;
  });

  const billable = all.filter((row) => row.registrationStatus !== "CANCELLED");
  const expectedCents = billable.length * annualFeeCents;
  const collectedCents = all.reduce((total, row) => total + row.paidCents, 0);

  return {
    members,
    season,
    annualFeeCents,
    expectedCents,
    collectedCents,
    remainingCents: Math.max(expectedCents - collectedCents, 0),
  };
}

/** Adhérentes ACTIVE d'un groupe, pour la feuille de présence. */
export async function listActiveMembersForGroup(groupName: GroupName | string) {
  const { season } = await getSiteSettings();
  return db
    .select({
      id: schema.members.id,
      memberNumber: schema.members.memberNumber,
      firstName: schema.members.firstName,
      lastName: schema.members.lastName,
    })
    .from(schema.members)
    .where(
      and(
        eq(schema.members.season, season),
        eq(schema.members.groupName, groupName),
        eq(schema.members.registrationStatus, "ACTIVE"),
      ),
    )
    .orderBy(asc(schema.members.lastName), asc(schema.members.firstName));
}

export async function findSession(groupName: string, sessionDate: string) {
  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.groupName, groupName),
        eq(schema.sessions.sessionDate, sessionDate),
      ),
    );
  return session ?? null;
}

export async function getAttendanceForSession(sessionId: string) {
  const rows = await db
    .select()
    .from(schema.attendance)
    .where(eq(schema.attendance.sessionId, sessionId));
  return new Map(rows.map((row) => [row.memberId, row.status]));
}

/**
 * Aligne `registration_status` sur les encaissements.
 *
 * Une adhésion annulée ne repasse jamais ACTIVE automatiquement : seule une
 * action explicite du bureau peut la réactiver.
 */
export async function recomputeMemberStatus(memberId: string): Promise<RegistrationStatus | null> {
  const { annualFeeCents } = await getSiteSettings();

  const [member] = await db
    .select({ status: schema.members.registrationStatus })
    .from(schema.members)
    .where(eq(schema.members.id, memberId));

  if (!member) return null;
  if (member.status === "CANCELLED") return "CANCELLED";

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.payments.amountCents}), 0)::int`,
    })
    .from(schema.payments)
    .where(and(eq(schema.payments.memberId, memberId), eq(schema.payments.status, PAID)));

  const paidCents = Number(row?.total ?? 0);
  const next: RegistrationStatus = paidCents >= annualFeeCents ? "ACTIVE" : "PENDING_PAYMENT";

  if (next !== member.status) {
    await db
      .update(schema.members)
      .set({ registrationStatus: next, updatedAt: new Date() })
      .where(eq(schema.members.id, memberId));
  }

  return next;
}

