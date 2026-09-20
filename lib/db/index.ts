import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Client Drizzle sur Neon.
 *
 * Le client est créé à la PREMIÈRE requête, pas au chargement du module :
 * `next build` importe toutes les routes pour collecter leurs métadonnées, et
 * échouerait si DATABASE_URL n'était exigé dès l'import. Un build ne doit pas
 * dépendre d'un secret d'exécution — seule une vraie requête en a besoin.
 */

let instance: NeonHttpDatabase<typeof schema> | null = null;

function connect(): NeonHttpDatabase<typeof schema> {
  if (instance) return instance;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL est manquant. En local : copier .env.example vers .env.local. Sur Vercel : Settings > Environment Variables.",
    );
  }

  // Driver HTTP de Neon : pas de pool à gérer, adapté aux fonctions
  // serverless de Vercel.
  instance = drizzle(neon(url), { schema });
  return instance;
}

// `db` garde exactement la même interface qu'un client Drizzle : les neuf
// fichiers qui l'utilisent n'ont pas à connaître ce détail.
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, property) {
    const value = Reflect.get(connect(), property);
    return typeof value === "function" ? value.bind(connect()) : value;
  },
});

export { schema };
