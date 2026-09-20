import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Authentification admin minimaliste.
 *
 * Un seul identifiant partagé (présidente / trésorière / secrétaire), défini
 * par les variables d'environnement ADMIN_EMAIL et ADMIN_PASSWORD.
 * La session est un cookie httpOnly signé en HMAC-SHA256 : pas de table
 * `users`, pas de librairie d'auth, pas de rôles.
 */

const COOKIE_NAME = "bsc_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 heures

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET est manquant ou trop court (32 caractères minimum). Voir .env.example.",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Comparaison à temps constant, tolérante aux longueurs différentes. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function checkCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) {
    throw new Error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis. Voir .env.example.");
  }
  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}

/** Crée le cookie de session. À appeler après checkCredentials(). */
export async function createSession(email: string): Promise<void> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${Buffer.from(email).toString("base64url")}.${expiresAt}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Renvoie l'email de l'admin connectée, ou null. */
export async function getSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [encodedEmail, expiresAt, signature] = parts;

  const payload = `${encodedEmail}.${expiresAt}`;
  if (!safeEqual(signature, sign(payload))) return null;
  if (Number(expiresAt) < Date.now()) return null;

  return { email: Buffer.from(encodedEmail, "base64url").toString("utf8") };
}

/** À appeler en haut des pages admin : redirige vers /admin/login si non connectée. */
export async function requireSession(): Promise<{ email: string }> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
