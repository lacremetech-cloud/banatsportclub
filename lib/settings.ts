import { db, schema } from "./db";
import { DEFAULT_ANNUAL_FEE_CENTS, DEFAULT_SEASON } from "./constants";

/** Lit toute la table `settings` sous forme d'objet clé → valeur. */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(schema.settings);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getSeason(): Promise<string> {
  const settings = await getSettings();
  return settings.season ?? DEFAULT_SEASON;
}

export async function getAnnualFeeCents(): Promise<number> {
  const settings = await getSettings();
  const value = Number(settings.annual_fee_cents);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_ANNUAL_FEE_CENTS;
}
