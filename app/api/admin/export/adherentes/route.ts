import { getSession } from "@/lib/auth";
import {
  INSURANCE_STATUS_SHORT_LABELS,
  REGISTRATION_STATUS_LABELS,
  SCHOOL_LEVEL_LABELS,
  type InsuranceStatus,
  type RegistrationStatus,
  type SchoolLevel,
} from "@/lib/constants";
import {
  listMembersForExport,
  MEMBER_VIEWS,
  PAYMENT_STATUS_LABELS,
  type MemberView,
} from "@/lib/crm";
import {
  csvAmount,
  csvDate,
  csvFileName,
  csvResponse,
  csvYesNo,
  toCsv,
  type CsvRow,
} from "@/lib/csv";
import { FEE_TYPE_LABELS, installmentLabel, type FeeType } from "@/lib/fees";
import { getGroups } from "@/lib/settings";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Numéro adhérente",
  "Prénom",
  "Nom",
  "Date de naissance",
  "Classe",
  "Établissement",
  "Groupe",
  "Responsable légal",
  "Téléphone responsable",
  "Email responsable",
  "Contact urgence principal",
  "Téléphone urgence principal",
  "Deuxième contact urgence",
  "Téléphone deuxième contact",
  "Relation deuxième contact",
  "Type de cotisation",
  "Montant dû",
  "Montant payé",
  "Reste à payer",
  "Échéancier",
  "Statut adhésion",
  "Statut paiement",
  "Équipement remis",
  "Date remise équipement",
  "Droit à l’image",
  "Autorisation d’urgence",
  "Assurance individuelle",
  "Saison",
];

/**
 * Export général des adhérentes.
 *
 * Aucune donnée médicale n'y figure — c'est délibéré et ce fichier n'est pas
 * le bon support pour ça : il s'envoie par email et s'ouvre n'importe où.
 * Allergies, traitements et remarques de santé restent sur la fiche, derrière
 * la connexion. Les deux colonnes ajoutées en septembre 2026 ne font pas
 * exception : une autorisation d'urgence est un consentement, et l'assurance
 * individuelle est une réponse déclarative — ni l'une ni l'autre ne dit quoi
 * que ce soit de l'état de santé de l'adhérente.
 *
 * Cette route n'est pas rendue par le layout de l'espace bureau : elle
 * revérifie donc la session elle-même.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Non autorisé.", { status: 401 });
  }

  // L'export suit la vue d'où il est déclenché : les listes courantes par
  // défaut, les archives si le bureau exporte depuis les archives. La
  // corbeille n'est pas exportable — elle n'a pas de bouton non plus.
  const requested = new URL(request.url).searchParams.get("vue");
  const view: MemberView =
    MEMBER_VIEWS.includes(requested as MemberView) && requested !== "trashed"
      ? (requested as MemberView)
      : "current";

  const [members, groups] = await Promise.all([
    listMembersForExport(view),
    getGroups(),
  ]);
  const groupLabel = new Map(groups.map((group) => [group.key as string, group.shortLabel]));

  const rows: CsvRow[] = members.map((member) => [
    member.memberNumber,
    member.firstName,
    member.lastName,
    csvDate(member.birthDate),
    SCHOOL_LEVEL_LABELS[member.schoolLevel as SchoolLevel] ?? member.schoolLevel,
    member.schoolName ?? "",
    groupLabel.get(member.groupName) ?? member.groupName,
    member.guardianName,
    member.guardianPhone,
    member.guardianEmail,
    member.emergencyName,
    member.emergencyPhone,
    member.secondName,
    member.secondPhone,
    member.secondRelationship,
    FEE_TYPE_LABELS[member.feeType as FeeType] ?? member.feeType,
    csvAmount(member.feeAmountCents),
    csvAmount(member.paidCents),
    csvAmount(member.dueCents),
    installmentLabel(member.installments),
    REGISTRATION_STATUS_LABELS[member.registrationStatus as RegistrationStatus] ??
      member.registrationStatus,
    PAYMENT_STATUS_LABELS[member.paymentStatus],
    csvYesNo(member.equipmentDelivered),
    csvDate(member.equipmentDeliveredAt),
    csvYesNo(member.imageRights),
    csvYesNo(member.emergencyMedical),
    INSURANCE_STATUS_SHORT_LABELS[member.insuranceStatus as InsuranceStatus] ??
      member.insuranceStatus,
    member.season,
  ]);

  return csvResponse(
    csvFileName(view === "archived" ? "adherentes-archives" : "adherentes"),
    toCsv(HEADERS, rows),
  );
}
