import nodemailer from "nodemailer";

/**
 * Envoi d'emails.
 *
 * Deux voies coexistent, et c'est délibéré :
 *
 * - **Gmail SMTP** (`sendGmailEmail`) pour l'email de confirmation
 *   d'inscription. Il part de l'adresse du club, la famille peut y répondre
 *   directement, et il porte le règlement intérieur en pièce jointe.
 * - **Resend** (`sendEmail`) pour les autres messages transactionnels déjà en
 *   place : notification au bureau et accusé de paiement.
 *
 * Toute la logique SMTP tient dans ce fichier : aucun autre module ne
 * construit de transport.
 *
 * Règle absolue, commune aux deux : une panne ou une absence de configuration
 * ne doit JAMAIS faire échouer une inscription ou un encaissement. Chaque
 * fonction renvoie un booléen et journalise côté serveur, sans jamais exposer
 * le mot de passe d'application ni la clé API, et sans remonter d'erreur à la
 * famille.
 */

export type EmailResult = { sent: boolean; reason?: string };

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

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

// --- Gmail SMTP -----------------------------------------------------------

/**
 * Le mot de passe d'application Google n'existe que dans l'environnement du
 * serveur. Il n'est jamais journalisé, jamais renvoyé au navigateur, jamais
 * affiché dans l'admin. Seule sa PRÉSENCE est observable, via cette fonction.
 */
export function isGmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER?.trim() && gmailAppPassword());
}

/**
 * Mot de passe d'application Google, débarrassé de ses espaces.
 *
 * Google l'affiche en quatre groupes de quatre — « abcd efgh ijkl mnop » —
 * et c'est sous cette forme qu'on le copie. Les espaces ne font pas partie
 * du secret : les laisser passer fait échouer l'authentification avec un
 * « 535 Username and Password not accepted » impossible à diagnostiquer
 * depuis la valeur, puisqu'elle n'est jamais affichée.
 */
function gmailAppPassword(): string {
  return (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "");
}

/**
 * Transport SMTP Gmail.
 *
 * Créé à la demande plutôt qu'au chargement du module : sur une fonction
 * serverless, l'import ne doit pas dépendre de la présence des variables.
 * `secure: true` sur le port 465 chiffre la connexion dès l'ouverture, sans
 * passer par STARTTLS.
 */
function gmailTransport() {
  return nodemailer.createTransport({
    // GMAIL_SMTP_HOST permet de router vers un serveur de test, exactement
    // comme RESEND_API_BASE plus haut. Vide en production : on parle alors à
    // Gmail. La connexion reste chiffrée et le certificat vérifié dans les
    // deux cas.
    host: process.env.GMAIL_SMTP_HOST?.trim() || "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER!.trim(),
      pass: gmailAppPassword(),
    },
  });
}

export async function sendGmailEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Nom affiché de l'expéditeur ; l'adresse reste GMAIL_USER. */
  fromName: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<EmailResult> {
  if (!isGmailConfigured()) {
    // Message volontairement neutre : il dit ce qui manque, jamais sa valeur.
    console.warn(
      `[email] Gmail email sending not configured — email non envoyé (sujet : ${input.subject})`,
    );
    return { sent: false, reason: "Gmail email sending not configured" };
  }

  const user = process.env.GMAIL_USER!.trim();

  try {
    await gmailTransport().sendMail({
      from: `"${input.fromName}" <${user}>`,
      to: input.to,
      replyTo: input.replyTo ?? user,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments,
    });
    return { sent: true };
  } catch (error) {
    // On ne journalise que le message : une erreur SMTP peut contenir la
    // commande AUTH, donc le mot de passe d'application.
    const message = error instanceof Error ? error.message : "erreur inconnue";
    console.error(`[email] échec Gmail SMTP : ${message.slice(0, 200)}`);
    return { sent: false, reason: "Gmail SMTP" };
  }
}
