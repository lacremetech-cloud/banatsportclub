import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js lit .env.local automatiquement, drizzle-kit non : on le charge ici
// pour n'avoir qu'un seul fichier d'environnement en local.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
