import { NextResponse } from "next/server";

import { SCHOOL_LEVEL_LABELS, type SchoolLevel } from "@/lib/constants";
import {
  sendBureauNotification,
  sendRegistrationConfirmationOnce,
  type BureauNotificationData,
} from "@/lib/notifications";
import { createRegistration } from "@/lib/registration";
import { getSiteSettings } from "@/lib/settings";
import { formatZodErrors, registrationSchema } from "@/lib/validation";

/**
 * POST public : enregistre une inscription complète.
 *
 * Crée en une transaction : members, guardians, emergency_contacts,
 * medical_info et les 3 lignes de consents. Aucun paiement n'est créé —
 * seul le mode de règlement souhaité est stocké sur l'adhérente.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Les données reçues sont invalides." },
      { status: 400 },
    );
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Merci de vérifier les informations saisies.",
        errors: formatZodErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  let registration;
  try {
    registration = await createRegistration(parsed.data);
  } catch (error) {
    // Jamais de message technique renvoyé à la famille : le détail va dans les logs.
    console.error("[registration]", error);
    return NextResponse.json(
      {
        message:
          "L’inscription n’a pas pu être enregistrée. Merci de réessayer dans un instant.",
      },
      { status: 500 },
    );
  }

  // À partir d'ici, l'inscription EST enregistrée : adhérente, responsable
  // légal, contacts d'urgence, fiche santé, consentements et numéro BSC. Tout
  // ce qui suit est accessoire et ne peut plus rien remettre en cause — ni
  // annuler l'inscription, ni renvoyer une erreur à la famille.
  try {
    const { groups } = await getSiteSettings();
    const group = groups.find((item) => item.key === registration.groupName);

    const bureauData: BureauNotificationData = {
      memberNumber: registration.memberNumber,
      firstName: registration.firstName,
      lastName: registration.lastName,
      season: registration.season,
      groupLabel: group
        ? `${group.day} ${group.time} — ${group.place}`
        : registration.groupName,
      feeAmountCents: registration.feeAmountCents,
      paymentInstallments: registration.paymentInstallments,
      preferredPaymentMethod: registration.preferredPaymentMethod,
      schoolLevelLabel:
        SCHOOL_LEVEL_LABELS[parsed.data.schoolLevel as SchoolLevel] ??
        parsed.data.schoolLevel,
      guardianFirstName: parsed.data.guardianFirstName,
      guardianLastName: parsed.data.guardianLastName,
      guardianPhone: parsed.data.guardianPhone,
      guardianEmail: parsed.data.guardianEmail,
    };

    await Promise.allSettled([
      // Confirmation à la famille : Gmail SMTP, règlement en pièce jointe,
      // verrou d'unicité posé en base. Elle relit les montants réels plutôt
      // que de faire confiance à ce qui vient d'être calculé ici.
      sendRegistrationConfirmationOnce(registration.id, {
        schoolLevelLabel: bureauData.schoolLevelLabel,
        guardianFirstName: bureauData.guardianFirstName,
        guardianLastName: bureauData.guardianLastName,
        guardianPhone: bureauData.guardianPhone,
      }),
      // Notification au bureau : inchangée, toujours par Resend.
      sendBureauNotification(bureauData),
    ]);
  } catch (error) {
    console.error("[registration] envoi des emails impossible :", error);
  }

  return NextResponse.json(registration, { status: 201 });
}
