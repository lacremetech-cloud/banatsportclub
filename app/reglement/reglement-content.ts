/**
 * Transcription fidèle du règlement intérieur officiel de Banat Sport Club,
 * saison 2026 – 2027 (public/Reglement_Interieur_BSC.pdf).
 *
 * Ce fichier ne contient AUCUNE reformulation : le texte est repris mot pour
 * mot du PDF officiel, qui reste le document de référence. Toute mise à jour
 * du règlement doit remplacer le PDF ET ce fichier, conjointement.
 */

export const PDF_PATH = "/Reglement_Interieur_BSC.pdf";

export const HEADER = {
  organisation: "BANAT SPORT CLUB",
  legal: "Association loi 1901 – N° RNA : W343034172",
  title: "RÈGLEMENT INTÉRIEUR",
  season: "Saison 2026 – 2027",
};

export const PREAMBLE =
  "Le présent règlement intérieur complète les statuts de l’association Banat Sport Club. Il s’applique à l’ensemble des adhérentes, des encadrantes et des familles. Chaque adhérente et son représentant légal s’engagent à en prendre connaissance et à le respecter.";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "highlight"; text: string }
  | { kind: "list"; items: string[] };

export type Article = { title: string; blocks: Block[] };

export const ARTICLES: Article[] = [
  {
    title: "Article 1 — Objet de l’association",
    blocks: [
      {
        kind: "p",
        text: "Banat Sport Club (BSC) est une association multisport loisir qui propose des activités physiques et sportives dans un cadre bienveillant, décontracté et sans compétition. L’association vise à favoriser la pratique sportive, le bien-être, la confiance en soi et le lien social.",
      },
    ],
  },
  {
    title: "Article 2 — Adhésion et inscription",
    blocks: [
      {
        kind: "p",
        text: "L’adhésion est annuelle et court de septembre à juin. Elle est validée après réception du dossier complet et du règlement de la cotisation. Le dossier d’inscription comprend :",
      },
      {
        kind: "list",
        items: [
          "Fiche d’inscription complétée et signée",
          "Autorisation parentale signée (pour les mineures)",
          "Fiche sanitaire de liaison",
          "Autorisation relative au droit à l’image",
          "Règlement intérieur signé",
          "Règlement de la cotisation",
        ],
      },
      {
        kind: "p",
        text: "Aucune adhérente ne sera autorisée à participer aux séances sans dossier complet.",
      },
    ],
  },
  {
    title: "Article 3 — Cotisation",
    blocks: [
      {
        kind: "p",
        text: "Le montant de la cotisation est fixé chaque saison par le Bureau avant le début des activités. La cotisation donne accès aux séances hebdomadaires ainsi qu’aux différentes activités proposées par l’association. Un kit BSC est inclus dans la cotisation.",
      },
      { kind: "highlight", text: "Cotisation annuelle : 200 €" },
      {
        kind: "p",
        text: "Aucun remboursement ne sera effectué en cas d’abandon en cours d’année, sauf cas exceptionnel examiné par le Bureau.",
      },
    ],
  },
  {
    title: "Article 4 — Séances et planning",
    blocks: [
      {
        kind: "p",
        text: "Les séances sont organisées selon un planning communiqué en début de saison. Ce planning peut évoluer en cours d’année. Les adhérentes et familles en seront informées à l’avance.",
      },
      {
        kind: "p",
        text: "Les séances régulières ne sont pas maintenues pendant les vacances scolaires. Des activités ponctuelles pourront être proposées durant ces périodes.",
      },
      {
        kind: "p",
        text: "Le programme sportif varie d’un trimestre à l’autre afin de proposer une diversité d’activités.",
      },
    ],
  },
  {
    title: "Article 5 — Tenue de sport",
    blocks: [
      {
        kind: "p",
        text: "Chaque adhérente doit se présenter en tenue de sport adaptée à la pratique :",
      },
      {
        kind: "list",
        items: [
          "Haut de sport à manches (t-shirt, sweat, pull…)",
          "Bas de survêtement",
          "Chaussures de sport propres",
          "Bouteille d’eau et serviette",
        ],
      },
    ],
  },
  {
    title: "Article 6 — Sécurité et hygiène",
    blocks: [
      { kind: "p", text: "Avant chaque séance, chaque adhérente doit :" },
      {
        kind: "list",
        items: [
          "Retirer ses bijoux (bagues, boucles d’oreilles, colliers, bracelets)",
          "S’attacher les cheveux",
          "Signaler tout problème de santé ou blessure à l’encadrante",
        ],
      },
      { kind: "p", text: "Pendant la séance :" },
      {
        kind: "list",
        items: [
          "Ne pas quitter le lieu de pratique sans en informer une encadrante",
          "Suivre les consignes des encadrantes en toutes circonstances",
          "Ne pas utiliser le matériel sans autorisation",
        ],
      },
      { kind: "p", text: "Après la séance :" },
      {
        kind: "list",
        items: [
          "Laisser les vestiaires propres",
          "Ne pas laisser de déchets sur le lieu de pratique",
          "Venir avec une tenue de sport propre à chaque séance",
        ],
      },
      {
        kind: "p",
        text: "Aucune nourriture n’est autorisée dans les salles de pratique.",
      },
    ],
  },
  {
    title: "Article 7 — Téléphones",
    blocks: [
      {
        kind: "p",
        text: "Les téléphones des adhérentes ne sont pas autorisés sur le terrain ni dans la salle de pratique. Ils restent au vestiaire pendant toute la durée de la séance.",
      },
    ],
  },
  {
    title: "Article 8 — Photos et vidéos",
    blocks: [
      {
        kind: "p",
        text: "La prise de photos et vidéos par les adhérentes pendant les séances n’est pas autorisée.",
      },
    ],
  },
  {
    title: "Article 9 — Comportement et respect",
    blocks: [
      { kind: "p", text: "BSC est un espace bienveillant. Chaque adhérente s’engage à :" },
      {
        kind: "list",
        items: [
          "Respecter les encadrantes, les autres adhérentes et le matériel",
          "Adopter un langage correct en toutes circonstances",
          "Ne pas se moquer, exclure ou juger",
          "Être ponctuelle — en cas de retard, ne pas perturber la séance en cours",
          "Ne pas quitter la séance avant la fin sans autorisation",
          "Participer activement et dans le respect des consignes",
        ],
      },
    ],
  },
  {
    title: "Article 10 — Présences et absences",
    blocks: [
      {
        kind: "p",
        text: "Un appel est effectué au début de chaque séance. En cas d’absence, un message sera envoyé aux parents.",
      },
      {
        kind: "p",
        text: "En cas d’absence prévue, les familles sont priées d’en informer l’encadrante à l’avance. En cas d’absences répétées sans justification, le Bureau se réserve le droit de contacter la famille.",
      },
    ],
  },
  {
    title: "Article 11 — Communication avec les familles",
    blocks: [
      {
        kind: "p",
        text: "Un groupe de communication dédié aux parents est mis en place pour transmettre les informations régulières : planning, événements, changements, absences. Les familles s’engagent à consulter régulièrement les messages.",
      },
    ],
  },
  {
    title: "Article 12 — Sanctions",
    blocks: [
      {
        kind: "p",
        text: "Tout comportement contraire aux règles du présent règlement pourra faire l’objet de :",
      },
      {
        kind: "list",
        items: [
          "Un avertissement oral",
          "Un avertissement écrit adressé aux parents",
          "Une exclusion temporaire",
          "Une exclusion définitive, décidée par le Bureau",
        ],
      },
      {
        kind: "p",
        text: "Le Bureau se réserve le droit d’exclure immédiatement toute adhérente dont le comportement met en danger la sécurité ou l’intégrité des autres participantes.",
      },
    ],
  },
  {
    title: "Article 13 — Responsabilité",
    blocks: [
      {
        kind: "p",
        text: "L’association décline toute responsabilité en cas de perte ou de vol d’effets personnels dans les vestiaires ou sur les lieux de pratique. Il est conseillé de ne pas apporter d’objets de valeur.",
      },
      {
        kind: "p",
        text: "Les parents ou représentants légaux sont responsables de l’acheminement de leur enfant avant et après les séances. L’association n’assure pas le transport ni la surveillance en dehors des horaires de séance.",
      },
    ],
  },
  {
    title: "Article 14 — Droit à l’image",
    blocks: [
      {
        kind: "p",
        text: "L’association peut être amenée à prendre des photos ou vidéos lors des séances et événements, à des fins d’archivage interne uniquement. Une autorisation relative au droit à l’image est signée lors de l’inscription. En cas de refus, l’adhérente sera exclue des prises de vue. Aucune image ne sera diffusée sur les réseaux sociaux ou tout support public.",
      },
    ],
  },
  {
    title: "Article 15 — Protection des données personnelles",
    blocks: [
      {
        kind: "p",
        text: "Les données personnelles recueillies lors de l’inscription sont utilisées exclusivement pour la gestion de l’association et la communication avec les familles. Elles ne sont pas communiquées à des tiers. Conformément au RGPD, chaque adhérente ou représentant légal peut demander l’accès, la rectification ou la suppression de ses données.",
      },
    ],
  },
  {
    title: "Article 16 — Assurance",
    blocks: [
      {
        kind: "p",
        text: "L’association est couverte par une assurance responsabilité civile. Il est recommandé aux familles de souscrire une assurance individuelle accident complémentaire pour leur enfant.",
      },
    ],
  },
  {
    title: "Article 17 — Modification du règlement",
    blocks: [
      {
        kind: "p",
        text: "Le présent règlement intérieur peut être modifié par le Bureau. Toute modification sera communiquée aux adhérentes et à leurs familles.",
      },
    ],
  },
];
