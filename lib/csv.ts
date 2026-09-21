/**
 * Génération des exports CSV du bureau.
 *
 * Deux choix dictés par l'usage réel : le fichier sera ouvert dans Excel ou
 * LibreOffice, en français.
 *
 * - le séparateur est le point-virgule, parce qu'un tableur francophone
 *   l'attend et que nos montants utilisent déjà la virgule décimale ;
 * - le fichier commence par un BOM UTF-8, sans lequel Excel affiche
 *   « Hélène » au lieu de « Hélène ».
 */

const SEPARATOR = ";";
const BOM = "﻿";

/** Échappe une cellule : guillemets doublés, et entourée si nécessaire. */
function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (text.includes('"') || text.includes(SEPARATOR) || /[\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export type CsvRow = (string | number | null | undefined)[];

export function toCsv(headers: string[], rows: CsvRow[]): string {
  return (
    BOM +
    [headers, ...rows].map((row) => row.map(cell).join(SEPARATOR)).join("\r\n") +
    "\r\n"
  );
}

/** Montant en centimes → « 200,00 », lisible directement par le tableur. */
export function csvAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Date ISO ou Date → « 21/09/2026 ». */
export function csvDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const iso = typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
}

export function csvYesNo(value: boolean): string {
  return value ? "Oui" : "Non";
}

/**
 * Réponse HTTP de téléchargement.
 *
 * Le nom de fichier porte la date du jour : le bureau exporte plusieurs fois
 * dans la saison et doit pouvoir distinguer deux fichiers dans son dossier.
 */
export function csvResponse(fileName: string, content: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      // Un export est une photo à l'instant T : rien à mettre en cache.
      "Cache-Control": "no-store",
    },
  });
}

/** « adherentes-2026-09-21.csv » */
export function csvFileName(prefix: string): string {
  const today = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(
    new Date(),
  );
  return `${prefix}-${today}.csv`;
}
