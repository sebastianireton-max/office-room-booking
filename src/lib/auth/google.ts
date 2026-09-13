import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { SITE_URL } from "@/lib/site-config";

/**
 * Google sign-in as a plain OpenID Connect authorization-code flow with PKCE,
 * state and nonce. No auth library: the whole protocol is two HTTP calls.
 * SECURITY-RELEVANT (ORCHESTRATION.md guardrail 2).
 */
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

export const redirectUri = () => `${SITE_URL}/api/auth/google/callback`;

const random = () => randomBytes(32).toString("base64url");

export function buildAuthRequest() {
  const state = random();
  const nonce = random();
  const verifier = random();
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), state, nonce, verifier };
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
}

/**
 * Exchanges the code and validates the ID token claims. The token comes straight
 * from Google's token endpoint over TLS, which OIDC Core §3.1.3.7 accepts in
 * place of a signature check; issuer, audience, expiry and nonce are still
 * verified here, and an unverified email is refused.
 */
export async function exchangeCode(code: string, verifier: string, nonce: string): Promise<GoogleProfile> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status})`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google returned no id_token");
  return validateIdTokenClaims(id_token, nonce);
}

export function validateIdTokenClaims(idToken: string, nonce: string, now = Date.now() / 1000): GoogleProfile {
  const part = idToken.split(".")[1];
  if (!part) throw new Error("Malformed id_token");
  const c = JSON.parse(Buffer.from(part, "base64url").toString()) as Record<string, unknown>;

  if (!ISSUERS.has(String(c.iss))) throw new Error("id_token issuer mismatch");
  if (c.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("id_token audience mismatch");
  if (typeof c.exp !== "number" || c.exp < now - 60) throw new Error("id_token expired");
  if (c.nonce !== nonce) throw new Error("id_token nonce mismatch");
  if (c.email_verified !== true || typeof c.email !== "string") throw new Error("Google email is not verified");
  if (typeof c.sub !== "string" || !c.sub) throw new Error("id_token has no subject");

  return {
    sub: c.sub,
    email: c.email.toLowerCase(),
    name: typeof c.name === "string" && c.name ? c.name : c.email,
    picture: typeof c.picture === "string" ? c.picture : null,
  };
}
