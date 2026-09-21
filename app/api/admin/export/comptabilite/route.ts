import {
  getAccountingOverview,
  type AccountingKind,
  type AccountingPeriod,
} from "@/lib/accounting";
import { getSession } from "@/lib/auth";
import {
  csvAmount,
  csvDate,
  csvFileName,
  csvResponse,
  toCsv,
  type CsvRow,
} from "@/lib/csv";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Date",
  "Type",
  "Catégorie",
  "Intitulé",
  "Montant",
  "Source",
  "Saison",
];

const PERIODS: AccountingPeriod[] = ["season", "month", "all"];
const KINDS: AccountingKind[] = ["all", "INCOME", "EXPENSE"];

/**
 * Export du suivi de trésorerie.
 *
 * Cotisations encaissées et saisies manuelles apparaissent dans le MÊME
 * fichier, triées de la plus ancienne à la plus récente : c'est la lecture
 * attendue d'un journal. La colonne « Source » dit d'où vient chaque ligne,
 * pour qu'un encaissement Mollie ne se confonde pas avec une saisie du bureau.
 *
 * Aucune cotisation n'est recopiée dans `accounting_entries` pour produire ce
 * fichier : les deux sources sont simplement lues ensemble.
 *
 * L'export reprend les filtres affichés à l'écran, afin que le fichier
 * corresponde à ce que le bureau vient de consulter.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const period = PERIODS.includes(params.get("periode") as AccountingPeriod)
    ? (params.get("periode") as AccountingPeriod)
    : "season";
  const kind = KINDS.includes(params.get("type") as AccountingKind)
    ? (params.get("type") as AccountingKind)
    : "all";

  const overview = await getAccountingOverview(period, kind);

  const chronological = [...overview.movements].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );

  const rows: CsvRow[] = chronological.map((movement) => [
    csvDate(movement.date),
    movement.amountCents >= 0 ? "Recette" : "Dépense",
    movement.category,
    movement.label,
    csvAmount(Math.abs(movement.amountCents)),
    movement.origin,
    movement.season,
  ]);

  return csvResponse(csvFileName("comptabilite"), toCsv(HEADERS, rows));
}
