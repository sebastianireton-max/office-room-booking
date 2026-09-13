import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getUserById } from "@/lib/db/accounts-repository";
import type { User } from "@/types/domain";

/**
 * Stateless signed cookies: base64url(JSON payload) + "." + HMAC-SHA256.
 * AUTH_SECRET must be a long random string (openssl rand -base64 32).
 *
 * ponytail: no server-side session table, so a stolen cookie is valid until it
 * expires. Admin rights are still re-checked against ADMIN_EMAILS on every
 * request, so removing an admin takes effect at once. Add a sessions table
 * if per-device sign-out is ever needed.
 */
export const SESSION_COOKIE = "cr_session";
export const OAUTH_COOKIE = "cr_oauth";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET is missing or shorter than 32 characters. See .env.example.");
  return s;
}

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32 && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

const mac = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function sign(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body)}`;
}

/** Returns the payload only if the signature is valid and `exp` (unix seconds) is in the future. */
export function verify<T extends { exp: number }>(token: string | undefined): T | null {
  if (!token || !process.env.AUTH_SECRET) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

export const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function getCurrentUser(): Promise<User | null> {
  const session = verify<{ uid: string; exp: number }>((await cookies()).get(SESSION_COOKIE)?.value);
  return session ? getUserById(session.uid) : null;
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Emails stored on users are Google-verified at sign-in (email_verified is required). */
export function isAdmin(user: User | null): user is User {
  return Boolean(user && adminEmails().includes(user.email.toLowerCase()));
}

/** Only same-site relative paths, so `next` can never bounce a user off-site. */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
