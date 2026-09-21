import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import {
  type RegistrationStatus,
  type GroupName,
} from "./constants";
import { db, schema } from "./db";
import { installmentsSettled, type FeeType } from "./fees";
import { getSiteSettings, type GroupInfo } from "./settings";

/**
 * Lectures du mini-CRM.
 *
 * Deux règles structurantes :
 *
 * 1. Le statut de paiement n'est JAMAIS stocké. Il se déduit à chaque lecture
 *    de la somme des lignes `payments` réellement encaissées, comparée à la
 *    cotisation DE L'ADHÉRENTE (`members.fee_amount_cents`), et non au tarif
 *    général. Une cotisation solidaire ou offerte est donc prise en compte
 *    partout sans cas particulier. `preferred_payment_method` est une
 *    intention de la famille, jamais un montant.
 *
 * 2. Les séances comptabilisées pour une adhérente sont celles pour lesquelles
 *    une présence a été saisie la concernant. Une adhérente inscrite en cours
 *    de saison ne se voit donc pas attribuer d'absences pour les séances
 *    antérieures : aucune ligne `attendance` n'existe pour elle.
 */

/** Un paiement n'est compté que s'il a effectivement été encaissé. */
const PAID = "paid";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "ON_SCHEDULE" | "PAID" | "EXEMPT";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Non payé",
  PARTIAL: "Partiel",
  ON_SCHEDULE: "Échéancier en cours",
  PAID: "Payé",
  EXEMPT: "Cotisation offerte",
};

/** Version courte, pour les pastilles où la place manque. */
export const PAYMENT_STATUS_SHORT_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Non payé",
  PARTIAL: "Partiel",
  ON_SCHEDULE: "Échéancier",
  PAID: "Payé",
  EXEMPT: "Offerte",
};

/**
 * Statut de paiement d'une adhérente.
 *
 * `installments` permet de distinguer deux situations que le bureau ne doit
 * surtout pas confondre : une adhérente qui n'a rien réglé (« Impayé ») et
 * une adhérente qui suit l'échéancier accepté à l'inscription
 * (« Paiement en cours — échéancier »). Une cotisation offerte n'est ni l'une
 * ni l'autre : elle est soldée d'office, sans aucune ligne de paiement.
 */
export function computePaymentStatus(
  paidCents: number,
  feeCents: number,
  installments = 1,
): PaymentStatus {
  if (feeCents <= 0) return "EXEMPT";
  if (paidCents >= feeCents) return "PAID";
  if (paidCents <= 0) return "UNPAID";
  return installments > 1 ? "ON_SCHEDULE" : "PARTIAL";
}

/** Récapitulatif d'échéancier affiché sur la fiche : « 1 / 2 ». */
export type InstallmentProgress = {
  plan: number;
  settled: number;
};

export function installmentProgress(
  feeCents: number,
  installments: number,
  paidCents: number,
): InstallmentProgress {
  return {
    plan: installments,
    settled: installmentsSettled(feeCents, installments, paidCents),
  };
}

export type MemberRow = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  schoolLevel: string;
  groupName: string;
  registrationStatus: string;
  feeType: string;
  feeAmountCents: number;
  paymentInstallments: number;
  equipmentDelivered: boolean;
  paidCents: number;
  dueCents: number;
  paymentStatus: PaymentStatus;
};

/** Colonnes de cotisation et d'équipement, sélectionnées partout pareil. */
const FEE_COLUMNS = {
  feeType: schema.members.feeType,
  feeAmountCents: schema.members.feeAmountCents,
  paymentInstallments: schema.members.paymentInstallments,
  equipmentDelivered: schema.members.equipmentDelivered,
} as const;

/** Assemble les chiffres d'une adhérente à partir de SA cotisation. */
function withFees<T extends { feeAmountCents: number; paymentInstallments: number }>(
  row: T,
  paidCents: number,
) {
  return {
    ...row,
    paidCents,
    dueCents: Math.max(row.feeAmountCents - paidCents, 0),
    paymentStatus: computePaymentStatus(
      paidCents,
      row.feeAmountCents,
      row.paymentInstallments,
    ),
  };
}

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
        ...FEE_COLUMNS,
      })
      .from(schema.members)
      .where(and(...conditions))
      .orderBy(asc(schema.members.lastName), asc(schema.members.firstName)),
    paidTotalsByMember(),
  ]);

  const members: MemberRow[] = rows.map((row) =>
    withFees(row, paidTotals.get(row.id) ?? 0),
  );

  return { members, season, annualFeeCents };
}

export type DashboardStats = {
  season: string;
  annualFeeCents: number;
  groups: GroupInfo[];
  totalMembers: number;
  byGroup: Record<string, number>;
  byFeeType: Record<string, number>;
  /** Adhésions validées dont le kit reste à remettre. */
  equipmentPending: number;
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
        ...FEE_COLUMNS,
      })
      .from(schema.members)
      .where(eq(schema.members.season, season)),
    paidTotalsByMember(),
  ]);

  const byGroup: Record<string, number> = {};
  let activeCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  let expectedCents = 0;
  let equipmentPending = 0;
  const byFeeType: Record<string, number> = { STANDARD: 0, SOLIDARITY: 0, FREE: 0 };

  for (const row of rows) {
    byGroup[row.groupName] = (byGroup[row.groupName] ?? 0) + 1;
    if (row.registrationStatus === "ACTIVE") activeCount += 1;
    if (row.registrationStatus === "PENDING_PAYMENT") pendingCount += 1;
    if (row.registrationStatus === "CANCELLED") cancelledCount += 1;
    // Une adhésion annulée ne génère aucune attente de cotisation. Les autres
    // comptent pour LEUR montant : 20 standards + 5 solidaires + 2 offertes
    // font 4 500 €, pas 27 × 200 €.
    if (row.registrationStatus !== "CANCELLED") {
      expectedCents += row.feeAmountCents;
      byFeeType[row.feeType] = (byFeeType[row.feeType] ?? 0) + 1;
      // Le kit ne concerne que les adhésions validées : inutile de préparer
      // celui d'une inscription encore en attente.
      if (row.registrationStatus === "ACTIVE" && !row.equipmentDelivered) {
        equipmentPending += 1;
      }
    }
  }

  const collectedCents = rows.reduce(
    (total, row) => total + (paidTotals.get(row.id) ?? 0),
    0,
  );

  return {
    season,
    annualFeeCents,
    groups,
    totalMembers: rows.length,
    byGroup,
    byFeeType,
    equipmentPending,
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
  // Deux contacts, ordonnés par priorité : le principal puis le second.
  const emergencyRows = await db
    .select()
    .from(schema.emergencyContacts)
    .where(eq(schema.emergencyContacts.memberId, memberId))
    .orderBy(asc(schema.emergencyContacts.priority));
  const emergency = emergencyRows.find((row) => row.priority === 1) ?? null;
  const secondContact = emergencyRows.find((row) => row.priority === 2) ?? null;
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
    secondContact,
    medical,
    consents,
    payments,
    notes,
    attendance,
    attendanceStats: stats,
    paidCents,
    dueCents: Math.max(member.feeAmountCents - paidCents, 0),
    paymentStatus: computePaymentStatus(
      paidCents,
      member.feeAmountCents,
      member.paymentInstallments,
    ),
    installments: installmentProgress(
      member.feeAmountCents,
      member.paymentInstallments,
      paidCents,
    ),
    season,
    annualFeeCents,
    group: groups.find((item) => item.key === member.groupName),
    groups,
  };
}

export type PaymentFilter = "all" | "unpaid-open" | PaymentStatus;

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
        ...FEE_COLUMNS,
        guardianPhone: schema.guardians.phone,
        guardianEmail: schema.guardians.email,
      })
      .from(schema.members)
      .leftJoin(schema.guardians, eq(schema.guardians.memberId, schema.members.id))
      .where(eq(schema.members.season, season))
      .orderBy(asc(schema.members.lastName), asc(schema.members.firstName)),
    paidTotalsByMember(),
  ]);

  const all: PaymentRow[] = rows.map((row) =>
    withFees(row, paidTotals.get(row.id) ?? 0),
  );

  const members = all.filter((row) => {
    if (filter === "all") return true;
    // « Impayés » : il reste quelque chose à encaisser, hors adhésions
    // annulées. Une cotisation offerte n'y figure jamais, puisqu'elle ne doit
    // rien.
    if (filter === "unpaid-open") {
      return (
        row.dueCents > 0 &&
        row.paymentStatus !== "EXEMPT" &&
        row.registrationStatus !== "CANCELLED"
      );
    }
    return row.paymentStatus === filter;
  });

  const expectedCents = all
    .filter((row) => row.registrationStatus !== "CANCELLED")
    .reduce((total, row) => total + row.feeAmountCents, 0);
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

/**
 * Adhérentes ACTIVE d'un groupe, pour la feuille de présence.
 *
 * Le téléphone du responsable légal est joint : il alimente le SMS
 * d'information en cas d'absence ou de retard, sans second aller-retour.
 */
export async function listActiveMembersForGroup(groupName: GroupName | string) {
  const { season } = await getSiteSettings();
  return db
    .select({
      id: schema.members.id,
      memberNumber: schema.members.memberNumber,
      firstName: schema.members.firstName,
      lastName: schema.members.lastName,
      guardianPhone: schema.guardians.phone,
    })
    .from(schema.members)
    .leftJoin(schema.guardians, eq(schema.guardians.memberId, schema.members.id))
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
 * Règle métier : l'adhésion est VALIDÉE dès le premier euro encaissé. Une
 * adhérente qui règle la première de ses deux échéances est inscrite au club
 * et apparaît en séance ; elle doit simplement encore de l'argent.
 *
 * Validation de l'inscription et solde de la cotisation sont donc deux choses
 * distinctes, et ce fichier les garde séparées : `registration_status` dit si
 * l'adhérente fait partie du club, `computePaymentStatus()` dit où en est son
 * règlement. Une adhérente ACTIVE peut très bien être en échéancier avec un
 * reste à payer.
 *
 * Une adhésion annulée ne repasse jamais ACTIVE automatiquement : seule une
 * action explicite du bureau peut la réactiver.
 */
export async function recomputeMemberStatus(memberId: string): Promise<RegistrationStatus | null> {
  const [member] = await db
    .select({
      status: schema.members.registrationStatus,
      feeAmountCents: schema.members.feeAmountCents,
    })
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

  // Une cotisation offerte vaut 0 : il n'y a rien à encaisser, l'adhésion est
  // validée d'emblée, sans qu'aucune ligne de faux paiement de 0 € n'ait
  // besoin d'exister.
  const paidCents = Number(row?.total ?? 0);
  const next: RegistrationStatus =
    member.feeAmountCents <= 0 || paidCents > 0 ? "ACTIVE" : "PENDING_PAYMENT";

  if (next !== member.status) {
    await db
      .update(schema.members)
      .set({ registrationStatus: next, updatedAt: new Date() })
      .where(eq(schema.members.id, memberId));
  }

  return next;
}

