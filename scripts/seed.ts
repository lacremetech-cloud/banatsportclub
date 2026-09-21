// L'environnement est chargé par le flag --env-file du script npm :
// les imports ESM sont hissés, un dotenv appelé ici s'exécuterait trop tard.
import {
  DEFAULT_ANNUAL_FEE_CENTS,
  DEFAULT_GROUP_DISPLAY,
  DEFAULT_SEASON,
  GROUP_NAMES,
} from "../lib/constants";
import {
  DEFAULT_PARTNER_CLUB_FEE_CENTS,
  DEFAULT_SOLIDARITY_FEE_CENTS,
} from "../lib/fees";
import { db, schema } from "../lib/db";

/**
 * Réglages initiaux de l'association.
 * Idempotent : relancer le script met simplement les valeurs à jour.
 */
const SETTINGS: Record<string, string> = {
  season: DEFAULT_SEASON,
  annual_fee_cents: String(DEFAULT_ANNUAL_FEE_CENTS),
  // Tarif solidaire accordé au cas par cas par le bureau.
  solidarity_fee_cents: String(DEFAULT_SOLIDARITY_FEE_CENTS),
  // Reversement prévu par adhérente du dimanche (provision, pas une dépense).
  partner_club_fee_cents: String(DEFAULT_PARTNER_CLUB_FEE_CENTS),
  ...Object.fromEntries(
    GROUP_NAMES.flatMap((key) => [
      [`group_${key}_day`, DEFAULT_GROUP_DISPLAY[key].day],
      [`group_${key}_levels`, DEFAULT_GROUP_DISPLAY[key].levels],
      [`group_${key}_time`, DEFAULT_GROUP_DISPLAY[key].time],
      [`group_${key}_place`, DEFAULT_GROUP_DISPLAY[key].place],
      [`group_${key}_address`, DEFAULT_GROUP_DISPLAY[key].address],
    ]),
  ),
};

async function main() {
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
    console.log(`  ${key} = ${value}`);
  }
  console.log("Réglages initiaux enregistrés.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
