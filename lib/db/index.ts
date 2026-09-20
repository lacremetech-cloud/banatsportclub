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

  // Un .trim() volontaire : un retour à la ligne collé par mégarde dans le
  // champ Vercel donnerait sinon une erreur de connexion bien plus obscure.
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    // Absent et vide sont deux problèmes distincts, avec deux causes
    // distinctes : le message doit les distinguer.
    throw new Error(
      process.env.DATABASE_URL === undefined
        ? "DATABASE_URL n'est pas défini dans cet environnement. En local : copier .env.example vers .env.local. Sur Vercel : Settings > Environment Variables, en cochant l'environnement concerné."
        : "DATABASE_URL est bien défini mais sa valeur est vide. Ressaisir la chaîne de connexion Neon, sans guillemets autour.",
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
