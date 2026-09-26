/**
 * Adhésion en ligne — AssoConnect.
 *
 * Le club encaisse les adhésions sur AssoConnect : le formulaire, le paiement
 * et le reçu sont chez eux. La vitrine `/rejoindre` ne fait que donner envie
 * puis y conduire. Rien n'est saisi ni stocké de notre côté sur ce chemin.
 *
 * Tout est réuni ici pour qu'un changement de campagne (nouvelle saison,
 * nouvelle collecte) se fasse en un seul endroit, et pour que les origines
 * autorisées ne soient jamais recopiées à la main dans un composant.
 */

/** Page publique de la collecte, à ouvrir en plein écran. */
export const ADHESION_URL =
  "https://banat-sport-club.assoconnect.com/collect/description/762212-a-banat-sport-club-adhesion-annuelle-2026-2027";

/** Même page, en version intégrable. */
export const ADHESION_IFRAME_URL = `${ADHESION_URL}?iframe=1`;

/**
 * Origines autorisées à dicter la hauteur de l'iframe.
 *
 * AssoConnect envoie sa hauteur par `postMessage`. Sans ce filtre, n'importe
 * quel site ouvert dans un autre onglet pourrait envoyer le même message et
 * redimensionner le cadre : on vérifie donc systématiquement `event.origin`.
 * `pay.assoconnect.com` figure dans la liste parce que l'étape de paiement
 * change de domaine en cours de parcours.
 */
export const ADHESION_ALLOWED_ORIGINS = [
  "https://banat-sport-club.assoconnect.com",
  "https://pay.assoconnect.com",
] as const;

/** QR code de la collecte, généré depuis `ADHESION_URL` et vérifié par relecture. */
export const ADHESION_QR_PATH = "/qr-adhesion.svg";
