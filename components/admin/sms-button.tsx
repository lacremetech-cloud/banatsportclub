import { smsHref } from "@/lib/sms";

/**
 * Lien vers l'application Messages du téléphone, numéro et texte déjà remplis.
 *
 * Ce n'est pas un bouton d'envoi : rien ne part tant que la personne du bureau
 * n'a pas appuyé sur « Envoyer » dans son téléphone. Aucun fournisseur SMS
 * n'est appelé.
 *
 * La zone tactile fait au moins 44 px de haut, pour rester confortable au
 * doigt à côté des autres actions.
 */
export function SmsButton({
  phone,
  message,
  label = "SMS",
  title,
}: {
  phone: string | null | undefined;
  message: string;
  label?: string;
  /** Infobulle : dit ce que le SMS annonce, avant de l'ouvrir. */
  title?: string;
}) {
  if (!phone) return null;

  return (
    <a
      href={smsHref(phone, message)}
      title={title}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-brand-light/60 bg-white px-3 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand hover:text-brand"
    >
      <span aria-hidden>✉</span>
      {label}
    </a>
  );
}
