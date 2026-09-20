import { NextResponse } from "next/server";

import { createRegistration } from "@/lib/registration";
import { formatZodErrors, registrationSchema } from "@/lib/validation";

/** POST public : enregistre une nouvelle inscription. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Merci de vérifier les champs du formulaire.",
        errors: formatZodErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    const member = await createRegistration(parsed.data);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("[registration]", error);
    return NextResponse.json(
      { message: "Enregistrement impossible pour le moment." },
      { status: 500 },
    );
  }
}
