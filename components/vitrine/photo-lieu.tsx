/**
 * Le lieu de chaque créneau, en photo.
 *
 * Ces deux images ont remplacé les terrains dessinés en SVG : un tracé animé
 * finit par ressembler à un pictogramme, là où une photo donne tout de suite la
 * lumière, la matière et l'échelle d'une salle. Un parent voit où sa fille va
 * passer sa saison, pas un schéma.
 *
 * Aucune personne n'y figure, et c'est une règle, pas un hasard : le droit à
 * l'image des adhérentes se demande famille par famille (voir
 * `public/videos/README.md`). Un lieu vide ne pose jamais cette question et ne
 * met en scène personne qui n'aurait pas dit oui.
 *
 * Il y avait ici une seconde variante, une pelouse, pour le créneau du
 * dimanche à Grabels. Le club n'ouvre plus qu'un créneau au public : elle est
 * partie avec lui — git la garde si l'extérieur rouvre un jour.
 *
 * Les fichiers sont importés plutôt que référencés par leur chemin : Next lit
 * alors leurs dimensions à la compilation, réserve la place exacte de l'image —
 * donc aucun sursaut de mise en page — et fabrique la vignette floue affichée
 * pendant le chargement.
 */
import Image from "next/image";

import dojo from "@/public/photos/dojo-tatamis.webp";

export type LieuVariant = "dojo";

/**
 * Les textes alternatifs décrivent ce que montre la photo, sans prétendre que
 * c'est notre salle : ce sont des images d'illustration, et une description
 * honnête vaut mieux qu'une légende flatteuse.
 */
const PHOTOS: Record<
  LieuVariant,
  { src: typeof dojo; alt: string; position: string }
> = {
  dojo: {
    src: dojo,
    alt: "Une grande salle de dojo aux tatamis bleus, murs blancs et miroirs.",
    // Les deux cadres sont beaucoup plus larges que hauts : un recadrage
    // centré ne garderait que le mur blanc et le plafond. On descend le point
    // d'ancrage pour que ce soient les tatamis — ce qu'on vient voir — qui
    // occupent l'image, avec juste assez de miroirs pour donner l'échelle.
    position: "object-[50%_85%]",
  },
};

export function PhotoLieu({
  variant,
  sizes,
  priority = false,
  className = "",
}: {
  variant: LieuVariant;
  /** Largeur d'affichage selon l'écran : c'est elle qui décide du poids téléchargé. */
  sizes: string;
  priority?: boolean;
  /** Mouvement propre à l'emplacement (dérive lente, zoom au survol…). */
  className?: string;
}) {
  const photo = PHOTOS[variant];

  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      className={`object-cover ${photo.position} ${className}`}
    />
  );
}

/** La même photo, en fond décoratif : pas de texte alternatif à lire. */
export function PhotoFond({
  variant,
  className = "",
}: {
  variant: LieuVariant;
  className?: string;
}) {
  return (
    <Image
      src={PHOTOS[variant].src}
      alt=""
      aria-hidden
      fill
      priority
      sizes="100vw"
      placeholder="blur"
      className={`object-cover ${PHOTOS[variant].position} ${className}`}
    />
  );
}
