import { asc, desc, eq } from "drizzle-orm";

import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatEuros,
} from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { getAnnualFeeCents, getSeason } from "@/lib/settings";

import { PaymentForm } from "./payment-form";

export const dynamic = "force-dynamic";

export default async function PaiementsPage() {
  const season = await getSeason();
  const feeCents = await getAnnualFeeCents();

  const [members, payments] = await Promise.all([
    db
      .select({
        id: schema.members.id,
        memberNumber: schema.members.memberNumber,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
      })
      .from(schema.members)
      .where(eq(schema.members.season, season))
      .orderBy(asc(schema.members.lastName), asc(schema.members.firstName)),
    db
      .select({
        id: schema.payments.id,
        memberNumber: schema.members.memberNumber,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
        amountCents: schema.payments.amountCents,
        method: schema.payments.method,
        status: schema.payments.status,
        createdAt: schema.payments.createdAt,
        notes: schema.payments.notes,
      })
      .from(schema.payments)
      .innerJoin(schema.members, eq(schema.members.id, schema.payments.memberId))
      .orderBy(desc(schema.payments.createdAt)),
  ]);

  const collectedCents = payments
    .filter((payment) => payment.status === "paid")
    .reduce((acc, payment) => acc + payment.amountCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Paiements</h1>
        <p className="mt-1 text-brand-dark/70">
          {formatEuros(collectedCents)} encaissés sur la saison {season}.
        </p>
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold text-brand-dark">Enregistrer un paiement</h2>
        <p className="mt-1 mb-4 text-sm text-brand-dark/60">
          Virement, chèque ou espèces. Les paiements par carte seront créés
          automatiquement par Mollie plus tard.
        </p>
        <PaymentForm members={members} defaultAmountCents={feeCents} />
      </section>

      {payments.length === 0 ? (
        <p className="card text-brand-dark/70">Aucun paiement enregistré.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-light/40 bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-brand-light/15 text-brand-dark">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Adhérente</th>
                <th className="px-4 py-3 font-semibold">Montant</th>
                <th className="px-4 py-3 font-semibold">Moyen</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-brand-light/30 align-top">
                  <td className="px-4 py-3">{formatDate(payment.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-brand-dark">
                      {payment.firstName} {payment.lastName}
                    </span>
                    <span className="block font-mono text-xs text-brand-dark/60">
                      {payment.memberNumber}
                    </span>
                    {payment.notes && (
                      <span className="block text-xs text-brand-dark/60">{payment.notes}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatEuros(payment.amountCents)}</td>
                  <td className="px-4 py-3">
                    {PAYMENT_METHOD_LABELS[
                      payment.method as keyof typeof PAYMENT_METHOD_LABELS
                    ] ?? payment.method}
                  </td>
                  <td className="px-4 py-3">
                    {PAYMENT_STATUS_LABELS[
                      payment.status as keyof typeof PAYMENT_STATUS_LABELS
                    ] ?? payment.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
