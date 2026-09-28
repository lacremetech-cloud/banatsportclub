/**
 * Adhésion en ligne — AssoConnect.
 *
 * Le club encaisse les adhésions sur AssoConnect : le formulaire, le paiement
 * et le reçu sont chez eux. La vitrine d'accueil ne fait que donner envie
 * puis y conduire. Rien n'est saisi ni stocké de notre côté sur ce chemin.
 *
 * Le formulaire a un temps été intégré dans la page, dans un iframe dont
 * AssoConnect pilotait la hauteur. Il y tenait mal — double barre de
 * défilement, étape de paiement à l'étroit — et l'inscription est trop
 * importante pour se jouer dans un compromis d'affichage : tous les chemins
 * mènent désormais à la collecte en pleine page. D'où ce fichier réduit à une
 * URL et un QR code ; la vérification d'origine du `postMessage` a disparu
 * avec le cadre qu'elle protégeait.
 */

/** Page publique de la collecte. Tout le site y conduit. */
export const ADHESION_URL =
  "https://banat-sport-club.assoconnect.com/collect/description/762212-a-banat-sport-club-adhesion-annuelle-2026-2027";

/** QR code de la collecte, généré depuis `ADHESION_URL` et vérifié par relecture. */
export const ADHESION_QR_PATH = "/qr-adhesion.svg";
