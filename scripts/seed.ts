// L'environnement est chargé par le flag --env-file du script npm :
// les imports ESM sont hissés, un dotenv appelé ici s'exécuterait trop tard.
import { GROUPS, DEFAULT_ANNUAL_FEE_CENTS, DEFAULT_SEASON } from "../lib/constants";
import { db, schema } from "../lib/db";

/**
 * Insère les réglages initiaux de l'association.
 * Idempotent : relancer le script met simplement les valeurs à jour.
 */
const SETTINGS: Record<string, string> = {
  season: DEFAULT_SEASON,
  annual_fee_cents: String(DEFAULT_ANNUAL_FEE_CENTS),
  group_jeudi: `${GROUPS.jeudi.schedule} — ${GROUPS.jeudi.place}`,
  group_dimanche: `${GROUPS.dimanche.schedule} — ${GROUPS.dimanche.place}`,
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
