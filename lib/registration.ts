import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";

import { db, schema } from "./db";
import { getSeason } from "./settings";
import type { RegistrationInput } from "./validation";

/** Numéro d'adhérente lisible : BSC-2026-001. */
function buildMemberNumber(season: string, sequence: number): string {
  const year = season.split("-")[0];
  return `BSC-${year}-${String(sequence).padStart(3, "0")}`;
}

/**
 * Crée une adhérente et ses enregistrements liés.
 *
 * Le driver HTTP de Neon ne gère pas les transactions interactives : on génère
 * donc l'uuid côté application et on envoie les quatre INSERT via db.batch(),
 * qui les exécute dans une seule transaction.
 */
export async function createRegistration(input: RegistrationInput) {
  const season = await getSeason();
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.members)
    .where(eq(schema.members.season, season));

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const memberId = randomUUID();
    const memberNumber = buildMemberNumber(season, total + 1 + attempt);

    try {
      await db.batch([
        db.insert(schema.members).values({
          id: memberId,
          memberNumber,
          firstName: input.firstName,
          lastName: input.lastName,
          birthDate: input.birthDate,
          schoolLevel: input.schoolLevel,
          schoolName: input.schoolName,
          groupName: input.groupName,
          season,
          registrationStatus: "pending",
        }),
        db.insert(schema.guardians).values({
          memberId,
          firstName: input.guardianFirstName,
          lastName: input.guardianLastName,
          phone: input.guardianPhone,
          email: input.guardianEmail,
        }),
        db.insert(schema.emergencyContacts).values({
          memberId,
          firstName: input.emergencyFirstName,
          lastName: input.emergencyLastName,
          phone: input.emergencyPhone,
          relationship: input.emergencyRelationship,
        }),
        db.insert(schema.medicalInfo).values({
          memberId,
          allergies: input.allergies,
          currentTreatments: input.currentTreatments,
          healthNotes: input.healthNotes,
        }),
      ]);

      return { id: memberId, memberNumber, season };
    } catch (error) {
      // 23505 = violation de contrainte unique : le numéro vient d'être pris,
      // on retente avec le suivant.
      const isDuplicate =
        error instanceof Error && "code" in error && (error as { code?: string }).code === "23505";
      if (!isDuplicate) throw error;
    }
  }

  throw new Error("Impossible de générer un numéro d'adhérente unique.");
}
