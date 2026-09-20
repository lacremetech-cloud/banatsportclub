/**
 * Envoi d'emails via Resend.
 *
 * Règle absolue : une panne ou une absence de configuration email ne doit
 * JAMAIS faire échouer une inscription ou un encaissement. Toutes les
 * fonctions renvoient un booléen et journalisent côté serveur, sans jamais
 * exposer la clé ni remonter d'erreur à la famille.
 */

export type EmailResult = { sent: boolean; reason?: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    const reason = "RESEND_API_KEY ou RESEND_FROM_EMAIL absent";
    console.warn(`[email] non envoyé (${reason}) — sujet : ${input.subject}`);
    return { sent: false, reason };
  }

  try {
    // RESEND_API_BASE permet de router vers un double de test ; vide en production.
    const endpoint = `${process.env.RESEND_API_BASE?.trim() || "https://api.resend.com"}/emails`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      console.error(`[email] échec Resend ${response.status} : ${detail}`);
      return { sent: false, reason: `Resend ${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[email] échec réseau :", error);
    return { sent: false, reason: "réseau" };
  }
}

/** Mise en page commune, sobre et lisible dans tous les clients mail. */
export function layout(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#fff7f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1720">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <p style="margin:0;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#e84670;font-weight:700">Banat Sport Club</p>
  <h1 style="margin:12px 0 20px;font-size:24px;line-height:1.2;color:#8b1a3a">${title}</h1>
  ${body}
  <p style="margin:32px 0 0;padding-top:20px;border-top:1px solid #f48ba4;color:#8b1a3a;font-weight:600">Remettre les filles en jeu</p>
</div></body></html>`;
}

export function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 16px 6px 0;color:#8b1a3ab3;font-size:14px">${label}</td><td style="padding:6px 0;font-weight:600">${value}</td></tr>`;
}

export function table(rows: string): string {
  return `<table style="border-collapse:collapse;margin:0 0 20px">${rows}</table>`;
}

export function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#e84670;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700">${label}</a></p>`;
}
