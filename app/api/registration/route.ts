import { NextResponse } from "next/server";

import { createRegistration } from "@/lib/registration";
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

  try {
    const registration = await createRegistration(parsed.data);
    return NextResponse.json(registration, { status: 201 });
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
}
