import { NextRequest, NextResponse } from "next/server";
import { buildAuthRequest } from "@/lib/auth/google";
import { cookieBase, isAuthConfigured, OAUTH_COOKIE, safeNext, sign } from "@/lib/auth/session";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

/** Starts "Continue with Google". SECURITY-RELEVANT. */
export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  if (!isAuthConfigured()) {
    return NextResponse.redirect(new URL(`/signin?error=unavailable&next=${encodeURIComponent(next)}`, req.url));
  }
  if (!checkRateLimit(`oauth-start:${clientKey(req)}`, 20).allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const { url, state, nonce, verifier } = buildAuthRequest();
  const res = NextResponse.redirect(url);
  // state, nonce and PKCE verifier ride in a signed, httpOnly, 10-minute cookie.
  res.cookies.set(OAUTH_COOKIE, sign({ state, nonce, verifier, next, exp: Math.floor(Date.now() / 1000) + 600 }), {
    ...cookieBase,
    path: "/api/auth",
    maxAge: 600,
  });
  return res;
}
