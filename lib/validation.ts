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
import { INSTALLMENT_PLANS, PUBLIC_INSTALLMENT_PLANS } from "./fees";

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
  schoolName: requiredText("L’établissement scolaire", 160),
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

/**
 * Étape 4 — qui joindre en cas d'urgence.
 *
 * Deux contacts distincts, parce que l'objectif est pratique : si le premier
 * ne répond pas, le bureau doit savoir immédiatement qui appeler ensuite, et
 * à qui appartient le numéro.
 *
 * 1. Le contact principal. Dans le cas le plus courant c'est le responsable
 *    légal lui-même : la case à cocher évite alors de resaisir une identité
 *    déjà donnée à l'étape précédente.
 * 2. Le deuxième numéro, toujours demandé, avec le prénom et le lien de la
 *    personne — jamais un numéro orphelin.
 */
const emergencyStepShape = {
  emergencySameAsGuardian: z.boolean(),
  // Contact principal : obligatoires seulement si ce n'est pas le responsable.
  emergencyFirstName: z.string().trim().max(120).optional(),
  emergencyLastName: z.string().trim().max(120).optional(),
  emergencyPhone: z.string().trim().max(20).optional(),
  emergencyRelationship: z.string().trim().max(80).optional(),
  // Deuxième numéro : toujours obligatoire.
  secondFirstName: requiredText("Le prénom du deuxième contact"),
  secondPhone: phone,
  secondRelationship: requiredText("Le lien du deuxième contact", 80),
};

type EmergencyValues = {
  emergencySameAsGuardian: boolean;
  emergencyFirstName?: string;
  emergencyLastName?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;
};

function checkEmergencyContact(values: EmergencyValues, ctx: z.RefinementCtx) {
  if (values.emergencySameAsGuardian) return;

  const required: [keyof EmergencyValues, string][] = [
    ["emergencyFirstName", "Le prénom du contact d’urgence"],
    ["emergencyLastName", "Le nom du contact d’urgence"],
    ["emergencyPhone", "Le téléphone du contact d’urgence"],
    ["emergencyRelationship", "Le lien avec l’adhérente"],
  ];

  for (const [field, label] of required) {
    if (!String(values[field] ?? "").trim()) {
      ctx.addIssue({ code: "custom", path: [field], message: `${label} est obligatoire` });
    }
  }

  const phoneValue = String(values.emergencyPhone ?? "").trim();
  if (phoneValue && phoneValue.length < 6) {
    ctx.addIssue({
      code: "custom",
      path: ["emergencyPhone"],
      message: "Numéro de téléphone trop court",
    });
  }
}

export const emergencyStepSchema = z
  .object(emergencyStepShape)
  .superRefine(checkEmergencyContact);

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
    .refine((value) => value, "L’autorisation parentale est obligatoire"),
  acceptsImageRights: z.boolean(),
  guardianFullName: requiredText("Le nom du parent signataire", 160),
  // Réservé au futur dépôt d'un document signé sur papier (bucket R2). Le
  // formulaire ne le remplit pas : l'engagement en ligne repose sur le nom du
  // signataire et l'horodatage du consentement, pas sur une image de signature.
  signatureFileKey: optionalText(300),
});

/**
 * Étape 7 — le mode de règlement souhaité (aucun encaissement à ce stade).
 *
 * L'échéancier public se limite à 1 ou 2 fois. Le 3 fois existe en base et
 * dans le CRM, mais il est accordé au cas par cas par le bureau : l'accepter
 * ici reviendrait à le proposer à tout le monde.
 */
export const paymentStepSchema = z.object({
  preferredPaymentMethod: z.enum(PREFERRED_PAYMENT_METHODS, {
    error: "Merci de choisir un mode de règlement",
  }),
  paymentInstallments: z.coerce
    .number()
    .refine(
      (value) => PUBLIC_INSTALLMENT_PLANS.includes(value as 1 | 2),
      "Merci de choisir un rythme de paiement",
    )
    .default(1),
});

/** Échéancier modifiable par le bureau : 1, 2 ou 3 fois. */
export const adminInstallmentsSchema = z.coerce
  .number()
  .refine(
    (value) => INSTALLMENT_PLANS.includes(value as 1 | 2 | 3),
    "Échéancier invalide",
  );

/** Schéma complet envoyé à POST /api/registration. */
export const registrationSchema = z.object({
  ...memberStepSchema.shape,
  ...groupStepSchema.shape,
  ...guardianStepSchema.shape,
  ...emergencyStepShape,
  ...medicalStepSchema.shape,
  ...consentsStepSchema.shape,
  ...paymentStepSchema.shape,
}).superRefine(checkEmergencyContact);

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
