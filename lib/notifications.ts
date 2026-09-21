import { and, eq, isNull, sql } from "drizzle-orm";

import {
  PREFERRED_PAYMENT_METHOD_LABELS,
  formatEuros,
  type PreferredPaymentMethod,
} from "./constants";
import {
  button,
  layout,
  row,
  sendEmail,
  sendGmailEmail,
  table,
  type EmailResult,
} from "./email";
import { db, schema } from "./db";
import { installmentLabel, nextInstallmentCents, splitInstallments } from "./fees";
import { loadReglementPdf } from "./reglement";
import {
  getAssociation,
  getBankDetails,
  getSiteSettings,
  type Association,
  type BankDetails,
} from "./settings";

/**
 * Contenu des emails transactionnels.
 *
 * Aucune donnée médicale n'est envoyée, y compris au bureau : la fiche
 * sanitaire reste dans le CRM, derrière l'authentification.
 */

/** Ce que la notification au bureau a besoin de connaître. */
export type BureauNotificationData = {
  memberNumber: string;
  firstName: string;
  lastName: string;
  season: string;
  groupLabel: string;
  feeAmountCents: number;
  paymentInstallments: number;
  preferredPaymentMethod: string;
  schoolLevelLabel: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianPhone: string;
  guardianEmail: string;
};

/** Ce que la confirmation à la famille a besoin de connaître, en plus. */
export type RegistrationEmailData = BureauNotificationData & {
  /** Lien de reprise du paiement carte, quand il est disponible. */
  paymentUrl?: string;
  /** Ce qui a réellement été encaissé à l'instant de l'envoi. */
  paidCents: number;
  remainingCents: number;
  /** Coordonnées bancaires, lues dans les réglages. */
  bank: BankDetails;
  /** Nom, email et téléphone du club, lus dans les réglages. */
  association: Association;
};

/** « 2 × 100,00 € » quand il y a un échéancier, rien sinon. */
function installmentDetail(data: BureauNotificationData): string | null {
  if (data.paymentInstallments <= 1) return null;
  const parts = splitInstallments(data.feeAmountCents, data.paymentInstallments);
  const same = parts.every((part) => part === parts[0]);
  const amounts = same
    ? `${parts.length} × ${formatEuros(parts[0])}`
    : parts.map((part) => formatEuros(part)).join(" + ");
  return `${installmentLabel(data.paymentInstallments)} — ${amounts}`;
}

function methodLabel(method: string): string {
  return (
    PREFERRED_PAYMENT_METHOD_LABELS[method as PreferredPaymentMethod] ?? method
  );
}

/**
 * Rythme de paiement, en clair.
 *
 * « En 2 fois » ne veut pas dire « quand vous voulez » : ce sont deux
 * mensualités consécutives, et l'email le dit avec les montants réels issus
 * du découpage de la cotisation — jamais une somme écrite en dur.
 */
function installmentSchedule(data: RegistrationEmailData): string[] {
  if (data.paymentInstallments <= 1) return [];
  const parts = splitInstallments(data.feeAmountCents, data.paymentInstallments);
  if (data.paymentInstallments === 2) {
    return [
      `Paiement en 2 échéances : ${formatEuros(parts[0])} maintenant, puis ${formatEuros(parts[1])} le mois suivant.`,
    ];
  }
  return [
    `Paiement en ${data.paymentInstallments} échéances : ${parts
      .map((part) => formatEuros(part))
      .join(" puis ")}, une par mois.`,
  ];
}

/** Ce qu'il faut verser maintenant : l'échéance en cours, jamais plus. */
function dueNowCents(data: RegistrationEmailData): number {
  return nextInstallmentCents(
    data.feeAmountCents,
    data.paymentInstallments,
    data.paidCents,
  );
}

/** Consignes propres au moyen de règlement choisi, en HTML puis en texte. */
function methodInstructions(data: RegistrationEmailData): string {
  const dueNow = dueNowCents(data);

  switch (data.preferredPaymentMethod) {
    case "CARD":
      if (data.paidCents > 0 && data.remainingCents <= 0) {
        return `<p><strong>Paiement reçu : ${formatEuros(data.paidCents)}</strong>. Merci !</p>`;
      }
      return `${
        data.paidCents > 0
          ? `<p><strong>Paiement reçu : ${formatEuros(data.paidCents)}</strong>.</p>`
          : ""
      }<p>Le règlement par carte reste à finaliser : il vous est proposé depuis la page de confirmation de votre inscription.</p>${
        data.paymentUrl
          ? button(data.paymentUrl, `Payer ${formatEuros(dueNow)} par carte`)
          : ""
      }`;

    case "BANK_TRANSFER": {
      const coordinates = data.bank.iban
        ? table(
            (data.bank.holder ? row("Titulaire", data.bank.holder) : "") +
              row("IBAN", data.bank.iban) +
              (data.bank.bic ? row("BIC", data.bank.bic) : "") +
              row("Référence à indiquer", data.memberNumber),
          )
        : `<p>Les coordonnées bancaires vous seront communiquées par le bureau.</p>`;
      return `<p>Montant à virer : <strong>${formatEuros(dueNow)}</strong></p>
     ${coordinates}
     <p>Merci d'indiquer cette référence dans le libellé du virement.</p>`;
    }

    case "CHEQUE":
      return `<p>Le chèque est à remettre directement au club. Merci d'indiquer <strong>${data.memberNumber}</strong> au dos du chèque.</p>`;

    case "CASH":
      return `<p>Le règlement en espèces est à remettre directement au club.</p>`;

    default:
      return "";
  }
}

function methodInstructionsText(data: RegistrationEmailData): string[] {
  const dueNow = dueNowCents(data);

  switch (data.preferredPaymentMethod) {
    case "CARD":
      if (data.paidCents > 0 && data.remainingCents <= 0) {
        return [`Paiement reçu : ${formatEuros(data.paidCents)}. Merci !`];
      }
      return [
        ...(data.paidCents > 0 ? [`Paiement reçu : ${formatEuros(data.paidCents)}.`] : []),
        "Le règlement par carte reste à finaliser : il vous est proposé depuis la page de confirmation de votre inscription.",
        ...(data.paymentUrl ? [`Régler en ligne : ${data.paymentUrl}`] : []),
      ];

    case "BANK_TRANSFER":
      return [
        `Montant à virer : ${formatEuros(dueNow)}`,
        ...(data.bank.iban
          ? [
              ...(data.bank.holder ? [`Titulaire : ${data.bank.holder}`] : []),
              `IBAN : ${data.bank.iban}`,
              ...(data.bank.bic ? [`BIC : ${data.bank.bic}`] : []),
              `Référence à indiquer : ${data.memberNumber}`,
              "Merci d'indiquer cette référence dans le libellé du virement.",
            ]
          : ["Les coordonnées bancaires vous seront communiquées par le bureau."]),
      ];

    case "CHEQUE":
      return [
        `Le chèque est à remettre directement au club. Merci d'indiquer ${data.memberNumber} au dos du chèque.`,
      ];

    case "CASH":
      return ["Le règlement en espèces est à remettre directement au club."];

    default:
      return [];
  }
}

/**
 * Email de confirmation au responsable légal, juste après l'inscription.
 *
 * Envoyé par Gmail SMTP depuis l'adresse du club, avec le règlement intérieur
 * en pièce jointe, et en Reply-To l'adresse du bureau : la famille répond
 * directement à cet email.
 *
 * C'est un récapitulatif ADMINISTRATIF. Aucune donnée médicale, aucune note
 * interne, aucune information réservée au bureau n'y figure.
 */
export async function sendRegistrationEmail(
  data: RegistrationEmailData,
): Promise<EmailResult> {
  const subject = "Inscription Banat Sport Club — demande bien reçue";
  const fullName = `${data.firstName} ${data.lastName.toUpperCase()}`;
  const club = data.association.name;
  const schedule = installmentSchedule(data);

  const recap =
    row("Numéro d'adhérente", data.memberNumber) +
    row("Prénom et nom", fullName) +
    row("Saison", data.season) +
    row("Créneau choisi", data.groupLabel) +
    row("Cotisation", formatEuros(data.feeAmountCents)) +
    row("Plan de paiement", installmentLabel(data.paymentInstallments)) +
    row("Moyen de paiement choisi", methodLabel(data.preferredPaymentMethod)) +
    row("Montant déjà payé", formatEuros(data.paidCents)) +
    row("Reste à régler", formatEuros(data.remainingCents));

  const html = layout(
    "Demande d'inscription bien reçue",
    `<p>Bonjour,</p>
     <p>Nous avons bien reçu la demande d'inscription de <strong>${fullName}</strong> au ${club} pour la saison ${data.season}.</p>
     <h2 style="margin:28px 0 12px;font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:#8b1a3a">Récapitulatif</h2>
     ${table(recap)}
     ${schedule.map((line) => `<p>${line}</p>`).join("")}
     ${methodInstructions(data)}
     <p style="margin-top:28px">Votre demande est bien enregistrée.</p>
     <p>Pour toute question, vous pouvez répondre directement à cet email ou nous contacter au <a href="tel:${data.association.phone.replace(/\s/g, "")}" style="color:#e84670">${data.association.phone}</a>.</p>
     <p style="margin-bottom:0">${club}</p>`,
  );

  const text = [
    "Bonjour,",
    "",
    `Nous avons bien reçu la demande d'inscription de ${fullName} au ${club} pour la saison ${data.season}.`,
    "",
    "RÉCAPITULATIF",
    `Numéro d'adhérente : ${data.memberNumber}`,
    `Prénom et nom : ${fullName}`,
    `Saison : ${data.season}`,
    `Créneau choisi : ${data.groupLabel}`,
    `Cotisation : ${formatEuros(data.feeAmountCents)}`,
    `Plan de paiement : ${installmentLabel(data.paymentInstallments)}`,
    `Moyen de paiement choisi : ${methodLabel(data.preferredPaymentMethod)}`,
    `Montant déjà payé : ${formatEuros(data.paidCents)}`,
    `Reste à régler : ${formatEuros(data.remainingCents)}`,
    ...(schedule.length > 0 ? ["", ...schedule] : []),
    "",
    ...methodInstructionsText(data),
    "",
    "Votre demande est bien enregistrée.",
    "",
    `Pour toute question, vous pouvez répondre directement à cet email ou nous contacter au ${data.association.phone}.`,
    "",
    club,
    "Remettre les filles en jeu.",
  ].join("\n");

  const reglement = await loadReglementPdf();

  return sendGmailEmail({
    to: data.guardianEmail,
    subject,
    html,
    text,
    fromName: club,
    replyTo: data.association.email,
    attachments: reglement ? [reglement] : undefined,
  });
}

/** Notification au bureau. Volontairement sans aucune donnée de santé. */
export async function sendBureauNotification(
  data: BureauNotificationData,
): Promise<EmailResult> {
  const to = process.env.ADMIN_EMAIL?.trim();
  if (!to) {
    console.warn("[email] notification bureau non envoyée : ADMIN_EMAIL absent");
    return { sent: false, reason: "ADMIN_EMAIL absent" };
  }

  const subject = `Nouvelle inscription — ${data.firstName} ${data.lastName.toUpperCase()} — ${data.memberNumber}`;

  const html = layout(
    "Nouvelle inscription",
    table(
      row("Adhérente", `${data.firstName} ${data.lastName.toUpperCase()}`) +
        row("Numéro", data.memberNumber) +
        row("Classe", data.schoolLevelLabel) +
        row("Créneau", data.groupLabel) +
        row(
          "Responsable légal",
          `${data.guardianFirstName} ${data.guardianLastName}`,
        ) +
        row("Téléphone", data.guardianPhone) +
        row("Email", data.guardianEmail) +
        row("Paiement prévu", methodLabel(data.preferredPaymentMethod)) +
        (installmentDetail(data) ? row("Échéancier", installmentDetail(data)!) : ""),
    ),
  );

  const text = [
    "Nouvelle inscription",
    "",
    `Adhérente : ${data.firstName} ${data.lastName.toUpperCase()}`,
    `Numéro : ${data.memberNumber}`,
    `Classe : ${data.schoolLevelLabel}`,
    `Créneau : ${data.groupLabel}`,
    `Responsable légal : ${data.guardianFirstName} ${data.guardianLastName}`,
    `Téléphone : ${data.guardianPhone}`,
    `Email : ${data.guardianEmail}`,
    `Paiement prévu : ${methodLabel(data.preferredPaymentMethod)}`,
    installmentDetail(data) ? `Échéancier : ${installmentDetail(data)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail({ to, subject, html, text });
}

/** Email « paiement reçu », envoyé une seule fois par paiement. */
export async function sendPaymentReceivedEmail(data: {
  guardianEmail: string;
  firstName: string;
  memberNumber: string;
  amountCents: number;
  registrationStatus: string;
}): Promise<EmailResult> {
  const statusLine =
    data.registrationStatus === "ACTIVE"
      ? "L'adhésion est maintenant validée."
      : data.registrationStatus === "CANCELLED"
        ? "Cette adhésion a été annulée : le bureau vous recontactera au sujet de ce règlement."
        : "L'adhésion sera validée dès que la cotisation sera intégralement réglée.";

  const html = layout(
    "Paiement reçu",
    `<p>Nous avons bien reçu votre règlement de <strong>${formatEuros(data.amountCents)}</strong>.</p>
     ${table(
       row("Adhérente", data.firstName) +
         row("Numéro d'adhérente", data.memberNumber) +
         row("Montant", formatEuros(data.amountCents)) +
         row("Moyen", "Carte bancaire"),
     )}
     <p>${statusLine}</p>`,
  );

  const text = [
    "Paiement reçu",
    "",
    `Nous avons bien reçu votre règlement de ${formatEuros(data.amountCents)}.`,
    "",
    `Adhérente : ${data.firstName}`,
    `Numéro d'adhérente : ${data.memberNumber}`,
    `Montant : ${formatEuros(data.amountCents)}`,
    "Moyen : Carte bancaire",
    "",
    statusLine,
    "",
    "Remettre les filles en jeu",
  ].join("\n");

  return sendEmail({
    to: data.guardianEmail,
    subject: "Paiement reçu — Banat Sport Club",
    html,
    text,
  });
}

/**
 * Envoie l'email de confirmation UNE SEULE FOIS pour une inscription.
 *
 * Le verrou est posé en base avant l'envoi, par un UPDATE conditionnel : si
 * deux requêtes arrivent en même temps — un double clic, un rejeu de la route
 * par la plateforme — une seule obtient la ligne et envoie. En cas d'échec
 * SMTP, le verrou est relâché pour qu'une tentative ultérieure reste possible.
 *
 * Toutes les données viennent de la base, lues APRÈS l'écriture : montant
 * réellement dû, encaissements déjà constatés, coordonnées bancaires et
 * identité du club telles qu'elles sont réglées à cet instant.
 */
export async function sendRegistrationConfirmationOnce(
  memberId: string,
  extra: { schoolLevelLabel: string; guardianFirstName: string; guardianLastName: string; guardianPhone: string },
): Promise<EmailResult> {
  const claimed = await db
    .update(schema.members)
    .set({ registrationEmailSentAt: new Date() })
    .where(
      and(
        eq(schema.members.id, memberId),
        isNull(schema.members.registrationEmailSentAt),
      ),
    )
    .returning({ id: schema.members.id });

  if (claimed.length === 0) {
    return { sent: false, reason: "email de confirmation déjà envoyé" };
  }

  const [rows, { groups }, bank, association] = await Promise.all([
    db
      .select({
        memberNumber: schema.members.memberNumber,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
        season: schema.members.season,
        groupName: schema.members.groupName,
        feeAmountCents: schema.members.feeAmountCents,
        paymentInstallments: schema.members.paymentInstallments,
        preferredPaymentMethod: schema.members.preferredPaymentMethod,
        guardianEmail: schema.guardians.email,
      })
      .from(schema.members)
      .leftJoin(schema.guardians, eq(schema.guardians.memberId, schema.members.id))
      .where(eq(schema.members.id, memberId)),
    getSiteSettings(),
    getBankDetails(),
    getAssociation(),
  ]);

  const member = rows[0];
  if (!member?.guardianEmail) {
    await releaseClaim(memberId);
    return { sent: false, reason: "adhérente ou email introuvable" };
  }

  // Encaissements réellement constatés : nul à l'inscription, mais renseigné
  // si l'envoi est rejoué après un premier règlement.
  const [totals] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.payments.amountCents}), 0)::int` })
    .from(schema.payments)
    .where(
      and(eq(schema.payments.memberId, memberId), eq(schema.payments.status, "paid")),
    );
  const paidCents = Number(totals?.total ?? 0);

  const group = groups.find((item) => item.key === member.groupName);

  const result = await sendRegistrationEmail({
    memberNumber: member.memberNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    season: member.season,
    // Libellé public : la famille doit reconnaître le lieu, pas le raccourci
    // interne du CRM.
    groupLabel: group
      ? `${group.day} ${group.time} — ${group.place}`
      : member.groupName,
    feeAmountCents: member.feeAmountCents,
    paymentInstallments: member.paymentInstallments,
    preferredPaymentMethod: member.preferredPaymentMethod ?? "",
    paidCents,
    remainingCents: Math.max(member.feeAmountCents - paidCents, 0),
    bank,
    association,
    guardianEmail: member.guardianEmail,
    ...extra,
  });

  if (!result.sent) await releaseClaim(memberId);
  return result;
}

/** Rend l'envoi de nouveau possible après un échec. */
async function releaseClaim(memberId: string): Promise<void> {
  await db
    .update(schema.members)
    .set({ registrationEmailSentAt: null })
    .where(eq(schema.members.id, memberId));
}
