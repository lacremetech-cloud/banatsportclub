# Vidéo de fond de la vitrine `/rejoindre`

Déposez ici un fichier nommé `hero.mp4` et/ou `hero.webm` : la vidéo apparaît
alors automatiquement en fond du hero, sans aucune modification de code.

Tant que ce dossier ne contient pas de vidéo, la page utilise son fond animé en
CSS et **aucune requête inutile n'est émise** — la présence du fichier est
vérifiée au rendu (`app/rejoindre/page.tsx`, `heroVideoSources`).

## Ce qui marche bien

- **Format** : `hero.mp4` (H.264) suffit partout ; ajouter `hero.webm` (VP9)
  allège le téléchargement sur Chrome et Firefox.
- **Durée** : 8 à 15 secondes, en boucle. Plus long ne se voit pas.
- **Poids** : viser moins de 3 Mo. C'est un fond, pas un film : 1280 px de large
  suffisent largement.
- **Cadrage** : la vidéo est recadrée en `object-fit: cover`. Le sujet doit
  rester au centre, l'image sera coupée sur les bords selon l'écran.
- **Son** : inutile. La balise est muette (obligatoire pour que les mobiles
  acceptent de lire automatiquement) et un voile sombre est posé par-dessus pour
  garder le texte lisible.
- **Mouvement** : lent et régulier. Un plan qui bouge trop concurrence le texte.

## Droit à l'image

Ne mettre ici que des images d'adhérentes dont l'autorisation de droit à
l'image a été donnée à l'inscription. Le refus est une réponse valide et il doit
être respecté, y compris sur cette page.

## Réglage système

Si la visiteuse a activé « réduire les animations » dans son système, la vidéo
n'est pas lancée. C'est voulu.
