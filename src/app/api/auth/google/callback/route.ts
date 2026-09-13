import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { exchangeCode } from "@/lib/auth/google";
import { cookieBase, OAUTH_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE, sign, verify } from "@/lib/auth/session";
import { upsertGoogleUser } from "@/lib/db/accounts-repository";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

type OAuthState = { state: string; nonce: string; verifier: string; next: string; exp: number };

const sameString = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Google redirects back here. SECURITY-RELEVANT. */
export async function GET(req: NextRequest) {
  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/signin?error=${reason}`, req.url));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
    return res;
  };

  if (!checkRateLimit(`oauth-callback:${clientKey(req)}`, 20).allowed) return fail("retry");

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail("cancelled");

  const saved = verify<OAuthState>(req.cookies.get(OAUTH_COOKIE)?.value);
  const code = params.get("code");
  const state = params.get("state");
  if (!saved || !code || !state || !sameString(state, saved.state)) return fail("expired");

  try {
    const profile = await exchangeCode(code, saved.verifier, saved.nonce);
    const user = upsertGoogleUser(profile);
    const res = NextResponse.redirect(new URL(saved.next, req.url));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
    res.cookies.set(SESSION_COOKIE, sign({ uid: user.id, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE }), {
      ...cookieBase,
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("Google sign-in failed", err);
    return fail("google");
  }
}
