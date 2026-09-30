/**
 * Valeurs de référence partagées par le site public et l'admin.
 *
 * Règle importante : les horaires, lieux et tarifs AFFICHÉS viennent de la
 * table `settings` (voir lib/settings.ts). On ne garde ici que ce qui est
 * technique (jour de la semaine, heures SQL des séances) ou purement
 * applicatif (listes de statuts, libellés).
 */

/**
 * Données techniques des groupes. L'affichage vient des settings, sauf pour le
 * créneau public : voir `CURRENT_SCHEDULE`.
 *
 * Le club n'ouvre plus qu'un créneau au public, le jeudi, et il accueille
 * toutes les classes. `dimanche` reste déclaré parce que des adhérentes, des
 * séances et des présences y sont rattachées en base : le supprimer casserait
 * la relecture de l'historique et les exports. Il n'est simplement plus
 * proposé nulle part côté public — voir `PUBLIC_GROUP`.
 */
export const GROUPS = {
  jeudi: {
    // 4 = jeudi, 0 = dimanche (Date.getDay)
    weekday: 4,
    startTime: "18:00",
    endTime: "19:30",
    levels: ["6e", "5e", "4e", "3e", "2nde", "1ere", "terminale"],
  },
  dimanche: {
    weekday: 0,
    startTime: "10:30",
    endTime: "12:30",
    levels: ["3e", "2nde", "1ere", "terminale"],
  },
} as const;

/**
 * Le seul créneau ouvert au public.
 *
 * Toute inscription venant du site y est rattachée sans que la famille ait à
 * choisir : il n'y a rien à choisir. Le dimanche existe encore en base et dans
 * l'espace bureau — c'est une solution de repli interne — mais aucun parcours
 * public ne doit y conduire ni le mentionner.
 */
export const PUBLIC_GROUP = "jeudi" as const;

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
  "EMERGENCY_MEDICAL",
  "IMAGE_RIGHTS",
] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  INTERNAL_RULES: "Règlement intérieur",
  PARENTAL_AUTHORIZATION: "Autorisation parentale",
  EMERGENCY_MEDICAL: "Intervention médicale d’urgence",
  IMAGE_RIGHTS: "Droit à l'image",
};

/**
 * Le droit à l'image est le seul consentement refusable : une famille a le
 * droit de dire non, et ce refus n'est pas un dossier incomplet. Les autres
 * sont obligatoires pour que l'adhérente puisse pratiquer.
 */
export const OPTIONAL_CONSENT_TYPES: ConsentType[] = ["IMAGE_RIGHTS"];

/**
 * Assurance individuelle accident de l'adhérente.
 *
 * L'association porte sa propre responsabilité civile (article L321-1 du code
 * du sport) ; la garantie individuelle accident, elle, couvre les blessures
 * que l'adhérente subit elle-même et relève de la famille. La question est
 * posée à l'inscription pour deux raisons : garder la trace de l'information
 * donnée (article L321-4) et permettre au bureau de relancer les familles non
 * couvertes. Aucune réponse ne bloque l'inscription, « Je ne sais pas »
 * comprise — c'est une réponse honnête et fréquente.
 */
export const INSURANCE_STATUSES = ["YES", "NO", "UNKNOWN"] as const;

export type InsuranceStatus = (typeof INSURANCE_STATUSES)[number];

export const INSURANCE_STATUS_LABELS: Record<InsuranceStatus, string> = {
  YES: "Oui, elle est couverte",
  NO: "Non",
  UNKNOWN: "Je ne sais pas",
};

/** Libellé court pour le CRM et les exports. */
export const INSURANCE_STATUS_SHORT_LABELS: Record<InsuranceStatus, string> = {
  YES: "Couverte",
  NO: "Non couverte",
  UNKNOWN: "Non renseignée",
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

/**
 * Identité et contacts publics de l'association.
 *
 * Ce ne sont que des valeurs par défaut : l'affichage passe par `settings`
 * (voir lib/settings.ts), modifiable depuis /admin/parametres. Elles servent
 * de filet si une clé manque en base.
 */
export const DEFAULT_CLUB_NAME = "Banat Sport Club";
export const DEFAULT_CLUB_EMAIL = "banatsportclub@gmail.com";
export const DEFAULT_CLUB_PHONE = "07 75 76 53 03";

/**
 * Là où le bureau reçoit les familles, sur rendez-vous.
 *
 * Ce n'est ni un lieu d'entraînement ni — tant que ce n'est pas confirmé — le
 * siège social : c'est l'adresse où l'on se rencontre pour monter un dossier
 * ensemble. Elle figure sur l'accueil et dans le pied de page, d'où sa place
 * ici plutôt que dans l'une des deux pages.
 *
 * Nom du lieu et rue sont séparés pour que `mapsUrl` puisse les recomposer ;
 * à l'affichage, ils se rejoignent par une virgule.
 */
export const RENDEZ_VOUS = {
  place: "Bureaux & Co – Parc 2000",
  address: "84 rue Maurice Béjart, 34080 Montpellier",
} as const;

/** L'adresse telle qu'on la lit, d'un seul tenant. */
export const RENDEZ_VOUS_FULL = `${RENDEZ_VOUS.place}, ${RENDEZ_VOUS.address}`;

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
  {
    day: string;
    levels: string;
    time: string;
    place: string;
    address: string;
    shortLabel: string;
  }
> = {
  jeudi: {
    day: "Jeudi soir",
    levels: "6e à 4e",
    time: "18h00 – 19h30",
    place: "Complexe sportif des Garrigues — Haut de Massane",
    address: "145 Av. du Comté de Nice, 34080 Montpellier",
    shortLabel: "Jeudi soir — Dojo",
  },
  dimanche: {
    day: "Dimanche matin",
    levels: "3e à Terminale",
    time: "10h30 – 12h30",
    place: "Stade Serge Oltra — Grabels",
    address: "Rue du Mas d'Armand, 34790 Grabels",
    shortLabel: "Dimanche matin — Stade Grabels",
  },
};

/**
 * Deux écritures d'un même créneau, et c'est volontaire :
 *
 * - `place` + `address` servent au parcours public, où un parent doit pouvoir
 *   trouver le gymnase sans connaître le club ;
 * - `shortLabel` sert au CRM, où le bureau sait déjà où ont lieu les séances
 *   et où une adresse complète répétée sur chaque ligne encombre l'écran.
 */

/** Lien Google Maps vers un lieu, à partir de son nom et de son adresse. */
export function mapsUrl(place: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place} ${address}`,
  )}`;
}

/**
 * LE CRÉNEAU — ce que le site public dit des séances.
 *
 * Ces valeurs ne viennent volontairement pas de la table `settings` : le
 * formulaire de réglages n'expose aucun champ de créneau, si bien qu'elles
 * n'étaient modifiables que par une écriture SQL directe. Une ligne périmée en
 * base aurait alors silencieusement supplanté le code — c'est exactement ce
 * qui s'est produit, la page annonçant « 6e à 4e » le jeudi bien après que le
 * créneau ait été ouvert à toutes les classes.
 *
 * Les libellés courts du CRM restent dans `DEFAULT_GROUP_DISPLAY` : l'espace
 * bureau gère les deux groupes, l'historique compris.
 */
export const CURRENT_SCHEDULE = {
  group: PUBLIC_GROUP,
  day: "Jeudi soir",
  time: "18h00 – 19h30",
  levels: "6e à Terminale",
  /** Accueil et départ : une séance n'est pas une porte qui claque. */
  arrival: "17h45",
  departure: "19h45",
  place: "Complexe sportif des Garrigues",
  address: "145 avenue du Comté de Nice, Montpellier",
  /** Ce que le lieu a de concret à offrir. */
  venue:
    "Plus de 200 m² de tatamis, en salle : de la place pour bouger, jouer au ballon, tomber sans se faire mal et profiter pleinement de la séance.",
} as const;

/** Itinéraire vers le lieu des séances, dérivé de `CURRENT_SCHEDULE`. */
export const CURRENT_SCHEDULE_MAPS_URL = mapsUrl(
  CURRENT_SCHEDULE.place,
  CURRENT_SCHEDULE.address,
);

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/**
 * Montant sans les centimes quand ils valent zéro : « 200 € » plutôt que
 * « 200,00 € ».
 *
 * Réservé aux pages publiques, où le prix est un argument et non une écriture
 * comptable. Le CRM, les exports et les reçus gardent `formatEuros` : là,
 * deux décimales manquantes sont une information perdue.
 *
 * Le montant reste lu depuis les réglages — rien n'est écrit en dur.
 */
export function formatEurosCompact(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}
