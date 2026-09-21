import { formatEuros } from "./constants";

/**
 * Messages préremplis pour le bureau.
 *
 * Aucun SMS n'est envoyé par l'application : il n'y a ni Twilio, ni API, ni
 * abonnement. On construit seulement un lien `sms:` que le téléphone ouvre
 * dans son application Messages, avec le numéro et le texte déjà en place.
 * C'est toujours une personne du bureau qui appuie sur « Envoyer ».
 */

/**
 * Un numéro écrit « 06 12 34 56 78 » ne passe pas toujours tel quel dans un
 * lien : on retire tout sauf les chiffres et un éventuel « + » initial.
 */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/[^0-9]/g, "");
}

/**
 * Lien `sms:` compatible iOS et Android.
 *
 * Android attend `?body=`, iOS historiquement `&body=`. La forme `?&body=`
 * est comprise par les deux, c'est pour cela qu'elle paraît bizarre.
 */
export function smsHref(phone: string, body = ""): string {
  const number = normalizePhone(phone);
  // Sans texte à proposer, on ouvre simplement la conversation : un `body`
  // vide ferait apparaître un brouillon bizarre sur certains téléphones.
  return body ? `sms:${number}?&body=${encodeURIComponent(body)}` : `sms:${number}`;
}

const SIGNATURE = "Banat Sport Club";

/**
 * Absence constatée.
 *
 * Aucune formule dépendant de l'heure : le bureau saisit parfois la feuille
 * le soir, parfois le lendemain matin.
 */
export function absenceSms(firstName: string): string {
  return [
    `Bonjour, ici ${SIGNATURE}. Nous vous contactons pour vous informer de l’absence de ${firstName} à la séance du jour. Merci de nous confirmer si cette absence était prévue.`,
    SIGNATURE,
  ].join("\n");
}

/** Retard constaté. Ton neutre : on informe, on ne reproche rien. */
export function latenessSms(firstName: string): string {
  return [
    `Bonjour, ici ${SIGNATURE}. Nous vous informons que ${firstName} est arrivée en retard à la séance du jour. Nous vous transmettons simplement l’information.`,
    SIGNATURE,
  ].join("\n");
}

/** Relance de cotisation. Le montant restant est toujours calculé, jamais saisi. */
export function paymentReminderSms(firstName: string, remainingCents: number): string {
  return [
    `Bonjour, ici ${SIGNATURE}. Sauf erreur de notre part, il reste ${formatEuros(remainingCents)} à régler pour l’adhésion de ${firstName}. Si le règlement a déjà été effectué, vous pouvez ne pas tenir compte de ce message.`,
    `Merci, ${SIGNATURE}`,
  ].join("\n");
}
