import { z } from "zod";

import {
  ATTENDANCE_STATUSES,
  GROUP_NAMES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
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

/** Formulaire public d'inscription (/inscription). */
export const registrationSchema = z.object({
  firstName: requiredText("Le prénom"),
  lastName: requiredText("Le nom"),
  birthDate: isoDate,
  schoolLevel: z.enum(SCHOOL_LEVELS),
  schoolName: optionalText(160),
  groupName: z.enum(GROUP_NAMES as [string, ...string[]]),

  guardianFirstName: requiredText("Le prénom du responsable légal"),
  guardianLastName: requiredText("Le nom du responsable légal"),
  guardianPhone: phone,
  guardianEmail: z.email("Adresse email invalide"),

  emergencyFirstName: requiredText("Le prénom du contact d'urgence"),
  emergencyLastName: requiredText("Le nom du contact d'urgence"),
  emergencyPhone: phone,
  emergencyRelationship: optionalText(80),

  allergies: optionalText(),
  currentTreatments: optionalText(),
  healthNotes: optionalText(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/** Enregistrement d'un paiement depuis l'admin (/api/payments). */
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
  groupName: z.enum(GROUP_NAMES as [string, ...string[]]),
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

/** Met à plat les erreurs Zod pour les renvoyer au formulaire. */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
