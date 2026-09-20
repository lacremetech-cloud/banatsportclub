import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
      <h1 className="text-2xl font-bold text-brand-dark">Espace bureau</h1>
      <p className="mt-2 mb-6 text-sm text-brand-dark/70">
        Identifiant commun à la présidente, la trésorière et la secrétaire.
      </p>
      <div className="card">
        <LoginForm />
      </div>
    </main>
  );
}
