import { and, asc, desc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";

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

/**
 * Rangement CRM d'une fiche, distinct de son statut d'adhésion.
 *
 * `current` : ce que le bureau gère au quotidien.
 * `archived` : retirée des listes du jour, tout est conservé.
 * `trashed` : mise de côté, invisible partout, restaurable.
 *
 * L'ordre compte : la corbeille l'emporte sur les archives, si bien qu'une
 * fiche archivée puis mise à la corbeille retrouve les archives quand on la
 * restaure.
 */
export const MEMBER_VIEWS = ["current", "archived", "trashed"] as const;
export type MemberView = (typeof MEMBER_VIEWS)[number];

export const MEMBER_VIEW_LABELS: Record<MemberView, string> = {
  current: "Adhérentes",
  archived: "Archives",
  trashed: "Corbeille",
};

/** Condition SQL correspondant à une vue. */
function viewCondition(view: MemberView) {
  if (view === "trashed") return isNotNull(schema.members.trashedAt);
  if (view === "archived") {
    return and(isNull(schema.members.trashedAt), isNotNull(schema.members.archivedAt));
  }
  return and(isNull(schema.members.trashedAt), isNull(schema.members.archivedAt));
}

/**
 * Filtre des vues opérationnelles : ni archivée, ni à la corbeille.
 *
 * Utilisé partout où le bureau travaille sur la saison en cours — listes,
 * présences, paiements, tableau de bord. La comptabilité, elle, ne l'utilise
 * PAS : un encaissement passé reste un encaissement passé.
 */
export const operationalMembers = () =>
  and(isNull(schema.members.trashedAt), isNull(schema.members.archivedAt));

export function memberView(member: {
  archivedAt: Date | null;
  trashedAt: Date | null;
}): MemberView {
  if (member.trashedAt) return "trashed";
  if (member.archivedAt) return "archived";
  return "current";
}

export type MemberFilters = {
  search?: string;
  group?: string;
  status?: string;
  view?: MemberView;
};

export async function listMembers(filters: MemberFilters = {}) {
  const { season, annualFeeCents } = await getSiteSettings();

  const conditions = [
    eq(schema.members.season, season),
    viewCondition(filters.view ?? "current"),
  ];

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
  /** Dossiers auxquels il manque un élément obligatoire du formulaire. */
  dossiersToCheck: number;
  activeCount: number;
  pendingCount: number;
  cancelledCount: number;
  expectedCents: number;
  collectedCents: number;
  remainingCents: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { season, annualFeeCents, groups } = await getSiteSettings();

  const [rows, paidTotals, dossierParts] = await Promise.all([
    db
      .select({
        id: schema.members.id,
        birthDate: schema.members.birthDate,
        schoolLevel: schema.members.schoolLevel,
        groupName: schema.members.groupName,
        registrationStatus: schema.members.registrationStatus,
        ...FEE_COLUMNS,
      })
      .from(schema.members)
      // Compteurs opérationnels : les fiches rangées n'y figurent pas.
      .where(and(eq(schema.members.season, season), operationalMembers())),
    paidTotalsByMember(),
    loadDossierParts(season),
  ]);

  const byGroup: Record<string, number> = {};
  let activeCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  let expectedCents = 0;
  let equipmentPending = 0;
  let dossiersToCheck = 0;
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
      // Un dossier annulé n'est plus à relancer : il ne compte pas.
      const dossier = checkDossier({
        birthDate: row.birthDate,
        schoolLevel: row.schoolLevel,
        groupName: row.groupName,
        guardian: dossierParts.guardianByMember.get(row.id) ?? null,
        emergency: dossierParts.primaryByMember.get(row.id) ?? null,
        secondContact: dossierParts.secondByMember.get(row.id) ?? null,
        consents: dossierParts.consentsByMember.get(row.id) ?? [],
      });
      if (!dossier.complete) dossiersToCheck += 1;
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
    dossiersToCheck,
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
    view: memberView(member),
    dossier: checkDossier({
      birthDate: member.birthDate,
      schoolLevel: member.schoolLevel,
      groupName: member.groupName,
      guardian: guardian ?? null,
      emergency,
      secondContact,
      consents,
    }),
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
      .where(and(eq(schema.members.season, season), operationalMembers()))
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
        // Une fiche archivée ou à la corbeille ne se présente plus en séance.
        operationalMembers(),
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


// --- Dossier d'inscription -------------------------------------------------

/**
 * Complétude du dossier.
 *
 * Ne sont vérifiés que les éléments RÉELLEMENT collectés par le formulaire
 * d'inscription. Aucun document n'est inventé : tant que le certificat médical
 * ou la photo ne sont pas demandés quelque part, leur absence ne peut pas
 * rendre un dossier incomplet.
 *
 * Le droit à l'image est volontairement exclu : une famille a parfaitement le
 * droit de le refuser, et ce refus est une réponse, pas un manque.
 */
export type DossierCheck = {
  complete: boolean;
  /** Ce qu'il manque, en clair, prêt à être affiché. */
  missing: string[];
};

type DossierInput = {
  birthDate: string | null;
  schoolLevel: string | null;
  groupName: string | null;
  guardian: { firstName: string; lastName: string; phone: string; email: string } | null;
  emergency: { firstName: string; phone: string } | null;
  secondContact: { firstName: string; phone: string } | null;
  consents: { type: string; accepted: boolean }[];
};

const filled = (value: string | null | undefined) => Boolean(value?.trim());

export function checkDossier(input: DossierInput): DossierCheck {
  const missing: string[] = [];

  if (!filled(input.birthDate)) missing.push("Date de naissance");
  if (!filled(input.schoolLevel)) missing.push("Classe");
  if (!filled(input.groupName)) missing.push("Créneau");

  const guardian = input.guardian;
  if (
    !guardian ||
    !filled(guardian.firstName) ||
    !filled(guardian.lastName) ||
    !filled(guardian.phone) ||
    !filled(guardian.email)
  ) {
    missing.push("Responsable légal");
  }

  if (!input.emergency || !filled(input.emergency.firstName) || !filled(input.emergency.phone)) {
    missing.push("Contact d’urgence principal");
  }

  // Le deuxième contact est obligatoire dans le formulaire depuis le
  // 21 septembre 2026 : les inscriptions antérieures apparaissent donc à
  // vérifier, ce qui est exactement l'intention.
  if (
    !input.secondContact ||
    !filled(input.secondContact.firstName) ||
    !filled(input.secondContact.phone)
  ) {
    missing.push("Deuxième contact d’urgence");
  }

  const accepted = new Set(
    input.consents.filter((row) => row.accepted).map((row) => row.type),
  );
  if (!accepted.has("INTERNAL_RULES")) missing.push("Règlement intérieur");
  if (!accepted.has("PARENTAL_AUTHORIZATION")) missing.push("Autorisation parentale");
  // Obligatoire dans le formulaire depuis le 21 septembre 2026, au même titre
  // que le deuxième contact : c'est la seule autorisation qui permet de faire
  // soigner une mineure sans attendre d'avoir joint ses parents.
  if (!accepted.has("EMERGENCY_MEDICAL")) {
    missing.push("Autorisation d’intervention d’urgence");
  }

  return { complete: missing.length === 0, missing };
}

/**
 * Pièces nécessaires au contrôle des dossiers, pour toutes les adhérentes
 * d'une saison. Trois requêtes plutôt qu'une par adhérente.
 */
async function loadDossierParts(season: string) {
  const [guardians, contacts, consents] = await Promise.all([
    db
      .select({
        memberId: schema.guardians.memberId,
        firstName: schema.guardians.firstName,
        lastName: schema.guardians.lastName,
        phone: schema.guardians.phone,
        email: schema.guardians.email,
      })
      .from(schema.guardians)
      .innerJoin(schema.members, eq(schema.members.id, schema.guardians.memberId))
      .where(eq(schema.members.season, season)),
    db
      .select({
        memberId: schema.emergencyContacts.memberId,
        priority: schema.emergencyContacts.priority,
        firstName: schema.emergencyContacts.firstName,
        lastName: schema.emergencyContacts.lastName,
        phone: schema.emergencyContacts.phone,
        relationship: schema.emergencyContacts.relationship,
      })
      .from(schema.emergencyContacts)
      .innerJoin(schema.members, eq(schema.members.id, schema.emergencyContacts.memberId))
      .where(eq(schema.members.season, season)),
    db
      .select({
        memberId: schema.consents.memberId,
        type: schema.consents.type,
        accepted: schema.consents.accepted,
      })
      .from(schema.consents)
      .innerJoin(schema.members, eq(schema.members.id, schema.consents.memberId))
      .where(eq(schema.members.season, season)),
  ]);

  const guardianByMember = new Map(guardians.map((row) => [row.memberId, row]));
  const primaryByMember = new Map(
    contacts.filter((row) => row.priority === 1).map((row) => [row.memberId, row]),
  );
  const secondByMember = new Map(
    contacts.filter((row) => row.priority === 2).map((row) => [row.memberId, row]),
  );
  const consentsByMember = new Map<string, { type: string; accepted: boolean }[]>();
  for (const row of consents) {
    const list = consentsByMember.get(row.memberId) ?? [];
    list.push({ type: row.type, accepted: row.accepted });
    consentsByMember.set(row.memberId, list);
  }

  return { guardianByMember, primaryByMember, secondByMember, consentsByMember };
}

// --- Export CSV ------------------------------------------------------------

export type MemberExportRow = {
  memberNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  schoolLevel: string;
  schoolName: string | null;
  groupName: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  emergencyName: string;
  emergencyPhone: string;
  secondName: string;
  secondPhone: string;
  secondRelationship: string;
  feeType: string;
  feeAmountCents: number;
  paidCents: number;
  dueCents: number;
  installments: number;
  registrationStatus: string;
  paymentStatus: PaymentStatus;
  equipmentDelivered: boolean;
  equipmentDeliveredAt: Date | null;
  imageRights: boolean;
  /** Autorisation d'intervention d'urgence : un consentement, pas une donnée de santé. */
  emergencyMedical: boolean;
  /** Déclaratif — voir INSURANCE_STATUSES. Ne dit rien de l'état de santé. */
  insuranceStatus: string;
  season: string;
};

/**
 * Toutes les adhérentes de la saison, à plat, pour l'export du bureau.
 *
 * Aucune donnée médicale n'est lue ici — ni allergie, ni traitement, ni
 * remarque de santé. Un export général circule par email, se retrouve sur
 * une clé USB et s'ouvre sur n'importe quel poste : ces informations n'ont
 * rien à y faire. Elles restent consultables sur la fiche, derrière la
 * connexion du bureau.
 */
export async function listMembersForExport(
  view: MemberView = "current",
): Promise<MemberExportRow[]> {
  const { season } = await getSiteSettings();

  const [rows, paidTotals, parts] = await Promise.all([
    db
      .select({
        id: schema.members.id,
        memberNumber: schema.members.memberNumber,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
        birthDate: schema.members.birthDate,
        schoolLevel: schema.members.schoolLevel,
        schoolName: schema.members.schoolName,
        groupName: schema.members.groupName,
        registrationStatus: schema.members.registrationStatus,
        equipmentDeliveredAt: schema.members.equipmentDeliveredAt,
        insuranceStatus: schema.members.insuranceStatus,
        season: schema.members.season,
        ...FEE_COLUMNS,
      })
      .from(schema.members)
      .where(and(eq(schema.members.season, season), viewCondition(view)))
      .orderBy(asc(schema.members.lastName), asc(schema.members.firstName)),
    paidTotalsByMember(),
    loadDossierParts(season),
  ]);

  return rows.map((row) => {
    const paidCents = paidTotals.get(row.id) ?? 0;
    const guardian = parts.guardianByMember.get(row.id);
    const emergency = parts.primaryByMember.get(row.id);
    const second = parts.secondByMember.get(row.id);
    const consents = parts.consentsByMember.get(row.id) ?? [];

    const fullName = (first?: string | null, last?: string | null) =>
      [first?.trim(), last?.trim()].filter(Boolean).join(" ");

    return {
      memberNumber: row.memberNumber,
      firstName: row.firstName,
      lastName: row.lastName,
      birthDate: row.birthDate,
      schoolLevel: row.schoolLevel,
      schoolName: row.schoolName,
      groupName: row.groupName,
      guardianName: fullName(guardian?.firstName, guardian?.lastName),
      guardianPhone: guardian?.phone ?? "",
      guardianEmail: guardian?.email ?? "",
      emergencyName: fullName(emergency?.firstName, emergency?.lastName),
      emergencyPhone: emergency?.phone ?? "",
      secondName: fullName(second?.firstName, second?.lastName),
      secondPhone: second?.phone ?? "",
      secondRelationship: second?.relationship ?? "",
      feeType: row.feeType,
      feeAmountCents: row.feeAmountCents,
      paidCents,
      dueCents: Math.max(row.feeAmountCents - paidCents, 0),
      installments: row.paymentInstallments,
      registrationStatus: row.registrationStatus,
      paymentStatus: computePaymentStatus(
        paidCents,
        row.feeAmountCents,
        row.paymentInstallments,
      ),
      equipmentDelivered: row.equipmentDelivered,
      equipmentDeliveredAt: row.equipmentDeliveredAt,
      imageRights: consents.some(
        (consent) => consent.type === "IMAGE_RIGHTS" && consent.accepted,
      ),
      emergencyMedical: consents.some(
        (consent) => consent.type === "EMERGENCY_MEDICAL" && consent.accepted,
      ),
      insuranceStatus: row.insuranceStatus,
      season: row.season,
    };
  });
}
