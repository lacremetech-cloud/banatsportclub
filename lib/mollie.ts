/**
 * Client Mollie minimal.
 *
 * Quelques appels REST suffisent : pas de SDK à maintenir. La clé API ne
 * quitte jamais le serveur — aucun module client n'importe ce fichier.
 */

/**
 * Base de l'API. Surchargeable par MOLLIE_API_BASE pour pointer un double de
 * test pendant les tests d'intégration ; vide en production.
 */
function apiBase(): string {
  return process.env.MOLLIE_API_BASE?.trim() || "https://api.mollie.com/v2";
}

export type MolliePayment = {
  id: string;
  status: string;
  amount: { value: string; currency: string };
  metadata?: Record<string, string> | null;
  paidAt?: string | null;
  _links?: { checkout?: { href: string } | null };
};

export function isMollieConfigured(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY?.trim());
}

/** `test_…` en développement, `live_…` en production. */
export function mollieMode(): "test" | "live" | null {
  const key = process.env.MOLLIE_API_KEY?.trim();
  if (!key) return null;
  return key.startsWith("live_") ? "live" : "test";
}

function apiKey(): string {
  const key = process.env.MOLLIE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "MOLLIE_API_KEY est absent : le paiement par carte n'est pas configuré.",
    );
  }
  return key;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const body = await response.text();
  if (!response.ok) {
    // Le corps peut contenir des détails utiles, mais jamais la clé.
    throw new Error(`Mollie ${response.status} sur ${path} : ${body.slice(0, 300)}`);
  }
  return JSON.parse(body) as T;
}

export async function createMollieCheckout(input: {
  amountCents: number;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata: Record<string, string>;
}): Promise<MolliePayment> {
  return request<MolliePayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: {
        currency: "EUR",
        // Mollie attend une chaîne à deux décimales.
        value: (input.amountCents / 100).toFixed(2),
      },
      description: input.description,
      redirectUrl: input.redirectUrl,
      webhookUrl: input.webhookUrl,
      metadata: input.metadata,
    }),
  });
}

/** Statut réel du paiement, lu directement chez Mollie. */
export async function fetchMolliePayment(id: string): Promise<MolliePayment> {
  return request<MolliePayment>(`/payments/${encodeURIComponent(id)}`);
}
