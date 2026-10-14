/**
 * Valeurs de référence partagées par le site public et l'admin.
 *
 * Règle importante : les horaires, lieux et tarifs AFFICHÉS viennent de la
 * table `settings` (voir lib/settings.ts). On ne garde ici que ce qui est
 * technique (jour de la semaine, heures SQL des séances) ou purement
 * applicatif (listes de statuts, libellés).
 */

/**
 * Données techniques des groupes. L'affichage public vient de `SCHEDULES`.
 *
 * Les deux créneaux accueillent toutes les classes, de la 6e à la Terminale,
 * et la même adhésion donne accès aux deux : une adhérente peut venir au
 * jeudi, au dimanche, ou aux deux.
 *
 * Le dimanche a changé de lieu et d'horaire en cours de saison — il se tenait
 * à Grabels jusqu'à 12h30, il se tient désormais au Palais des Sports Pierre
 * de Coubertin jusqu'à 12h00. Ces heures ne servent qu'à créer les NOUVELLES
 * séances : celles déjà enregistrées gardent les leurs, et l'historique reste
 * lisible.
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
    endTime: "12:00",
    levels: ["6e", "5e", "4e", "3e", "2nde", "1ere", "terminale"],
  },
} as const;

/**
 * Le groupe auquel une inscription venue du site est rattachée.
 *
 * La famille n'a toujours rien à choisir, mais pour une autre raison qu'avant :
 * l'adhésion donne accès aux DEUX créneaux. Le groupe porté par la fiche n'est
 * donc qu'un rattachement par défaut, celui du créneau historique ; l'espace
 * bureau peut le changer, et il ne commande en rien le droit de venir à
 * l'autre séance.
 */
export const DEFAULT_GROUP = "jeudi" as const;

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
    levels: "6e à Terminale",
    time: "10h30 – 12h00",
    place: "Palais des Sports Pierre de Coubertin",
    address: "25 rue de Gênes, 34080 Montpellier",
    shortLabel: "Dimanche matin — Palais des Sports",
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
 * LES CRÉNEAUX — ce que le site public dit des séances.
 *
 * Source de vérité unique : l'accueil, la page « Informations pratiques », les
 * conditions d'adhésion et les métadonnées lisent ce tableau et rien d'autre.
 * Ces informations étaient autrefois recopiées dans quatre fichiers, ce qui
 * garantissait qu'un changement d'horaire en oublie un.
 *
 * Elles ne viennent volontairement pas de la table `settings` : le formulaire
 * de réglages n'expose aucun champ de créneau, si bien qu'une ligne périmée en
 * base supplantait silencieusement le code — c'est ainsi que la page a
 * longtemps annoncé « 6e à 4e » le jeudi.
 *
 * L'ordre du tableau est l'ordre d'affichage : le jeudi d'abord, parce qu'il
 * existe depuis le début de la saison.
 */
export const SCHEDULES = [
  {
    group: "jeudi",
    /** Pastille posée sur la photo. */
    badge: "Jeudi",
    /** Surtitre de la carte. */
    heading: "Chaque jeudi soir",
    day: "Jeudi soir",
    time: "18h00 – 19h30",
    /** Arrivée et départ : une séance n'est pas une porte qui claque. */
    arrival: "17h45",
    departure: "19h45",
    place: "Complexe sportif des Garrigues",
    address: "145 avenue du Comté de Nice, Montpellier",
    district: "Les Hauts de Massane",
    /** Ce que le lieu a de particulier, en une ligne. */
    venue: "Dojo de plus de 200 m² de tatamis",
    note: null,
    photo: "dojo",
    /** Signalé comme nouveau sur la carte, le temps que ça le soit encore. */
    isNew: false,
    partner: null,
  },
  {
    group: "dimanche",
    badge: "Dimanche",
    heading: "Chaque dimanche matin",
    day: "Dimanche matin",
    time: "10h30 – 12h00",
    arrival: null,
    departure: null,
    place: "Palais des Sports Pierre de Coubertin",
    address: "25 rue de Gênes, 34080 Montpellier",
    district: "Hauts de Massane",
    venue: "Grande salle couverte, parquet et gradins",
    /*
     * La salle accueille des compétitions. Le dire sur la carte évite le
     * dimanche matin où une famille se déplace pour une porte fermée — et
     * occupe, au passage, la place que tient l'horaire d'arrivée en face.
     */
    note: "Les jours de compétition, la séance peut être décalée.",
    photo: "palais",
    isNew: true,
    partner: "En partenariat avec MMF",
  },
] as const;

export type Schedule = (typeof SCHEDULES)[number];

/**
 * Les classes accueillies, communes aux deux créneaux.
 *
 * Elle est sortie des créneaux eux-mêmes pour que la page puisse l'annoncer
 * une seule fois, au-dessus des deux cartes : répéter « 6e à Terminale » deux
 * fois laisse croire qu'il y a quelque part une différence.
 */
export const SCHEDULE_LEVELS = "6e à Terminale";
export const SCHEDULE_LEVELS_LONG = "De la 6e à la Terminale";

/** Itinéraire vers un créneau, dérivé de son lieu et de son adresse. */
export function scheduleMapsUrl(schedule: Schedule): string {
  return mapsUrl(schedule.place, schedule.address);
}

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
