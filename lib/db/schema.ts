import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgSequence,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Schéma Banat Sport Club.
 *
 * Conventions volontairement simples :
 * - les identifiants sont des uuid générés par Postgres ;
 * - les "statuts" sont de simples colonnes texte, validées côté application
 *   par Zod (voir lib/validation.ts). Pas d'enum Postgres : c'est plus facile
 *   à faire évoluer sans migration lourde ;
 * - les montants sont stockés en CENTIMES (entier) pour éviter tout arrondi.
 */

/**
 * Source des numéros d'adhérente (BSC-26-0001).
 *
 * Une séquence Postgres garantit l'unicité même si deux inscriptions
 * arrivent en même temps : `nextval()` est atomique, contrairement à un
 * SELECT COUNT(*) + 1 qui peut renvoyer deux fois la même valeur.
 */
export const memberNumberSeq = pgSequence("member_number_seq", {
  startWith: 1,
  increment: 1,
});

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberNumber: text("member_number").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    birthDate: date("birth_date").notNull(),
    schoolLevel: text("school_level").notNull(),
    schoolName: text("school_name"),
    groupName: text("group_name").notNull(),
    season: text("season").notNull(),
    registrationStatus: text("registration_status").notNull().default("PENDING_PAYMENT"),
    // Mode de règlement choisi à l'inscription : CARD | BANK_TRANSFER | CHEQUE | CASH.
    // C'est une intention, pas un encaissement (voir la table payments).
    preferredPaymentMethod: text("preferred_payment_method"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("members_season_idx").on(t.season),
    index("members_group_idx").on(t.groupName),
  ],
);

export const guardians = pgTable(
  "guardians",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
  },
  (t) => [index("guardians_member_idx").on(t.memberId)],
);

export const emergencyContacts = pgTable(
  "emergency_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    relationship: text("relationship"),
  },
  (t) => [index("emergency_contacts_member_idx").on(t.memberId)],
);

export const medicalInfo = pgTable(
  "medical_info",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    allergies: text("allergies"),
    currentTreatments: text("current_treatments"),
    healthNotes: text("health_notes"),
  },
  (t) => [index("medical_info_member_idx").on(t.memberId)],
);

/**
 * Consentements et autorisations signés à l'inscription.
 * `signature_file_key` pointera vers l'objet Cloudflare R2 ; il reste nullable
 * tant que R2 n'est pas branché.
 */
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    accepted: boolean("accepted").notNull().default(false),
    guardianFullName: text("guardian_full_name"),
    signatureFileKey: text("signature_file_key"),
    documentVersion: text("document_version"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("consents_member_idx").on(t.memberId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    // Montant en centimes d'euro : 150 € => 15000.
    amountCents: integer("amount_cents").notNull(),
    method: text("method").notNull(),
    status: text("status").notNull().default("pending"),
    provider: text("provider"),
    providerPaymentId: text("provider_payment_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    // Horodatage de l'email « paiement reçu ». Sert à ne l'envoyer qu'une
    // fois, même si le webhook du prestataire arrive plusieurs fois.
    paidEmailSentAt: timestamp("paid_email_sent_at", { withTimezone: true }),
  },
  (t) => [
    index("payments_member_idx").on(t.memberId),
    index("payments_status_idx").on(t.status),
    // Idempotence : un paiement prestataire ne peut donner qu'une seule
    // ligne. Index partiel, car les saisies manuelles n'ont pas d'identifiant
    // externe et doivent rester multiples.
    uniqueIndex("payments_provider_payment_id_unique")
      .on(t.providerPaymentId)
      .where(sql`${t.providerPaymentId} is not null`),
  ],
);

/** Séances d'entraînement (jeudi / dimanche). */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupName: text("group_name").notNull(),
    sessionDate: date("session_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    status: text("status").notNull().default("planned"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_group_date_unique").on(t.groupName, t.sessionDate)],
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    notes: text("notes"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("attendance_session_member_unique").on(t.sessionId, t.memberId)],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    authorName: text("author_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notes_member_idx").on(t.memberId)],
);

/** Documents (certificat médical, autorisation parentale, signature...). */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    fileName: text("file_name").notNull(),
    // Clé de l'objet dans le futur bucket Cloudflare R2.
    fileKey: text("file_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("documents_member_idx").on(t.memberId)],
);

/** Réglages de l'association (saison en cours, montant de la cotisation...). */
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Consent = typeof consents.$inferSelect;
export type NewConsent = typeof consents.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
