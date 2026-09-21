/**
 * Valeurs de référence partagées par le site public et l'admin.
 *
 * Règle importante : les horaires, lieux et tarifs AFFICHÉS viennent de la
 * table `settings` (voir lib/settings.ts). On ne garde ici que ce qui est
 * technique (jour de la semaine, heures SQL des séances) ou purement
 * applicatif (listes de statuts, libellés).
 */

/** Données techniques des deux groupes. L'affichage vient des settings. */
export const GROUPS = {
  jeudi: {
    // 4 = jeudi, 0 = dimanche (Date.getDay)
    weekday: 4,
    startTime: "18:00",
    endTime: "19:30",
  },
  dimanche: {
    weekday: 0,
    startTime: "10:30",
    endTime: "12:30",
  },
} as const;

export type GroupName = keyof typeof GROUPS;
export const GROUP_NAMES = Object.keys(GROUPS) as GroupName[];

export const SCHOOL_LEVELS = [
  "6e",
  "5e",
  "4e",
  "3e",
  "2nde",
  "1ere",
  "terminale",
] as const;

export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  "6e": "6e",
  "5e": "5e",
  "4e": "4e",
  "3e": "3e",
  "2nde": "2nde",
  "1ere": "1ère",
  terminale: "Terminale",
};

/**
 * Statuts d'inscription. Le règlement intérieur prévoit qu'une adhésion n'est
 * définitive qu'après réception du dossier complet et de la cotisation : toute
 * inscription démarre donc en PENDING_PAYMENT.
 */
export const REGISTRATION_STATUSES = ["PENDING_PAYMENT", "ACTIVE", "CANCELLED"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
export const DEFAULT_REGISTRATION_STATUS: RegistrationStatus = "PENDING_PAYMENT";

/**
 * Libellés du statut d'ADHÉSION — à ne pas confondre avec le statut de
 * paiement (voir lib/crm.ts). Une adhérente « Validée » peut parfaitement
 * avoir un reste à régler : c'est le principe de l'échéancier.
 */
export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING_PAYMENT: "En attente",
  ACTIVE: "Validée",
  CANCELLED: "Annulée",
};

/**
 * Mode de règlement choisi par la famille au moment de l'inscription
 * (`members.preferred_payment_method`). À ne pas confondre avec
 * `payments.method`, qui décrit un encaissement réellement constaté.
 */
export const PREFERRED_PAYMENT_METHODS = ["CARD", "BANK_TRANSFER", "CHEQUE", "CASH"] as const;
export type PreferredPaymentMethod = (typeof PREFERRED_PAYMENT_METHODS)[number];

export const PREFERRED_PAYMENT_METHOD_LABELS: Record<PreferredPaymentMethod, string> = {
  CARD: "Carte bancaire",
  BANK_TRANSFER: "Virement instantané",
  CHEQUE: "Chèque",
  CASH: "Espèces",
};

/** Phrase affichée sous chaque option à l'étape 7 du formulaire. */
export const PREFERRED_PAYMENT_METHOD_HINTS: Record<PreferredPaymentMethod, string> = {
  CARD: "Paiement en ligne sécurisé, dès la fin de l'inscription.",
  BANK_TRANSFER: "Les informations de virement seront affichées après l'inscription.",
  CHEQUE: "À remettre directement au club.",
  CASH: "À remettre directement au club.",
};

/** Encaissements constatés par le bureau (table `payments`). */
export const PAYMENT_METHODS = ["card", "transfer", "cheque", "cash"] as const;
export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  card: "Carte bancaire",
  transfer: "Virement",
  cheque: "Chèque",
  cash: "Espèces",
};

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export const PAYMENT_STATUS_LABELS: Record<(typeof PAYMENT_STATUSES)[number], string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
};

export const ATTENDANCE_STATUSES = ["present", "absent", "excused", "late"] as const;
export const ATTENDANCE_STATUS_LABELS: Record<
  (typeof ATTENDANCE_STATUSES)[number],
  string
> = {
  present: "Présente",
  absent: "Absente",
  excused: "Excusée",
  late: "En retard",
};

export const SESSION_STATUSES = ["planned", "done", "cancelled"] as const;

export const CONSENT_TYPES = [
  "INTERNAL_RULES",
  "PARENTAL_AUTHORIZATION",
  "IMAGE_RIGHTS",
] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  INTERNAL_RULES: "Règlement intérieur",
  PARENTAL_AUTHORIZATION: "Autorisation parentale",
  IMAGE_RIGHTS: "Droit à l'image",
};

/**
 * Catégories de trésorerie.
 *
 * Volontairement courtes et parlantes : ce n'est pas un plan comptable, juste
 * de quoi ranger un mouvement en un coup d'œil.
 */
export const INCOME_CATEGORIES = [
  "Don",
  "Subvention",
  "Participation événement",
  "Autre",
] as const;

export const EXPENSE_CATEGORIES = [
  "Matériel",
  "Salle / équipement",
  "Assurance",
  "Transport",
  "Communication",
  "Prestataire",
  "Reversement club partenaire",
  "Autre",
] as const;

/** Auteurs proposés pour les notes internes. Le champ reste libre. */
export const NOTE_AUTHORS = ["Bureau BSC", "Rayyan", "Imen", "Dawssen"] as const;
export const DEFAULT_NOTE_AUTHOR = "Bureau BSC";

/** Contacts publics de l'association. */
export const CLUB_EMAIL = "banatsportclub@gmail.com";
export const CLUB_PHONE = "06 25 77 35 92";

/**
 * Exemples de lien de parenté proposés pour les contacts d'urgence.
 * Le champ reste libre : une situation familiale ne rentre pas toujours
 * dans une liste.
 */
export const RELATIONSHIP_SUGGESTIONS = [
  "Mère",
  "Père",
  "Tante",
  "Oncle",
  "Sœur",
  "Frère",
  "Autre",
] as const;

/**
 * Valeurs par défaut, également écrites dans `settings` par le seed.
 * Elles ne servent que de filet si une clé manque en base.
 */
export const DEFAULT_SEASON = "2026-2027";
export const DEFAULT_ANNUAL_FEE_CENTS = 20000;

/**
 * Affichage par défaut des deux créneaux.
 *
 * `levels` guide le parent vers le bon groupe sans rien verrouiller : la 3e
 * est volontairement éligible aux deux, et le bureau peut accepter une
 * situation particulière (voir le numéro de contact affiché à l'étape).
 */
export const DEFAULT_GROUP_DISPLAY: Record<
  GroupName,
  { day: string; levels: string; time: string; place: string; address: string }
> = {
  jeudi: {
    day: "Jeudi soir",
    levels: "6e à 3e",
    time: "18h00 – 19h30",
    place: "Complexe sportif des Garrigues — Haut de Massane",
    address: "297 Av. du Comté de Nice, 34080 Montpellier",
  },
  dimanche: {
    day: "Dimanche matin",
    levels: "3e à Terminale",
    time: "10h30 – 12h30",
    place: "Stade Serge Oltra — Grabels",
    address: "Rue du Mas d'Armand, 34790 Grabels",
  },
};

/** Lien Google Maps vers un lieu, à partir de son nom et de son adresse. */
export function mapsUrl(place: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place} ${address}`,
  )}`;
}

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}
