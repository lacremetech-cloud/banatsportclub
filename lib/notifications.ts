import {
  PREFERRED_PAYMENT_METHOD_LABELS,
  formatEuros,
  type PreferredPaymentMethod,
} from "./constants";
import { button, layout, row, sendEmail, table, type EmailResult } from "./email";
import { installmentLabel, splitInstallments } from "./fees";

/**
 * Contenu des emails transactionnels.
 *
 * Aucune donnée médicale n'est envoyée, y compris au bureau : la fiche
 * sanitaire reste dans le CRM, derrière l'authentification.
 */

export type RegistrationEmailData = {
  memberNumber: string;
  firstName: string;
  lastName: string;
  season: string;
  groupLabel: string;
  /** Cotisation figée sur cette adhésion. */
  feeAmountCents: number;
  /** 1, 2 ou 3 échéances. */
  paymentInstallments: number;
  preferredPaymentMethod: string;
  schoolLevelLabel: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianPhone: string;
  guardianEmail: string;
  /** Lien de reprise du paiement carte, quand il est disponible. */
  paymentUrl?: string;
};

/** « 2 × 100,00 € » quand il y a un échéancier, rien sinon. */
function installmentDetail(data: RegistrationEmailData): string | null {
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

function methodInstructions(data: RegistrationEmailData): string {
  switch (data.preferredPaymentMethod) {
    case "CARD":
      return data.paymentUrl
        ? `<p>Vous pouvez régler la cotisation en ligne dès maintenant.</p>${button(data.paymentUrl, `Payer ${formatEuros(splitInstallments(data.feeAmountCents, data.paymentInstallments)[0])} par carte`)}`
        : `<p>Le règlement par carte vous sera proposé depuis la page de confirmation de votre inscription.</p>`;
    case "BANK_TRANSFER":
      return `<p>Merci d'indiquer impérativement la référence <strong>${data.memberNumber}</strong> dans le libellé de votre virement, afin que le bureau puisse le rapprocher de l'inscription.</p>`;
    case "CHEQUE":
      return `<p>Le chèque est à remettre à l'équipe Banat Sport Club. L'adhésion sera validée par le bureau à réception du règlement.</p>`;
    case "CASH":
      return `<p>Le règlement en espèces est à remettre à l'équipe Banat Sport Club. L'adhésion sera validée par le bureau à réception.</p>`;
    default:
      return "";
  }
}

/** Email au responsable légal, juste après l'inscription. */
export async function sendRegistrationEmail(
  data: RegistrationEmailData,
): Promise<EmailResult> {
  const subject = `Inscription Banat Sport Club — ${data.memberNumber}`;

  const html = layout(
    "Inscription enregistrée",
    `<p>Bonjour,</p>
     <p>L'inscription de <strong>${data.firstName}</strong> est bien enregistrée.</p>
     ${table(
       row("Numéro d'adhérente", data.memberNumber) +
         row("Saison", data.season) +
         row("Créneau", data.groupLabel) +
         row("Cotisation", formatEuros(data.feeAmountCents)) +
         (installmentDetail(data)
           ? row("Rythme de paiement", installmentDetail(data)!)
           : "") +
         row("Moyen de paiement choisi", methodLabel(data.preferredPaymentMethod)),
     )}
     ${methodInstructions(data)}
     <p style="color:#8b1a3ab3;font-size:14px">L'adhésion sera définitivement validée après réception du règlement.</p>`,
  );

  const text = [
    "Inscription enregistrée",
    "",
    `L'inscription de ${data.firstName} est bien enregistrée.`,
    "",
    `Numéro d'adhérente : ${data.memberNumber}`,
    `Saison : ${data.season}`,
    `Créneau : ${data.groupLabel}`,
    `Cotisation : ${formatEuros(data.feeAmountCents)}`,
    installmentDetail(data) ? `Rythme de paiement : ${installmentDetail(data)}` : "",
    `Moyen de paiement choisi : ${methodLabel(data.preferredPaymentMethod)}`,
    data.preferredPaymentMethod === "BANK_TRANSFER"
      ? `\nRéférence à indiquer sur le virement : ${data.memberNumber}`
      : "",
    data.paymentUrl ? `\nRégler en ligne : ${data.paymentUrl}` : "",
    "",
    "L'adhésion sera définitivement validée après réception du règlement.",
    "",
    "Remettre les filles en jeu",
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail({ to: data.guardianEmail, subject, html, text });
}

/** Notification au bureau. Volontairement sans aucune donnée de santé. */
export async function sendBureauNotification(
  data: RegistrationEmailData,
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
