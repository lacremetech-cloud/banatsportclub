import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";

import {
  CONSENT_TYPES,
  DEFAULT_REGISTRATION_STATUS,
  type ConsentType,
} from "./constants";
import { db, schema } from "./db";
import { DEFAULT_FEE_TYPE, DEFAULT_INSTALLMENTS } from "./fees";
import { getSiteSettings } from "./settings";
import type { RegistrationInput } from "./validation";

export type RegistrationResult = {
  id: string;
  memberNumber: string;
  season: string;
  /** Montant figé sur cette adhésion, pas le tarif général. */
  feeAmountCents: number;
  paymentInstallments: number;
  firstName: string;
  lastName: string;
  groupName: string;
  preferredPaymentMethod: string;
  registrationStatus: string;
};

/**
 * Numéro d'adhérente : BSC-26-0001.
 *
 * Le compteur vient d'une séquence Postgres (`member_number_seq`).
 * `nextval()` est atomique : deux inscriptions simultanées obtiennent deux
 * valeurs différentes, là où un SELECT COUNT(*) + 1 renverrait deux fois le
 * même numéro. La contrainte UNIQUE sur member_number reste le filet final.
 */
async function nextMemberNumber(season: string): Promise<string> {
  const result = await db.execute<{ value: string }>(
    sql`SELECT nextval('member_number_seq') AS value`,
  );
  const rows = Array.isArray(result) ? result : result.rows;
  const sequence = Number(rows[0].value);
  const shortYear = season.slice(2, 4); // "2026-2027" -> "26"
  return `BSC-${shortYear}-${String(sequence).padStart(4, "0")}`;
}

/** Les 3 lignes de consentement, créées systématiquement. */
function buildConsents(
  memberId: string,
  input: RegistrationInput,
  documentVersion: string,
) {
  const accepted: Record<ConsentType, boolean> = {
    INTERNAL_RULES: input.acceptsInternalRules,
    PARENTAL_AUTHORIZATION: input.acceptsParentalAuthorization,
    // Un refus est enregistré tel quel : la ligne existe avec accepted = false.
    IMAGE_RIGHTS: input.acceptsImageRights,
  };

  return CONSENT_TYPES.map((type) => ({
    memberId,
    type,
    accepted: accepted[type],
    guardianFullName: input.guardianFullName,
    signatureFileKey: input.signatureFileKey,
    documentVersion,
    acceptedAt: accepted[type] ? new Date() : null,
  }));
}

/**
 * Crée une adhérente et tous ses enregistrements liés.
 *
 * Le driver HTTP de Neon ne gère pas les transactions interactives : les
 * INSERT partent donc via db.batch(), qui les exécute dans une seule
 * transaction. L'uuid de l'adhérente est généré côté application pour que les
 * clés étrangères soient connues avant l'envoi.
 *
 * Aucun paiement n'est créé ici : seul le mode de règlement souhaité est
 * enregistré sur l'adhérente.
 *
 * La cotisation est FIGÉE à l'inscription : le tarif du jour est recopié sur
 * la fiche. Une révision ultérieure du tarif général ne modifiera donc pas ce
 * que cette adhérente devait pour sa saison. Toute inscription publique est
 * STANDARD : les cotisations solidaire et offerte sont accordées par le
 * bureau depuis le CRM, jamais choisies par la famille.
 */
export async function createRegistration(
  input: RegistrationInput,
): Promise<RegistrationResult> {
  const { season, annualFeeCents } = await getSiteSettings();
  const memberId = randomUUID();
  const memberNumber = await nextMemberNumber(season);
  const consents = buildConsents(memberId, input, season);

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
      registrationStatus: DEFAULT_REGISTRATION_STATUS,
      preferredPaymentMethod: input.preferredPaymentMethod,
      feeType: DEFAULT_FEE_TYPE,
      feeAmountCents: annualFeeCents,
      paymentInstallments: input.paymentInstallments ?? DEFAULT_INSTALLMENTS,
    }),
    db.insert(schema.guardians).values({
      memberId,
      firstName: input.guardianFirstName,
      lastName: input.guardianLastName,
      phone: input.guardianPhone,
      email: input.guardianEmail,
    }),
    db.insert(schema.emergencyContacts).values([
      {
        memberId,
        priority: 1,
        // Quand la famille a coché « c'est la même personne », on recopie le
        // responsable légal : identité ET numéro. Rien n'est ressaisi.
        firstName: input.emergencySameAsGuardian
          ? input.guardianFirstName
          : (input.emergencyFirstName ?? ""),
        lastName: input.emergencySameAsGuardian
          ? input.guardianLastName
          : (input.emergencyLastName ?? null),
        phone: input.emergencySameAsGuardian
          ? input.guardianPhone
          : (input.emergencyPhone ?? ""),
        // La relation du responsable n'est pas demandée à l'étape 3 : on
        // enregistre ce qu'on sait réellement de lui.
        relationship: input.emergencySameAsGuardian
          ? "Responsable légal"
          : (input.emergencyRelationship ?? null),
      },
      {
        memberId,
        priority: 2,
        firstName: input.secondFirstName,
        lastName: null,
        phone: input.secondPhone,
        relationship: input.secondRelationship,
      },
    ]),
    db.insert(schema.medicalInfo).values({
      memberId,
      allergies: input.allergies,
      currentTreatments: input.currentTreatments,
      healthNotes: input.healthNotes,
    }),
    db.insert(schema.consents).values(consents),
  ]);

  return {
    id: memberId,
    memberNumber,
    season,
    feeAmountCents: annualFeeCents,
    paymentInstallments: input.paymentInstallments ?? DEFAULT_INSTALLMENTS,
    firstName: input.firstName,
    lastName: input.lastName,
    groupName: input.groupName,
    preferredPaymentMethod: input.preferredPaymentMethod,
    registrationStatus: DEFAULT_REGISTRATION_STATUS,
  };
}
