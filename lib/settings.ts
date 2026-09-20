import {
  DEFAULT_ANNUAL_FEE_CENTS,
  DEFAULT_GROUP_DISPLAY,
  DEFAULT_SEASON,
  GROUPS,
  GROUP_NAMES,
  type GroupName,
} from "./constants";
import { db, schema } from "./db";

/** Un créneau tel qu'il est affiché partout sur le site. */
export type GroupInfo = {
  key: GroupName;
  /** "Jeudi" */
  day: string;
  /** "18h00 – 19h30" */
  time: string;
  /** "Dojo Montpellier" */
  place: string;
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

/** Lit toute la table `settings` sous forme d'objet clé → valeur. */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(schema.settings);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

function buildGroups(settings: Record<string, string>): GroupInfo[] {
  return GROUP_NAMES.map((key) => ({
    key,
    day: settings[`group_${key}_day`] ?? DEFAULT_GROUP_DISPLAY[key].day,
    time: settings[`group_${key}_time`] ?? DEFAULT_GROUP_DISPLAY[key].time,
    place: settings[`group_${key}_place`] ?? DEFAULT_GROUP_DISPLAY[key].place,
    startTime: GROUPS[key].startTime,
    endTime: GROUPS[key].endTime,
    weekday: GROUPS[key].weekday,
  }));
}

function readFeeCents(settings: Record<string, string>): number {
  const value = Number(settings.annual_fee_cents);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_ANNUAL_FEE_CENTS;
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
