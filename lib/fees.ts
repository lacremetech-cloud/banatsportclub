/**
 * Cotisation d'une adhérente et découpage en échéances.
 *
 * Deux principes :
 *
 * 1. Le montant dû est FIGÉ sur l'adhérente (`members.fee_amount_cents`) au
 *    moment de l'inscription. Changer le tarif général dans `settings` ne
 *    modifie donc pas rétroactivement ce qu'une adhérente devait cette
 *    saison. L'historique reste juste.
 *
 * 2. Tous les calculs se font en centimes, avec des entiers. Aucun arrondi
 *    flottant ne peut faire apparaître ou disparaître un centime.
 */

export const FEE_TYPES = ["STANDARD", "SOLIDARITY", "FREE"] as const;
export type FeeType = (typeof FEE_TYPES)[number];
export const DEFAULT_FEE_TYPE: FeeType = "STANDARD";

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  STANDARD: "Standard",
  SOLIDARITY: "Solidaire",
  FREE: "Offerte",
};

/** Tarif solidaire par défaut, si la clé manque dans `settings`. */
export const DEFAULT_SOLIDARITY_FEE_CENTS = 10000;

/** Reversement prévu par adhérente du dimanche, si la clé manque. */
export const DEFAULT_PARTNER_CLUB_FEE_CENTS = 5000;

/**
 * Échéanciers.
 *
 * 1 et 2 fois sont proposés publiquement ; le 3 fois est une facilité que
 * seul le bureau peut accorder depuis le CRM.
 */
export const INSTALLMENT_PLANS = [1, 2, 3] as const;
export type InstallmentPlan = (typeof INSTALLMENT_PLANS)[number];
export const PUBLIC_INSTALLMENT_PLANS = [1, 2] as const;
export const DEFAULT_INSTALLMENTS: InstallmentPlan = 1;

export function isInstallmentPlan(value: unknown): value is InstallmentPlan {
  return INSTALLMENT_PLANS.includes(Number(value) as InstallmentPlan);
}

/** « Paiement en 2 fois », « Paiement en 1 fois ». */
export function installmentLabel(plan: number): string {
  return plan <= 1 ? "Paiement en 1 fois" : `Paiement en ${plan} fois`;
}

/**
 * Découpe un montant en `count` échéances entières.
 *
 * Les centimes qui ne tombent pas juste sont absorbés par les PREMIÈRES
 * échéances : 200 € en 3 fois donne 66,67 € + 66,67 € + 66,66 €, et jamais
 * un total de 200,01 € ou 199,99 €.
 */
export function splitInstallments(totalCents: number, count: number): number[] {
  const plan = Math.max(1, Math.trunc(count));
  const total = Math.max(0, Math.trunc(totalCents));

  const base = Math.floor(total / plan);
  const remainder = total - base * plan;

  return Array.from({ length: plan }, (_, index) =>
    index < remainder ? base + 1 : base,
  );
}

/** Montants cumulés à avoir réglés après chaque échéance. */
export function installmentCheckpoints(totalCents: number, count: number): number[] {
  let running = 0;
  return splitInstallments(totalCents, count).map((amount) => (running += amount));
}

/**
 * Nombre d'échéances intégralement réglées.
 *
 * Sert au « 1 / 2 » affiché dans la fiche. Une échéance entamée mais non
 * terminée ne compte pas.
 */
export function installmentsSettled(
  totalCents: number,
  count: number,
  paidCents: number,
): number {
  return installmentCheckpoints(totalCents, count).filter(
    (checkpoint) => paidCents >= checkpoint,
  ).length;
}

/**
 * Montant du prochain paiement en ligne.
 *
 * C'est ce qui reste à régler pour terminer l'échéance en cours, jamais plus :
 * un échéancier en 2 fois ne laisse pas payer 200 € d'un coup par carte. Si
 * une partie de l'échéance a déjà été encaissée à la main, seul le solde de
 * cette échéance est proposé. Zéro signifie « plus rien à payer ».
 */
export function nextInstallmentCents(
  totalCents: number,
  count: number,
  paidCents: number,
): number {
  const total = Math.max(0, Math.trunc(totalCents));
  const paid = Math.max(0, Math.trunc(paidCents));
  if (paid >= total) return 0;

  const nextCheckpoint = installmentCheckpoints(total, count).find(
    (checkpoint) => checkpoint > paid,
  );

  // `find` trouve toujours quelque chose ici, puisque paid < total.
  return Math.max(0, (nextCheckpoint ?? total) - paid);
}
