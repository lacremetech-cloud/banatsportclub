import { and, eq, isNull, sql } from "drizzle-orm";

import { getAppUrl } from "./app-url";
import { recomputeMemberStatus } from "./crm";
import { db, schema } from "./db";
import { nextInstallmentCents } from "./fees";
import { createMollieCheckout, fetchMolliePayment } from "./mollie";
import { sendPaymentReceivedEmail } from "./notifications";
import { getSiteSettings } from "./settings";

/**
 * Paiement en ligne par carte, via Mollie.
 *
 * Deux principes gouvernent ce fichier :
 *
 * 1. Le montant n'est JAMAIS accepté depuis le client. Il est recalculé côté
 *    serveur à partir de la cotisation DE L'ADHÉRENTE, de son échéancier et
 *    des encaissements déjà constatés, y compris les saisies manuelles du
 *    bureau. Un échéancier en 2 fois ne laisse donc jamais payer la totalité
 *    d'un coup, et rien ne permet de payer plus que ce qui est dû.
 *
 * 2. Le webhook est idempotent. Mollie peut l'appeler plusieurs fois : les
 *    transitions passent par des UPDATE conditionnels, si bien qu'un second
 *    appel ne crédite rien et n'envoie aucun email supplémentaire.
 */

const PAID = "paid";

export type PaymentSummary = {
  memberId: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  registrationStatus: string;
  guardianEmail: string | null;
  /** Cotisation réellement due par cette adhérente. */
  feeAmountCents: number;
  feeType: string;
  installments: number;
  paidCents: number;
  remainingCents: number;
  /** Montant du prochain paiement en ligne : l'échéance en cours, pas plus. */
  nextPaymentCents: number;
};

/** Cotisation, encaissé et reste dû, lus côté serveur. */
export async function getPaymentSummary(
  memberId: string,
): Promise<PaymentSummary | null> {
  const [member] = await db
    .select({
      id: schema.members.id,
      memberNumber: schema.members.memberNumber,
      firstName: schema.members.firstName,
      lastName: schema.members.lastName,
      registrationStatus: schema.members.registrationStatus,
      feeType: schema.members.feeType,
      feeAmountCents: schema.members.feeAmountCents,
      installments: schema.members.paymentInstallments,
      guardianEmail: schema.guardians.email,
    })
    .from(schema.members)
    .leftJoin(schema.guardians, eq(schema.guardians.memberId, schema.members.id))
    .where(eq(schema.members.id, memberId));

  if (!member) return null;

  const [totals] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.payments.amountCents}), 0)::int` })
    .from(schema.payments)
    .where(and(eq(schema.payments.memberId, memberId), eq(schema.payments.status, PAID)));

  const paidCents = Number(totals?.total ?? 0);

  return {
    memberId: member.id,
    memberNumber: member.memberNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    registrationStatus: member.registrationStatus,
    guardianEmail: member.guardianEmail,
    feeType: member.feeType,
    feeAmountCents: member.feeAmountCents,
    installments: member.installments,
    paidCents,
    remainingCents: Math.max(member.feeAmountCents - paidCents, 0),
    nextPaymentCents: nextInstallmentCents(
      member.feeAmountCents,
      member.installments,
      paidCents,
    ),
  };
}

export type CheckoutResult =
  | { ok: true; checkoutUrl: string; amountCents: number }
  | { ok: false; reason: "member-not-found" | "nothing-due" | "provider-error"; message: string };

/**
 * Crée un paiement Mollie pour le reste dû, et la ligne `payments` en attente
 * qui lui correspond.
 */
export async function startMolliePayment(memberId: string): Promise<CheckoutResult> {
  const summary = await getPaymentSummary(memberId);
  if (!summary) {
    return { ok: false, reason: "member-not-found", message: "Adhérente introuvable." };
  }

  // Jamais de surpaiement : si tout est réglé — ou si la cotisation est
  // offerte, donc nulle — aucun paiement n'est créé.
  if (summary.nextPaymentCents <= 0) {
    return {
      ok: false,
      reason: "nothing-due",
      message:
        summary.feeAmountCents <= 0
          ? "Cette adhésion ne donne lieu à aucun règlement."
          : "La cotisation est déjà intégralement réglée.",
    };
  }

  const amountCents = summary.nextPaymentCents;

  const { season } = await getSiteSettings();
  const appUrl = getAppUrl();

  try {
    const mollie = await createMollieCheckout({
      amountCents,
      description: `Cotisation Banat Sport Club — ${summary.memberNumber}`,
      redirectUrl: `${appUrl}/inscription/paiement?adherente=${summary.memberId}`,
      webhookUrl: `${appUrl}/api/webhooks/mollie`,
      metadata: {
        memberId: summary.memberId,
        memberNumber: summary.memberNumber,
        season,
      },
    });

    const checkoutUrl = mollie._links?.checkout?.href;
    if (!checkoutUrl) {
      throw new Error("Mollie n'a pas renvoyé d'URL de paiement.");
    }

    await db.insert(schema.payments).values({
      memberId: summary.memberId,
      amountCents,
      method: "card",
      status: "pending",
      provider: "mollie",
      providerPaymentId: mollie.id,
    });

    return { ok: true, checkoutUrl, amountCents };
  } catch (error) {
    console.error("[mollie] création de paiement impossible :", error);
    return {
      ok: false,
      reason: "provider-error",
      message: "Le paiement en ligne est momentanément indisponible.",
    };
  }
}

/** Statuts Mollie qui signifient « définitivement pas payé ». */
const FAILED_STATUSES = new Set(["failed", "canceled", "expired"]);

export type WebhookOutcome =
  | "paid"
  | "already-paid"
  | "pending"
  | "failed"
  | "unknown-payment";

/**
 * Traite une notification Mollie.
 *
 * Le contenu du webhook n'est jamais cru sur parole : seul l'identifiant est
 * retenu, et le statut réel est relu chez Mollie avec la clé API.
 */
export async function confirmMolliePayment(
  molliePaymentId: string,
): Promise<WebhookOutcome> {
  const mollie = await fetchMolliePayment(molliePaymentId);

  const [payment] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.providerPaymentId, molliePaymentId));

  if (!payment) {
    console.warn(`[mollie] paiement inconnu en base : ${molliePaymentId}`);
    return "unknown-payment";
  }

  if (FAILED_STATUSES.has(mollie.status)) {
    await db
      .update(schema.payments)
      .set({ status: mollie.status === "canceled" ? "failed" : mollie.status })
      .where(and(eq(schema.payments.id, payment.id), sql`${schema.payments.status} <> 'paid'`));
    return "failed";
  }

  if (mollie.status !== "paid") return "pending";

  // Transition atomique : seul le premier webhook fait passer la ligne à payé.
  const claimed = await db
    .update(schema.payments)
    .set({
      status: PAID,
      paidAt: mollie.paidAt ? new Date(mollie.paidAt) : new Date(),
    })
    .where(and(eq(schema.payments.id, payment.id), sql`${schema.payments.status} <> 'paid'`))
    .returning({ id: schema.payments.id });

  const firstConfirmation = claimed.length > 0;

  // Même logique que les paiements manuels du CRM : une adhésion annulée ne
  // repasse jamais ACTIVE.
  await recomputeMemberStatus(payment.memberId);

  // Verrou d'email : un seul webhook peut réserver l'envoi.
  const emailClaim = await db
    .update(schema.payments)
    .set({ paidEmailSentAt: new Date() })
    .where(
      and(eq(schema.payments.id, payment.id), isNull(schema.payments.paidEmailSentAt)),
    )
    .returning({ id: schema.payments.id });

  if (emailClaim.length > 0) {
    const summary = await getPaymentSummary(payment.memberId);
    if (summary?.guardianEmail) {
      const result = await sendPaymentReceivedEmail({
        guardianEmail: summary.guardianEmail,
        firstName: summary.firstName,
        memberNumber: summary.memberNumber,
        amountCents: payment.amountCents,
        registrationStatus: summary.registrationStatus,
      });
      if (!result.sent) {
        // L'email n'est pas critique : on libère le verrou pour permettre une
        // nouvelle tentative au prochain webhook.
        await db
          .update(schema.payments)
          .set({ paidEmailSentAt: null })
          .where(eq(schema.payments.id, payment.id));
      }
    }
  }

  return firstConfirmation ? "paid" : "already-paid";
}
