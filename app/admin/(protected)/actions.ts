"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { ACCOUNTING_TYPES } from "@/lib/accounting";
import {
  ATTENDANCE_STATUSES,
  EXPENSE_CATEGORIES,
  GROUP_NAMES,
  GROUPS,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  SCHOOL_LEVELS,
  type GroupName,
} from "@/lib/constants";
import { recomputeMemberStatus } from "@/lib/crm";
import { db, schema } from "@/lib/db";
import { FEE_TYPES, type FeeType } from "@/lib/fees";
import { getFeeScale, getSeason } from "@/lib/settings";
import { adminInstallmentsSchema } from "@/lib/validation";

/**
 * Mutations de l'espace bureau.
 *
 * Une Server Action est joignable par une requête POST directe : chacune
 * revérifie la session, comme le ferait une route API.
 */

export type ActionResult = { ok: true } | { ok: false; message: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé.");
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}

function refreshMember(memberId: string) {
  revalidatePath(`/admin/adherentes/${memberId}`);
  revalidatePath("/admin/adherentes");
  revalidatePath("/admin/paiements");
  revalidatePath("/admin/comptabilite");
  revalidatePath("/admin");
}

function refreshAccounting() {
  revalidatePath("/admin/comptabilite");
  revalidatePath("/admin");
}

// --- Paiements ------------------------------------------------------------

const paymentSchema = z.object({
  memberId: z.uuid(),
  // Saisie en euros par le bureau, stockée en centimes.
  amountEuros: z.coerce
    .number({ error: "Montant invalide" })
    .positive("Le montant doit être supérieur à 0")
    .max(10_000, "Montant trop élevé"),
  method: z.enum(PAYMENT_METHODS, { error: "Mode de règlement invalide" }),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  notes: z.string().trim().max(500).optional(),
});

export async function addPayment(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = paymentSchema.safeParse({
    memberId: formData.get("memberId"),
    amountEuros: formData.get("amountEuros"),
    method: formData.get("method"),
    paidOn: formData.get("paidOn"),
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Paiement invalide.");
  }

  const { memberId, amountEuros, method, paidOn, notes } = parsed.data;

  // Saisie manuelle : encaissement constaté par le bureau, sans prestataire.
  await db.insert(schema.payments).values({
    memberId,
    amountCents: Math.round(amountEuros * 100),
    method,
    status: "paid",
    provider: null,
    providerPaymentId: null,
    paidAt: new Date(`${paidOn}T12:00:00Z`),
    notes: notes || null,
  });

  await recomputeMemberStatus(memberId);
  refreshMember(memberId);
  return { ok: true };
}

export async function deletePayment(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const paymentId = String(formData.get("paymentId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!paymentId || !memberId) return fail("Paiement introuvable.");

  const [payment] = await db
    .select({ provider: schema.payments.provider })
    .from(schema.payments)
    .where(
      and(eq(schema.payments.id, paymentId), eq(schema.payments.memberId, memberId)),
    );

  if (!payment) return fail("Paiement introuvable.");

  // La suppression est réservée aux saisies manuelles du bureau. Un
  // encaissement passé par un prestataire correspond à un vrai mouvement
  // d'argent : le supprimer ferait mentir la comptabilité.
  if (payment.provider) {
    return fail(
      "Ce paiement a été encaissé en ligne : il ne peut pas être supprimé depuis le CRM.",
    );
  }

  await db
    .delete(schema.payments)
    .where(
      and(eq(schema.payments.id, paymentId), eq(schema.payments.memberId, memberId)),
    );

  await recomputeMemberStatus(memberId);
  refreshMember(memberId);
  return { ok: true };
}

// --- Cotisation et échéancier ---------------------------------------------

const feeTypeSchema = z.object({
  memberId: z.uuid(),
  feeType: z.enum(FEE_TYPES, { error: "Type de cotisation invalide" }),
});

/**
 * Change le type de cotisation d'une adhérente.
 *
 * Le montant est pris dans le barème en vigueur (`settings`) au moment du
 * changement, puis FIGÉ sur la fiche : une révision ultérieure du tarif ne
 * viendra pas réécrire cette adhésion. Aucune raison n'est demandée, et aucune
 * catégorie de situation personnelle n'est enregistrée : le bureau peut
 * ajouter une note interne s'il le souhaite.
 */
export async function updateMemberFee(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = feeTypeSchema.safeParse({
    memberId: formData.get("memberId"),
    feeType: formData.get("feeType"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Cotisation invalide.");
  }

  const scale = await getFeeScale();
  const feeType = parsed.data.feeType as FeeType;

  await db
    .update(schema.members)
    .set({
      feeType,
      feeAmountCents: scale[feeType],
      updatedAt: new Date(),
    })
    .where(eq(schema.members.id, parsed.data.memberId));

  // Une cotisation offerte vaut 0 : l'adhésion devient ACTIVE d'elle-même,
  // sans qu'aucun faux paiement de 0 € ne soit créé. Une adhésion annulée,
  // elle, reste annulée.
  await recomputeMemberStatus(parsed.data.memberId);
  refreshMember(parsed.data.memberId);
  return { ok: true };
}

/**
 * Change l'échéancier. Le 3 fois n'existe qu'ici : le formulaire public ne
 * propose que 1 ou 2 fois.
 */
export async function updateMemberInstallments(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const memberId = String(formData.get("memberId") ?? "");
  if (!z.uuid().safeParse(memberId).success) return fail("Adhérente introuvable.");

  const parsed = adminInstallmentsSchema.safeParse(formData.get("installments"));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Échéancier invalide.");
  }

  await db
    .update(schema.members)
    .set({ paymentInstallments: parsed.data, updatedAt: new Date() })
    .where(eq(schema.members.id, memberId));

  // L'échéancier change ce que le bureau voit et ce que Mollie propose, jamais
  // le statut : celui-ci dépend du total encaissé.
  refreshMember(memberId);
  return { ok: true };
}

// --- Notes internes -------------------------------------------------------

const noteSchema = z.object({
  memberId: z.uuid(),
  content: z.string().trim().min(1, "La note est vide").max(2000),
  authorName: z.string().trim().max(80).optional(),
});

export async function addNote(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = noteSchema.safeParse({
    memberId: formData.get("memberId"),
    content: formData.get("content"),
    authorName: formData.get("authorName") ?? undefined,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Note invalide.");
  }

  await db.insert(schema.notes).values({
    memberId: parsed.data.memberId,
    content: parsed.data.content,
    authorName: parsed.data.authorName || "Bureau BSC",
  });

  refreshMember(parsed.data.memberId);
  return { ok: true };
}

export async function deleteNote(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const noteId = String(formData.get("noteId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!noteId || !memberId) return fail("Note introuvable.");

  await db
    .delete(schema.notes)
    .where(and(eq(schema.notes.id, noteId), eq(schema.notes.memberId, memberId)));

  refreshMember(memberId);
  return { ok: true };
}

// --- Fiche adhérente ------------------------------------------------------

const text = (max: number) => z.string().trim().max(max);
const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} est obligatoire`).max(max);

const memberUpdateSchema = z.object({
  memberId: z.uuid(),
  firstName: requiredText("Le prénom"),
  lastName: requiredText("Le nom"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide"),
  schoolLevel: z.enum(SCHOOL_LEVELS, { error: "Classe invalide" }),
  schoolName: text(160).optional(),
  groupName: z.enum(GROUP_NAMES as [string, ...string[]], { error: "Créneau invalide" }),

  guardianFirstName: requiredText("Le prénom du responsable légal"),
  guardianLastName: requiredText("Le nom du responsable légal"),
  guardianPhone: requiredText("Le téléphone du responsable légal", 20),
  guardianEmail: z.email("Adresse email invalide"),

  emergencyFirstName: requiredText("Le prénom du contact d’urgence"),
  emergencyLastName: requiredText("Le nom du contact d’urgence"),
  emergencyPhone: requiredText("Le second numéro", 20),
  emergencyRelationship: text(80).optional(),

  allergies: text(2000).optional(),
  currentTreatments: text(2000).optional(),
  healthNotes: text(2000).optional(),
});

/**
 * Met à jour la fiche. Le numéro d'adhérente et l'historique des
 * consentements ne sont volontairement pas modifiables.
 */
export async function updateMember(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = memberUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Fiche invalide.");
  }

  const v = parsed.data;

  await db.batch([
    db
      .update(schema.members)
      .set({
        firstName: v.firstName,
        lastName: v.lastName,
        birthDate: v.birthDate,
        schoolLevel: v.schoolLevel,
        schoolName: v.schoolName || null,
        groupName: v.groupName,
        updatedAt: new Date(),
      })
      .where(eq(schema.members.id, v.memberId)),
    db
      .update(schema.guardians)
      .set({
        firstName: v.guardianFirstName,
        lastName: v.guardianLastName,
        phone: v.guardianPhone,
        email: v.guardianEmail,
      })
      .where(eq(schema.guardians.memberId, v.memberId)),
    db
      .update(schema.emergencyContacts)
      .set({
        firstName: v.emergencyFirstName,
        lastName: v.emergencyLastName,
        phone: v.emergencyPhone,
        relationship: v.emergencyRelationship || null,
      })
      .where(eq(schema.emergencyContacts.memberId, v.memberId)),
    db
      .update(schema.medicalInfo)
      .set({
        allergies: v.allergies || null,
        currentTreatments: v.currentTreatments || null,
        healthNotes: v.healthNotes || null,
      })
      .where(eq(schema.medicalInfo.memberId, v.memberId)),
  ]);

  refreshMember(v.memberId);
  return { ok: true };
}

/**
 * Annule l'adhésion. Rien n'est supprimé : fiche, paiements, présences et
 * notes restent consultables.
 */
export async function cancelMembership(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return fail("Adhérente introuvable.");

  await db
    .update(schema.members)
    .set({ registrationStatus: "CANCELLED", updatedAt: new Date() })
    .where(eq(schema.members.id, memberId));

  refreshMember(memberId);
  return { ok: true };
}

// --- Présences ------------------------------------------------------------

/** Crée la séance du jour pour un groupe, aux horaires du créneau. */
export async function createTodaySession(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const groupName = String(formData.get("groupName") ?? "");
  const sessionDate = String(formData.get("sessionDate") ?? "");
  if (!GROUP_NAMES.includes(groupName as GroupName)) return fail("Groupe inconnu.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) return fail("Date invalide.");

  const group = GROUPS[groupName as GroupName];

  await db
    .insert(schema.sessions)
    .values({
      groupName,
      sessionDate,
      startTime: group.startTime,
      endTime: group.endTime,
      status: "done",
    })
    .onConflictDoNothing({
      target: [schema.sessions.groupName, schema.sessions.sessionDate],
    });

  revalidatePath("/admin/presences");
  return { ok: true };
}

const attendanceSchema = z.object({
  sessionId: z.uuid(),
  entries: z
    .array(
      z.object({
        memberId: z.uuid(),
        status: z.enum(ATTENDANCE_STATUSES),
      }),
    )
    .min(1, "Aucune présence à enregistrer"),
});

export async function saveAttendance(
  sessionId: string,
  entries: { memberId: string; status: string }[],
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = attendanceSchema.safeParse({ sessionId, entries });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Feuille de présence invalide.");
  }

  const upserts = parsed.data.entries.map((entry) =>
    db
      .insert(schema.attendance)
      .values({
        sessionId: parsed.data.sessionId,
        memberId: entry.memberId,
        status: entry.status,
      })
      .onConflictDoUpdate({
        target: [schema.attendance.sessionId, schema.attendance.memberId],
        set: { status: entry.status, recordedAt: new Date() },
      }),
  );

  const [first, ...rest] = upserts;
  await db.batch([first, ...rest]);

  revalidatePath("/admin/presences");
  revalidatePath("/admin/adherentes");
  return { ok: true };
}

// --- Comptabilité ---------------------------------------------------------

const CATEGORIES: Record<string, readonly string[]> = {
  INCOME: INCOME_CATEGORIES,
  EXPENSE: EXPENSE_CATEGORIES,
};

const accountingSchema = z
  .object({
    type: z.enum(ACCOUNTING_TYPES, { error: "Type de mouvement invalide" }),
    category: z.string().trim().min(1, "La catégorie est obligatoire").max(80),
    label: z.string().trim().min(1, "L’intitulé est obligatoire").max(160),
    amountEuros: z.coerce
      .number({ error: "Montant invalide" })
      .positive("Le montant doit être supérieur à 0")
      .max(100_000, "Montant trop élevé"),
    entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
    paymentMethod: z.string().trim().max(40).optional(),
    note: z.string().trim().max(500).optional(),
  })
  // La catégorie doit appartenir à la liste du bon type : pas de dépense
  // rangée dans « Subvention ».
  .refine((value) => CATEGORIES[value.type]?.includes(value.category), {
    path: ["category"],
    message: "Cette catégorie ne correspond pas au type de mouvement.",
  });

/** Saisie manuelle d'une recette ou d'une dépense. */
export async function addAccountingEntry(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = accountingSchema.safeParse({
    type: formData.get("type"),
    category: formData.get("category"),
    label: formData.get("label"),
    amountEuros: formData.get("amountEuros"),
    entryDate: formData.get("entryDate"),
    paymentMethod: formData.get("paymentMethod") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Mouvement invalide.");
  }

  const v = parsed.data;

  await db.insert(schema.accountingEntries).values({
    type: v.type,
    category: v.category,
    // Toujours positif en base : c'est `type` qui porte le sens.
    amountCents: Math.round(v.amountEuros * 100),
    label: v.label,
    entryDate: v.entryDate,
    season: await getSeason(),
    paymentMethod: v.paymentMethod || null,
    note: v.note || null,
  });

  refreshAccounting();
  return { ok: true };
}

/**
 * Supprime une saisie manuelle.
 *
 * Seules les lignes de `accounting_entries` sont concernées : un encaissement
 * de cotisation n'est pas atteignable depuis ici, puisqu'il vit dans
 * `payments`. Une erreur sur une cotisation se corrige dans le module
 * Paiements.
 */
export async function deleteAccountingEntry(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const entryId = String(formData.get("entryId") ?? "");
  if (!z.uuid().safeParse(entryId).success) return fail("Mouvement introuvable.");

  const deleted = await db
    .delete(schema.accountingEntries)
    .where(eq(schema.accountingEntries.id, entryId))
    .returning({ id: schema.accountingEntries.id });

  if (deleted.length === 0) return fail("Mouvement introuvable.");

  refreshAccounting();
  return { ok: true };
}
