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

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING_PAYMENT: "En attente de règlement",
  ACTIVE: "Adhésion validée",
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
  CARD: "Paiement en ligne sécurisé.",
  BANK_TRANSFER: "Les informations de virement seront affichées après l'inscription.",
  CHEQUE: "À remettre directement au club.",
  CASH: "À remettre directement au club.",
};

/** Message affiché sur l'écran de confirmation, selon le mode choisi. */
export const PREFERRED_PAYMENT_METHOD_CONFIRMATIONS: Record<PreferredPaymentMethod, string> = {
  CARD: "Vous pourrez régler votre cotisation en ligne. Le paiement par carte sera activé prochainement.",
  BANK_TRANSFER:
    "Les coordonnées bancaires et votre référence de virement vous seront communiquées.",
  CHEQUE: "Le chèque pourra être remis directement à l'équipe Banat Sport Club.",
  CASH: "Le règlement en espèces pourra être remis directement à l'équipe Banat Sport Club.",
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

/** Contact public de l'association. */
export const CLUB_EMAIL = "banatsportclub@gmail.com";

/**
 * Valeurs par défaut, également écrites dans `settings` par le seed.
 * Elles ne servent que de filet si une clé manque en base.
 */
export const DEFAULT_SEASON = "2026-2027";
export const DEFAULT_ANNUAL_FEE_CENTS = 20000;

export const DEFAULT_GROUP_DISPLAY: Record<
  GroupName,
  { day: string; time: string; place: string }
> = {
  jeudi: { day: "Jeudi", time: "18h00 – 19h30", place: "Dojo Montpellier" },
  dimanche: { day: "Dimanche", time: "10h30 – 12h30", place: "Stade de Grabels" },
};

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
