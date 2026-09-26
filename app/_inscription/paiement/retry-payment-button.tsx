"use client";

import { useState } from "react";

import { formatEuros } from "@/lib/constants";

/** Relance un paiement carte pour le reste réellement dû. */
export function RetryPaymentButton({
  memberId,
  amountCents,
}: {
  memberId: string;
  amountCents: number;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        className="btn w-full sm:w-auto"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const response = await fetch("/api/payments/mollie", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ memberId }),
            });
            const data = await response.json();
            if (!response.ok || !data.checkoutUrl) {
              setError(data.message ?? "Le paiement en ligne est indisponible.");
              setPending(false);
              return;
            }
            window.location.href = data.checkoutUrl;
          } catch {
            setError("Connexion impossible. Réessayez dans un instant.");
            setPending(false);
          }
        }}
      >
        {pending ? "Ouverture du paiement…" : `Réessayer le paiement — ${formatEuros(amountCents)}`}
      </button>
      {error && (
        <p className="mt-3 rounded-xl bg-brand-light/25 px-4 py-3 text-brand-dark">
          {error}
        </p>
      )}
    </div>
  );
}
