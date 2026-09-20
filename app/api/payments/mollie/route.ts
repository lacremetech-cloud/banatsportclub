import { NextResponse } from "next/server";
import { z } from "zod";

import { isMollieConfigured } from "@/lib/mollie";
import { startMolliePayment } from "@/lib/payments";

const bodySchema = z.object({ memberId: z.uuid() });

/**
 * POST public : ouvre un paiement carte pour une adhérente.
 *
 * Seul l'identifiant de l'adhérente vient du client. Le montant, la
 * description et les métadonnées sont déterminés côté serveur à partir de la
 * base : un montant envoyé par le navigateur serait purement et simplement
 * ignoré.
 */
export async function POST(request: Request) {
  if (!isMollieConfigured()) {
    console.error("[mollie] MOLLIE_API_KEY absent : paiement carte indisponible");
    return NextResponse.json(
      { message: "Le paiement par carte n’est pas encore activé." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Adhérente introuvable." }, { status: 400 });
  }

  const result = await startMolliePayment(parsed.data.memberId);

  if (!result.ok) {
    const status = result.reason === "member-not-found" ? 404 : 409;
    return NextResponse.json({ message: result.message }, { status });
  }

  return NextResponse.json({
    checkoutUrl: result.checkoutUrl,
    amountCents: result.amountCents,
  });
}
