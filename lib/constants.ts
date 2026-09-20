/** Valeurs de référence partagées par le site public et l'admin. */

export const GROUPS = {
  jeudi: {
    label: "Jeudi",
    schedule: "Jeudi 18h00 – 19h30",
    place: "Dojo Montpellier",
    startTime: "18:00",
    endTime: "19:30",
    // 4 = jeudi (getDay), 0 = dimanche
    weekday: 4,
  },
  dimanche: {
    label: "Dimanche",
    schedule: "Dimanche 10h30 – 12h30",
    place: "Stade de Grabels",
    startTime: "10:30",
    endTime: "12:30",
    weekday: 0,
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

export const SCHOOL_LEVEL_LABELS: Record<(typeof SCHOOL_LEVELS)[number], string> = {
  "6e": "6e",
  "5e": "5e",
  "4e": "4e",
  "3e": "3e",
  "2nde": "Seconde",
  "1ere": "Première",
  terminale: "Terminale",
};

export const REGISTRATION_STATUSES = ["pending", "confirmed", "cancelled"] as const;
export const REGISTRATION_STATUS_LABELS: Record<
  (typeof REGISTRATION_STATUSES)[number],
  string
> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
};

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

/** Valeurs par défaut, également insérées dans la table `settings` par le seed. */
export const DEFAULT_SEASON = "2026-2027";
export const DEFAULT_ANNUAL_FEE_CENTS = 15000;

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
