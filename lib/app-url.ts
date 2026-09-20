/**
 * URL publique de l'application, nécessaire à Mollie pour la redirection et
 * le webhook.
 *
 * Priorité : APP_URL explicite, puis l'URL du déploiement Vercel courant,
 * puis le serveur local. Mollie doit pouvoir joindre cette URL depuis
 * l'extérieur : un déploiement Preview protégé par le SSO Vercel ne recevra
 * donc aucun webhook tant que la protection n'est pas levée.
 */
export function getAppUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
