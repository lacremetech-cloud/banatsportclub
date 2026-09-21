import { readFile } from "node:fs/promises";
import path from "node:path";

import { getAppUrl } from "./app-url";
import type { EmailAttachment } from "./email";

/**
 * Règlement intérieur joint à l'email de confirmation.
 *
 * Le document est daté : il vaut pour la saison 2026-2027 et pour elle seule.
 * Changer la saison active dans les réglages ne doit donc PAS renommer ce
 * fichier — ce serait annoncer une saison que le document ne couvre pas. Le
 * jour où le bureau publiera un règlement 2027-2028, il déposera un nouveau
 * fichier et ces deux constantes changeront ensemble.
 */
const FILE_NAME = "Reglement_Interieur_BSC_2026-2027.pdf";

/** Nom que la famille verra dans sa boîte mail. */
export const REGLEMENT_ATTACHMENT_NAME =
  "Reglement_Interieur_Banat_Sport_Club_2026-2027.pdf";

let cached: Buffer | null = null;

/**
 * Charge le PDF depuis `public/`.
 *
 * Deux chemins, parce qu'un environnement serverless ne garantit pas toujours
 * la présence des fichiers statiques dans le système de fichiers de la
 * fonction : on lit d'abord le disque, et à défaut on récupère le fichier par
 * l'URL publique de l'application. Si les deux échouent, on renvoie `null` et
 * l'email part SANS pièce jointe — mieux vaut un email sans le règlement que
 * pas d'email du tout.
 */
export async function loadReglementPdf(): Promise<EmailAttachment | null> {
  if (!cached) {
    try {
      cached = await readFile(path.join(process.cwd(), "public", FILE_NAME));
    } catch {
      try {
        const response = await fetch(`${getAppUrl()}/${FILE_NAME}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        cached = Buffer.from(await response.arrayBuffer());
      } catch (error) {
        const message = error instanceof Error ? error.message : "erreur inconnue";
        console.warn(`[email] règlement intérieur introuvable : ${message}`);
        return null;
      }
    }
  }

  return {
    filename: REGLEMENT_ATTACHMENT_NAME,
    content: cached,
    contentType: "application/pdf",
  };
}
