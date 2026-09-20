"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/constants";

type MemberOption = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
};

export function PaymentForm({
  members,
  defaultAmountCents,
}: {
  members: MemberOption[];
  defaultAmountCents: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const euros = Number(data.get("amountEuros"));

    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: data.get("memberId"),
        amountCents: Math.round(euros * 100),
        method: data.get("method"),
        status: "paid",
        notes: data.get("notes"),
      }),
    });

    setPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "Enregistrement impossible.");
      return;
    }

    form.reset();
    router.refresh();
  }

  if (members.length === 0) {
    return <p className="text-brand-dark/70">Aucune adhérente à créditer pour le moment.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="memberId">
          Adhérente
        </label>
        <select id="memberId" name="memberId" className="field" required>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.lastName} {member.firstName} — {member.memberNumber}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="amountEuros">
          Montant (€)
        </label>
        <input
          id="amountEuros"
          name="amountEuros"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={(defaultAmountCents / 100).toFixed(2)}
          className="field"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="method">
          Moyen de paiement
        </label>
        <select id="method" name="method" className="field" defaultValue="transfer" required>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">
          Note (facultatif)
        </label>
        <input id="notes" name="notes" type="text" className="field" />
      </div>

      {error && (
        <p className="sm:col-span-2 rounded-xl bg-brand-light/25 px-4 py-3 text-brand-dark">
          {error}
        </p>
      )}

      <div className="sm:col-span-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le paiement"}
        </button>
      </div>
    </form>
  );
}
