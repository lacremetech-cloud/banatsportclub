import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { formatZodErrors, paymentSchema } from "@/lib/validation";

/** GET admin : liste les paiements (le plus récent d'abord). */
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  const rows = await db
    .select({
      id: schema.payments.id,
      memberId: schema.payments.memberId,
      memberNumber: schema.members.memberNumber,
      firstName: schema.members.firstName,
      lastName: schema.members.lastName,
      amountCents: schema.payments.amountCents,
      method: schema.payments.method,
      status: schema.payments.status,
      paidAt: schema.payments.paidAt,
      createdAt: schema.payments.createdAt,
      notes: schema.payments.notes,
    })
    .from(schema.payments)
    .innerJoin(schema.members, eq(schema.members.id, schema.payments.memberId))
    .orderBy(desc(schema.payments.createdAt));

  return NextResponse.json(rows);
}

/** POST admin : enregistre un paiement encaissé manuellement (virement, chèque, espèces). */
export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Paiement invalide.", errors: formatZodErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { memberId, amountCents, method, status, notes } = parsed.data;

  const [payment] = await db
    .insert(schema.payments)
    .values({
      memberId,
      amountCents,
      method,
      status,
      notes,
      paidAt: status === "paid" ? new Date() : null,
    })
    .returning();

  return NextResponse.json(payment, { status: 201 });
}
