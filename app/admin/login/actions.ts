"use server";

import { redirect } from "next/navigation";

import { checkCredentials, createSession, destroySession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe sont obligatoires." };
  }

  if (!checkCredentials(email, password)) {
    return { error: "Identifiants incorrects." };
  }

  await createSession(email);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
