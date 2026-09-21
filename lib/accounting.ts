import { and, desc, eq, gte, sql } from "drizzle-orm";

import { db, schema } from "./db";
import { getPartnerClubFeeCents, getSiteSettings } from "./settings";

/**
 * Suivi de trésorerie de l'association.
 *
 * Ce n'est pas de la comptabilité en partie double : il s'agit de savoir ce
 * qui est entré, ce qui est sorti, et ce qu'il reste.
 *
 * Deux sources alimentent la vue, et une seule est saisie à la main :
 *
 * A. les lignes `payments` réellement encaissées — cotisations, qu'elles
 *    viennent de Mollie ou d'une saisie du bureau. Elles ne sont JAMAIS
 *    recopiées dans `accounting_entries` : une cotisation se saisit une fois,
 *    dans le module Paiements, et apparaît ici automatiquement ;
 *
 * B. les lignes `accounting_entries` : dons, subventions, achats, reversements.
 *
 * Conséquence directe : un encaissement de cotisation ne peut pas être
 * supprimé depuis la Comptabilité. Sa correction reste dans Paiements, là où
 * il a été créé.
 */

const PAID = "paid";

export const ACCOUNTING_TYPES = ["INCOME", "EXPENSE"] as const;
export type AccountingType = (typeof ACCOUNTING_TYPES)[number];

export type MovementSource = "payment" | "entry";

/**
 * Origine d'un mouvement, en clair.
 *
 * Le bureau doit pouvoir distinguer dans un export ce qui est arrivé tout
 * seul (un encaissement Mollie) de ce qu'une personne a saisi à la main.
 */
export type MovementOrigin =
  | "Cotisation manuelle"
  | "Mollie"
  | "Recette manuelle"
  | "Dépense manuelle";

export type Movement = {
  id: string;
  date: string;
  label: string;
  category: string;
  /** Positif pour une recette, négatif pour une dépense. */
  amountCents: number;
  source: MovementSource;
  origin: MovementOrigin;
  /** Saison de rattachement : celle de l'adhérente, ou celle notée sur la ligne. */
  season: string;
  /** Une cotisation n'est jamais supprimable ici : elle vit dans Paiements. */
  deletable: boolean;
  /** Renseigné pour une cotisation : permet d'ouvrir la fiche en un clic. */
  memberId: string | null;
  note: string | null;
};

export type AccountingPeriod = "season" | "month" | "all";
export type AccountingKind = "all" | "INCOME" | "EXPENSE";

export type AccountingOverview = {
  season: string;
  period: AccountingPeriod;
  kind: AccountingKind;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  movements: Movement[];
  partnerClub: PartnerClubProvision;
};

/**
 * Provision de reversement au club partenaire.
 *
 * C'est une INFORMATION, pas une dépense : rien n'est écrit en base. Tant que
 * le bureau n'a pas saisi de reversement réel, « à prévoir » et « déjà versé »
 * restent deux chiffres différents, et c'est exactement le but.
 */
export type PartnerClubProvision = {
  memberCount: number;
  feePerMemberCents: number;
  expectedCents: number;
  paidCents: number;
  remainingCents: number;
};

export const PARTNER_CLUB_CATEGORY = "Reversement club partenaire";

/** Premier jour du mois en cours, au format AAAA-MM-JJ. */
function firstDayOfMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-01`;
}

/** Une date Postgres (`date`) ou un timestamp, ramenés à AAAA-MM-JJ. */
function isoDay(value: string | Date): string {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

async function getPartnerClubProvision(season: string): Promise<PartnerClubProvision> {
  const feePerMemberCents = await getPartnerClubFeeCents();

  const [members] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.members)
    .where(
      and(
        eq(schema.members.season, season),
        eq(schema.members.groupName, "dimanche"),
        sql`${schema.members.registrationStatus} <> 'CANCELLED'`,
      ),
    );

  const [paid] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.accountingEntries.amountCents}), 0)::int`,
    })
    .from(schema.accountingEntries)
    .where(
      and(
        eq(schema.accountingEntries.season, season),
        eq(schema.accountingEntries.type, "EXPENSE"),
        eq(schema.accountingEntries.category, PARTNER_CLUB_CATEGORY),
      ),
    );

  const memberCount = Number(members?.count ?? 0);
  const expectedCents = memberCount * feePerMemberCents;
  const paidCents = Number(paid?.total ?? 0);

  return {
    memberCount,
    feePerMemberCents,
    expectedCents,
    paidCents,
    remainingCents: Math.max(expectedCents - paidCents, 0),
  };
}

export async function getAccountingOverview(
  period: AccountingPeriod = "season",
  kind: AccountingKind = "all",
): Promise<AccountingOverview> {
  const { season } = await getSiteSettings();

  // Les cotisations sont rattachées à la saison de l'adhérente, les saisies
  // manuelles à la saison notée sur la ligne.
  const paymentConditions = [eq(schema.payments.status, PAID)];
  const entryConditions = [];

  if (period === "season") {
    paymentConditions.push(eq(schema.members.season, season));
    entryConditions.push(eq(schema.accountingEntries.season, season));
  }
  if (period === "month") {
    const from = firstDayOfMonth();
    paymentConditions.push(
      sql`coalesce(${schema.payments.paidAt}, ${schema.payments.createdAt}) >= ${from}`,
    );
    entryConditions.push(gte(schema.accountingEntries.entryDate, from));
  }

  const [paymentRows, entryRows, partnerClub] = await Promise.all([
    db
      .select({
        id: schema.payments.id,
        memberId: schema.payments.memberId,
        amountCents: schema.payments.amountCents,
        provider: schema.payments.provider,
        paidAt: schema.payments.paidAt,
        createdAt: schema.payments.createdAt,
        notes: schema.payments.notes,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
        memberNumber: schema.members.memberNumber,
        memberSeason: schema.members.season,
      })
      .from(schema.payments)
      .innerJoin(schema.members, eq(schema.members.id, schema.payments.memberId))
      .where(and(...paymentConditions))
      .orderBy(desc(schema.payments.createdAt)),
    db
      .select()
      .from(schema.accountingEntries)
      .where(entryConditions.length > 0 ? and(...entryConditions) : undefined)
      .orderBy(desc(schema.accountingEntries.entryDate)),
    getPartnerClubProvision(season),
  ]);

  const movements: Movement[] = [
    ...paymentRows.map((row) => ({
      id: row.id,
      date: isoDay(row.paidAt ?? row.createdAt),
      label: `Cotisation ${row.firstName} ${row.lastName.toUpperCase()}`,
      category: "Cotisation",
      amountCents: row.amountCents,
      source: "payment" as const,
      origin: (row.provider === "mollie" ? "Mollie" : "Cotisation manuelle") as MovementOrigin,
      season: row.memberSeason,
      // Une cotisation se corrige dans Paiements, jamais ici.
      deletable: false,
      memberId: row.memberId,
      note: row.provider ? `${row.memberNumber} · ${row.provider}` : row.memberNumber,
    })),
    ...entryRows.map((row) => ({
      id: row.id,
      date: isoDay(row.entryDate),
      label: row.label,
      category: row.category,
      amountCents: row.type === "EXPENSE" ? -row.amountCents : row.amountCents,
      source: "entry" as const,
      origin: (row.type === "EXPENSE"
        ? "Dépense manuelle"
        : "Recette manuelle") as MovementOrigin,
      season: row.season,
      deletable: true,
      memberId: null,
      note: row.note,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  // Les totaux portent toujours sur TOUS les mouvements de la période : un
  // filtre d'affichage ne doit pas faire mentir le solde.
  const incomeCents = movements
    .filter((movement) => movement.amountCents > 0)
    .reduce((total, movement) => total + movement.amountCents, 0);
  const expenseCents = movements
    .filter((movement) => movement.amountCents < 0)
    .reduce((total, movement) => total - movement.amountCents, 0);

  const visible = movements.filter((movement) => {
    if (kind === "INCOME") return movement.amountCents > 0;
    if (kind === "EXPENSE") return movement.amountCents < 0;
    return true;
  });

  return {
    season,
    period,
    kind,
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents,
    movements: visible,
    partnerClub,
  };
}

/** Chiffres de trésorerie du tableau de bord : le strict nécessaire. */
export async function getTreasurySummary() {
  const { incomeCents, expenseCents, balanceCents } = await getAccountingOverview(
    "season",
    "all",
  );
  return { incomeCents, expenseCents, balanceCents };
}
