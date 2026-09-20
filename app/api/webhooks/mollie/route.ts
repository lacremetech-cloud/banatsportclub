import { NextResponse } from "next/server";

import { isMollieConfigured } from "@/lib/mollie";
import { confirmMolliePayment } from "@/lib/payments";

/**
 * Webhook Mollie.
 *
 * Mollie poste un simple `id=tr_xxx` en formulaire. Ce contenu n'est jamais
 * considéré comme une preuve de paiement : on relit le statut réel chez
 * Mollie avec la clé API avant de créditer quoi que ce soit.
 *
 * On répond systématiquement 200 quand le traitement a abouti, y compris pour
 * un paiement déjà confirmé — sinon Mollie continuerait de réessayer.
 */
export async function POST(request: Request) {
  if (!isMollieConfigured()) {
    console.error("[mollie] webhook reçu mais MOLLIE_API_KEY est absent");
    return NextResponse.json({ received: false }, { status: 503 });
  }

  let molliePaymentId: string | null = null;
  try {
    const form = await request.formData();
    molliePaymentId = String(form.get("id") ?? "").trim() || null;
  } catch {
    molliePaymentId = null;
  }

  if (!molliePaymentId) {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  try {
    const outcome = await confirmMolliePayment(molliePaymentId);
    console.info(`[mollie] webhook ${molliePaymentId} : ${outcome}`);
    return NextResponse.json({ received: true, outcome });
  } catch (error) {
    // Une erreur renvoie 500 : Mollie réessaiera, et le traitement étant
    // idempotent, une nouvelle tentative ne crée aucun doublon.
    console.error(`[mollie] échec du traitement de ${molliePaymentId} :`, error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
