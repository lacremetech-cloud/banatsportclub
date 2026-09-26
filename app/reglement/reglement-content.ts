/**
 * Transcription fidèle du règlement intérieur officiel de Banat Sport Club,
 * saison 2026 – 2027, version du 25/09/2026.
 *
 * Ce fichier ne contient AUCUNE reformulation : le texte est repris mot pour
 * mot du PDF officiel, qui reste le document de référence. Toute mise à jour
 * du règlement doit remplacer le PDF ET ce fichier, conjointement.
 *
 * Le PDF lui-même est déclaré une seule fois, dans `lib/reglement.ts` : la
 * page et l'email de confirmation servent ainsi exactement le même document.
 *
 * Version du 25/09/2026 — ce qui a changé par rapport à la précédente :
 * un nouvel « Article 5 — Séance d'essai » (qui décale la numérotation de
 * tous les suivants), la licence loisir au club partenaire pour le créneau du
 * dimanche (article 4), et le détail de l'hébergement des données chez
 * AssoConnect (article 16).
 */

export const HEADER = {
  organisation: "BANAT SPORT CLUB",
  legal: "Association loi 1901 – N° RNA : W343034172",
  title: "RÈGLEMENT INTÉRIEUR",
  season: "Saison 2026 – 2027 — Règlement intérieur du 25/09/2026",
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
        text: "L’adhésion est annuelle et valable du 1er septembre 2026 au 31 août 2027. Les séances sportives régulières ont lieu jusqu’au 20 juin 2027, hors vacances scolaires. L’adhésion est validée après réception du dossier complet et du règlement de la cotisation. Le dossier d’inscription comprend :",
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
        text: "Le montant de la cotisation est fixé chaque saison par le Bureau avant le début des activités. La cotisation donne accès aux séances hebdomadaires. Pour la saison 2026-2027, un kit BSC est offert à chaque adhérente.",
      },
      { kind: "highlight", text: "Cotisation annuelle : 200 €" },
      {
        kind: "p",
        text: "D’autres activités pourront être proposées tout au long de l’année, pendant les vacances et l’été. Les conditions de participation seront communiquées aux familles le moment venu.",
      },
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
      {
        kind: "p",
        text: "Les adhérentes inscrites au créneau du dimanche bénéficient d’une licence loisir au club partenaire (Football Club de Grabels), incluse dans la cotisation, donnant accès aux équipements et au matériel sur place.",
      },
      {
        kind: "p",
        text: "En cas de conditions météorologiques défavorables, la séance en extérieur peut être annulée. Les familles seront prévenues par message.",
      },
    ],
  },
  {
    title: "Article 5 — Séance d’essai",
    blocks: [
      {
        kind: "p",
        text: "Une séance d’essai gratuite peut être proposée aux filles souhaitant découvrir l’activité avant de s’inscrire. L’autorisation parentale et la fiche sanitaire restent obligatoires pour y participer.",
      },
    ],
  },
  {
    title: "Article 6 — Tenue de sport",
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
      {
        kind: "p",
        text: "Une tenue de sport propre est exigée à chaque séance.",
      },
    ],
  },
  {
    title: "Article 7 — Sécurité et hygiène",
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
        ],
      },
      {
        kind: "p",
        text: "Aucune nourriture n’est autorisée dans les salles de pratique.",
      },
    ],
  },
  {
    title: "Article 8 — Téléphones",
    blocks: [
      {
        kind: "p",
        text: "Les téléphones des adhérentes ne sont pas autorisés sur le terrain ni dans la salle de pratique. Ils restent au vestiaire pendant toute la durée de la séance.",
      },
    ],
  },
  {
    title: "Article 9 — Photos et vidéos",
    blocks: [
      {
        kind: "p",
        text: "La prise de photos et vidéos par les adhérentes pendant les séances n’est pas autorisée.",
      },
    ],
  },
  {
    title: "Article 10 — Comportement et respect",
    blocks: [
      {
        kind: "p",
        text: "BSC est un espace bienveillant. Chaque adhérente s’engage à :",
      },
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
    title: "Article 11 — Présences et absences",
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
    title: "Article 12 — Communication avec les familles",
    blocks: [
      {
        kind: "p",
        text: "Un groupe de communication dédié aux parents est mis en place pour transmettre les informations régulières : planning, événements, changements. Les familles s’engagent à consulter régulièrement les messages.",
      },
    ],
  },
  {
    title: "Article 13 — Sanctions",
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
    title: "Article 14 — Responsabilité",
    blocks: [
      {
        kind: "p",
        text: "L’association décline toute responsabilité en cas de perte ou de vol d’effets personnels dans les vestiaires ou sur les lieux de pratique. Il est conseillé de ne pas apporter d’objets de valeur. Les objets trouvés seront conservés pendant un mois.",
      },
      {
        kind: "p",
        text: "Les parents ou représentants légaux sont responsables de l’acheminement de leur enfant avant et après les séances. L’association n’assure pas le transport ni la surveillance en dehors des horaires de séance. Les parents s’engagent à récupérer leur enfant à l’heure. En cas de retard répété, le Bureau se réserve le droit de contacter la famille.",
      },
    ],
  },
  {
    title: "Article 15 — Droit à l’image",
    blocks: [
      {
        kind: "p",
        text: "L’association peut être amenée à prendre des photos ou vidéos lors des séances et événements, à des fins d’archivage interne uniquement. Une autorisation relative au droit à l’image est signée lors de l’inscription. En cas de refus, l’adhérente sera exclue des prises de vue. Aucune image ne sera diffusée sur les réseaux sociaux ou tout support public.",
      },
    ],
  },
  {
    title: "Article 16 — Protection des données personnelles",
    blocks: [
      {
        kind: "p",
        text: "Les données personnelles recueillies lors de l’inscription sont utilisées exclusivement pour la gestion de l’association et la communication avec les familles. Elles ne sont pas communiquées à des tiers.",
      },
      {
        kind: "p",
        text: "Les données sont hébergées sur la plateforme de gestion AssoConnect, utilisée par l’association pour les inscriptions, les paiements et la comptabilité.",
      },
      {
        kind: "p",
        text: "Pour les adhérentes inscrites au créneau du dimanche, les données nécessaires à la création de la licence loisir (nom, prénom, date de naissance) sont transmises au club partenaire (Football Club de Grabels). Ces données sont utilisées exclusivement à cette fin.",
      },
      {
        kind: "p",
        text: "Conformément au RGPD, chaque adhérente ou représentant légal peut demander l’accès, la rectification ou la suppression de ses données.",
      },
    ],
  },
  {
    title: "Article 17 — Assurance",
    blocks: [
      {
        kind: "p",
        text: "L’association est couverte par une assurance responsabilité civile. Il est recommandé aux familles de souscrire une assurance individuelle accident complémentaire pour leur enfant.",
      },
    ],
  },
  {
    title: "Article 18 — Modification du règlement",
    blocks: [
      {
        kind: "p",
        text: "Le présent règlement intérieur peut être modifié par le Bureau. Toute modification sera communiquée aux adhérentes et à leurs familles.",
      },
    ],
  },
];
