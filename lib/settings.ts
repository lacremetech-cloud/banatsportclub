import {
  DEFAULT_ANNUAL_FEE_CENTS,
  DEFAULT_CLUB_EMAIL,
  DEFAULT_CLUB_NAME,
  DEFAULT_CLUB_PHONE,
  DEFAULT_GROUP_DISPLAY,
  DEFAULT_SEASON,
  GROUPS,
  GROUP_NAMES,
  mapsUrl,
  type GroupName,
} from "./constants";
import { db, schema } from "./db";
import {
  DEFAULT_PARTNER_CLUB_FEE_CENTS,
  DEFAULT_SOLIDARITY_FEE_CENTS,
  type FeeType,
} from "./fees";

/** Un créneau tel qu'il est affiché partout sur le site. */
export type GroupInfo = {
  key: GroupName;
  /** "Jeudi soir" */
  day: string;
  /** "6e à 3e" — indicatif, ne verrouille aucune inscription. */
  levels: string;
  /** "18h00 – 19h30" */
  time: string;
  /** "Complexe sportif des Garrigues — Haut de Massane" */
  place: string;
  /** "297 Av. du Comté de Nice, 34080 Montpellier" */
  address: string;
  /** Lien Google Maps, dérivé du lieu et de l'adresse. */
  mapsUrl: string;
  /**
   * Libellé court du CRM : « Jeudi soir — Dojo ».
   *
   * Le bureau sait où ont lieu les séances ; répéter l'adresse complète sur
   * chaque ligne de liste n'apporterait rien et encombrerait l'écran. Le nom
   * exact et l'adresse restent affichés dans le parcours public.
   */
  shortLabel: string;
  /** Heures SQL de la séance, utilisées par la feuille de présence. */
  startTime: string;
  endTime: string;
  weekday: number;
};

export type SiteSettings = {
  season: string;
  annualFeeCents: number;
  groups: GroupInfo[];
};

/** Barème en vigueur : ce que vaut chaque type de cotisation aujourd'hui. */
export type FeeScale = Record<FeeType, number>;

/** Lit toute la table `settings` sous forme d'objet clé → valeur. */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(schema.settings);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

function buildGroups(settings: Record<string, string>): GroupInfo[] {
  return GROUP_NAMES.map((key) => {
    const fallback = DEFAULT_GROUP_DISPLAY[key];
    const place = settings[`group_${key}_place`] ?? fallback.place;
    const address = settings[`group_${key}_address`] ?? fallback.address;
    return {
      key,
      day: settings[`group_${key}_day`] ?? fallback.day,
      levels: settings[`group_${key}_levels`] ?? fallback.levels,
      time: settings[`group_${key}_time`] ?? fallback.time,
      place,
      address,
      shortLabel: settings[`group_${key}_short_label`] ?? fallback.shortLabel,
      mapsUrl: mapsUrl(place, address),
      startTime: GROUPS[key].startTime,
      endTime: GROUPS[key].endTime,
      weekday: GROUPS[key].weekday,
    };
  });
}

function readFeeCents(settings: Record<string, string>): number {
  const value = Number(settings.annual_fee_cents);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_ANNUAL_FEE_CENTS;
}

/** Lit un montant en centimes, avec un filet si la clé manque. */
function readCents(
  settings: Record<string, string>,
  key: string,
  fallback: number,
): number {
  const value = Number(settings[key]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/**
 * Barème des trois cotisations.
 *
 * Il sert UNIQUEMENT à proposer un montant au bureau au moment où il change
 * le type de cotisation d'une adhérente. Le montant réellement dû reste celui
 * figé sur la fiche (`members.fee_amount_cents`).
 */
export async function getFeeScale(): Promise<FeeScale> {
  const settings = await getSettings();
  return {
    STANDARD: readFeeCents(settings),
    SOLIDARITY: readCents(settings, "solidarity_fee_cents", DEFAULT_SOLIDARITY_FEE_CENTS),
    FREE: 0,
  };
}

/** Reversement prévu pour chaque adhérente du groupe du dimanche. */
export async function getPartnerClubFeeCents(): Promise<number> {
  return readCents(
    await getSettings(),
    "partner_club_fee_cents",
    DEFAULT_PARTNER_CLUB_FEE_CENTS,
  );
}

/**
 * Tout ce dont une page publique a besoin, en une seule lecture.
 * Saison, tarif et créneaux viennent de la base : aucun composant ne les
 * redéfinit de son côté.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await getSettings();
  return {
    season: settings.season ?? DEFAULT_SEASON,
    annualFeeCents: readFeeCents(settings),
    groups: buildGroups(settings),
  };
}

export type BankDetails = {
  holder: string | null;
  iban: string | null;
  bic: string | null;
};

/**
 * Coordonnées bancaires pour les virements.
 *
 * Rien n'est codé en dur : tant que ces clés ne sont pas renseignées dans
 * `settings`, la page de confirmation indique que le bureau les communiquera.
 */
export async function getBankDetails(): Promise<BankDetails> {
  const settings = await getSettings();
  return {
    holder: settings.bank_holder?.trim() || null,
    iban: settings.bank_iban?.trim() || null,
    bic: settings.bank_bic?.trim() || null,
  };
}

export async function getSeason(): Promise<string> {
  const settings = await getSettings();
  return settings.season ?? DEFAULT_SEASON;
}

export async function getAnnualFeeCents(): Promise<number> {
  return readFeeCents(await getSettings());
}

export async function getGroups(): Promise<GroupInfo[]> {
  return buildGroups(await getSettings());
}

/** Identité publique de l'association, modifiable depuis /admin/parametres. */
export type Association = {
  name: string;
  email: string;
  phone: string;
};

function readText(
  settings: Record<string, string>,
  key: string,
  fallback: string,
): string {
  return settings[key]?.trim() || fallback;
}

export async function getAssociation(): Promise<Association> {
  const settings = await getSettings();
  return readAssociation(settings);
}

function readAssociation(settings: Record<string, string>): Association {
  return {
    name: readText(settings, "club_name", DEFAULT_CLUB_NAME),
    email: readText(settings, "club_email", DEFAULT_CLUB_EMAIL),
    phone: readText(settings, "club_phone", DEFAULT_CLUB_PHONE),
  };
}

/**
 * Tout ce qu'affiche la page Paramètres, en une seule lecture.
 *
 * Volontairement limité aux réglages de l'association : aucune variable
 * d'environnement, aucune clé technique. Ce qui est secret ne transite jamais
 * par cette page.
 */
export type AdminSettings = {
  season: string;
  annualFeeCents: number;
  solidarityFeeCents: number;
  partnerClubFeeCents: number;
  bank: BankDetails;
  association: Association;
};

export async function getAdminSettings(): Promise<AdminSettings> {
  const settings = await getSettings();
  return {
    season: settings.season ?? DEFAULT_SEASON,
    annualFeeCents: readFeeCents(settings),
    solidarityFeeCents: readCents(
      settings,
      "solidarity_fee_cents",
      DEFAULT_SOLIDARITY_FEE_CENTS,
    ),
    partnerClubFeeCents: readCents(
      settings,
      "partner_club_fee_cents",
      DEFAULT_PARTNER_CLUB_FEE_CENTS,
    ),
    bank: {
      holder: settings.bank_holder?.trim() || null,
      iban: settings.bank_iban?.trim() || null,
      bic: settings.bank_bic?.trim() || null,
    },
    association: readAssociation(settings),
  };
}
