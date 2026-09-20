import { z } from "zod";

import {
  ATTENDANCE_STATUSES,
  CONSENT_TYPES,
  GROUP_NAMES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PREFERRED_PAYMENT_METHODS,
  SCHOOL_LEVELS,
} from "./constants";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : AAAA-MM-JJ");

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} est obligatoire`).max(max);

const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const phone = z
  .string()
  .trim()
  .min(6, "Numéro de téléphone trop court")
  .max(20, "Numéro de téléphone trop long");

const groupName = z.enum(GROUP_NAMES as [string, ...string[]]);

/** Même liste, avec un message parlant pour le formulaire public. */
const chosenGroupName = z.enum(GROUP_NAMES as [string, ...string[]], {
  error: "Merci de choisir un créneau",
});

// --- Étapes du formulaire d'inscription -----------------------------------
// Chaque étape a son propre schéma : le formulaire valide l'étape courante
// avant de laisser passer à la suivante, et l'API valide l'ensemble.

/** Étape 1 — l'adhérente. */
export const memberStepSchema = z.object({
  firstName: requiredText("Le prénom"),
  lastName: requiredText("Le nom"),
  birthDate: z
    .string()
    .trim()
    .min(1, "La date de naissance est obligatoire")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide"),
  schoolLevel: z.enum(SCHOOL_LEVELS, { error: "Merci de choisir une classe" }),
  schoolName: requiredText("L'établissement scolaire", 160),
});

/** Étape 2 — le créneau. */
export const groupStepSchema = z.object({
  groupName: chosenGroupName,
});

/** Étape 3 — le responsable légal. */
export const guardianStepSchema = z.object({
  guardianFirstName: requiredText("Le prénom du responsable légal"),
  guardianLastName: requiredText("Le nom du responsable légal"),
  guardianPhone: phone,
  guardianEmail: z.email("Adresse email invalide"),
});

/** Étape 4 — le contact d'urgence. */
export const emergencyStepSchema = z.object({
  emergencyFirstName: requiredText("Le prénom du contact d'urgence"),
  emergencyLastName: requiredText("Le nom du contact d'urgence"),
  emergencyPhone: phone,
  emergencyRelationship: requiredText("Le lien avec l'adhérente", 80),
});

/** Étape 5 — la fiche sanitaire. Tout est facultatif. */
export const medicalStepSchema = z.object({
  allergies: optionalText(),
  currentTreatments: optionalText(),
  healthNotes: optionalText(),
});

/**
 * Étape 6 — les autorisations.
 *
 * Règlement intérieur et autorisation parentale sont obligatoires. Le droit à
 * l'image est un choix libre : un refus est une réponse valide et ne bloque
 * jamais l'inscription.
 */
export const consentsStepSchema = z.object({
  acceptsInternalRules: z
    .boolean()
    .refine((value) => value, "Le règlement intérieur doit être accepté"),
  acceptsParentalAuthorization: z
    .boolean()
    .refine((value) => value, "L'autorisation parentale est obligatoire"),
  acceptsImageRights: z.boolean(),
  guardianFullName: requiredText("Le nom du parent signataire", 160),
  // Renseigné plus tard, quand la signature digitale et R2 seront en place.
  signatureFileKey: optionalText(300),
});

/** Étape 7 — le mode de règlement souhaité (aucun encaissement à ce stade). */
export const paymentStepSchema = z.object({
  preferredPaymentMethod: z.enum(PREFERRED_PAYMENT_METHODS, {
    error: "Merci de choisir un mode de règlement",
  }),
});

/** Schéma complet envoyé à POST /api/registration. */
export const registrationSchema = z.object({
  ...memberStepSchema.shape,
  ...groupStepSchema.shape,
  ...guardianStepSchema.shape,
  ...emergencyStepSchema.shape,
  ...medicalStepSchema.shape,
  ...consentsStepSchema.shape,
  ...paymentStepSchema.shape,
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/** Les schémas des 7 étapes saisies, dans l'ordre. L'étape 8 est un récapitulatif. */
export const REGISTRATION_STEP_SCHEMAS = [
  memberStepSchema,
  groupStepSchema,
  guardianStepSchema,
  emergencyStepSchema,
  medicalStepSchema,
  consentsStepSchema,
  paymentStepSchema,
] as const;

// --- Autres schémas -------------------------------------------------------

/** Une ligne de la table `consents`. */
export const consentSchema = z.object({
  memberId: z.uuid(),
  type: z.enum(CONSENT_TYPES),
  accepted: z.boolean().default(false),
  guardianFullName: optionalText(160),
  signatureFileKey: optionalText(300),
  documentVersion: optionalText(40),
  acceptedAt: z.coerce.date().optional(),
});

export type ConsentInput = z.infer<typeof consentSchema>;

/** Enregistrement d'un encaissement depuis l'admin (/api/payments). */
export const paymentSchema = z.object({
  memberId: z.uuid(),
  amountCents: z.coerce.number().int().positive().max(1_000_000),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES).default("pending"),
  notes: optionalText(500),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

/** Saisie des présences depuis l'admin (/api/attendance). */
export const attendanceSchema = z.object({
  groupName,
  sessionDate: isoDate,
  entries: z
    .array(
      z.object({
        memberId: z.uuid(),
        status: z.enum(ATTENDANCE_STATUSES),
        notes: optionalText(300),
      }),
    )
    .min(1, "Aucune présence à enregistrer"),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;

/** Met à plat les erreurs Zod pour les afficher sous chaque champ. */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
