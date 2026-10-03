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
 * Version du 25/09/2026, révisée — ce qui a changé par rapport à la
 * transcription précédente :
 *
 * - l'inscription se fait par formulaire en ligne, et le dossier n'est plus
 *   une liste de pièces signées mais de consentements confirmés (article 2) ;
 * - le paiement en plusieurs échéances et le règlement hors ligne entrent au
 *   règlement (article 3) ;
 * - la licence loisir au club partenaire disparaît, le club n'ouvrant plus
 *   qu'un créneau (articles 4 et 16) ;
 * - la séance d'essai demande des informations renseignées, non des pièces
 *   signées (article 5) ;
 * - la communication ne passe plus par un seul groupe mais par plusieurs
 *   canaux (article 12) ;
 * - le refus du droit à l'image n'« exclut » plus l'adhérente, il la tient
 *   hors des prises de vue concernées (article 15).
 */

export const HEADER = {
  organisation: "BANAT SPORT CLUB",
  legal: "Association loi 1901 – N° RNA : W343034172",
  title: "RÈGLEMENT INTÉRIEUR",
  season: "Saison 2026 – 2027 — Règlement intérieur du 25/09/2026",
};

export const PREAMBLE =
  "Le présent règlement intérieur complète les statuts de l’association Banat Sport Club. Il s’applique à l’ensemble des adhérentes, des encadrantes et des familles. Chaque adhérente et, pour les mineures, son représentant légal s’engagent à en prendre connaissance et à le respecter.";

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
        text: "L’adhésion est annuelle et valable du 1er septembre 2026 au 31 août 2027. Les séances sportives régulières ont lieu jusqu’au 20 juin 2027, hors vacances scolaires.",
      },
      {
        kind: "p",
        text: "L’inscription est réalisée au moyen du formulaire en ligne mis à disposition par l’association. Pour les adhérentes mineures, le formulaire est complété par leur représentant légal ; l’adhérente majeure effectue elle-même son inscription et donne ses propres consentements.",
      },
      {
        kind: "p",
        text: "La validation du formulaire et la confirmation des consentements obligatoires matérialisent l’acceptation des informations, autorisations et dispositions du présent règlement intérieur.",
      },
      {
        kind: "p",
        text: "L’adhésion est validée après réception d’un dossier complet et acceptation des modalités de règlement de la cotisation. Le dossier d’inscription comprend :",
      },
      {
        kind: "list",
        items: [
          "Formulaire d’inscription complété",
          "Informations sanitaires nécessaires",
          "Autorisation du représentant légal (pour les mineures)",
          "Consentements et autorisations demandés lors de l’inscription, dont le choix relatif au droit à l’image",
          "Acceptation du règlement intérieur",
          "Règlement de la cotisation selon les modalités convenues",
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
        text: "Le règlement peut être effectué en une fois ou en plusieurs échéances lorsque cette possibilité est proposée par l’association. Il peut, à titre exceptionnel, être effectué hors ligne puis enregistré par l’association.",
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
        text: "Lorsqu’une activité est organisée en extérieur, elle peut être modifiée, reportée ou annulée en cas de conditions météorologiques défavorables. Les familles en seront informées.",
      },
    ],
  },
  {
    title: "Article 5 — Séance d’essai",
    blocks: [
      {
        kind: "p",
        text: "Une séance d’essai gratuite peut être proposée aux filles souhaitant découvrir l’activité avant de s’inscrire. Pour une mineure, les informations et autorisations demandées par l’association doivent avoir été renseignées par le représentant légal avant la séance d’essai.",
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
        text: "Un ou plusieurs canaux de communication sont utilisés par l’association pour transmettre aux adhérentes et aux familles les informations relatives au planning, aux événements et aux éventuels changements : notamment WhatsApp, message individuel, email ou tout autre moyen communiqué par l’association. Les familles s’engagent à consulter régulièrement les messages.",
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
        text: "L’association peut être amenée à prendre des photos ou vidéos lors des séances et événements, à des fins d’archivage interne uniquement. Une autorisation relative au droit à l’image est recueillie lors de l’inscription. En cas de refus, l’adhérente n’est pas intégrée aux prises de vue concernées. Aucune image ne sera diffusée sur les réseaux sociaux ou tout support public sans autorisation appropriée.",
      },
    ],
  },
  {
    title: "Article 16 — Protection des données personnelles",
    blocks: [
      {
        kind: "p",
        text: "Les données personnelles recueillies lors de l’inscription sont utilisées exclusivement pour la gestion de l’association et la communication avec les familles. Elles ne sont transmises qu’aux personnes et prestataires nécessaires à la gestion de l’association, dans le respect de la réglementation applicable.",
      },
      {
        kind: "p",
        text: "Les données sont hébergées sur la plateforme de gestion AssoConnect, utilisée par l’association pour les inscriptions, les paiements et la comptabilité.",
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
