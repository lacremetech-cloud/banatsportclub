import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL est manquant. Copie .env.example vers .env.local et renseigne la chaîne de connexion Neon.",
  );
}

// Driver HTTP de Neon : pas de pool à gérer, parfait pour les fonctions
// serverless de Vercel.
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export { schema };
