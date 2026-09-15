import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { getCurrentUser, isAuthConfigured, safeNext } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

const UNAVAILABLE = "Signing in isn’t available yet. You can still book without an account.";

const ERRORS: Record<string, string> = {
  unavailable: UNAVAILABLE,
  cancelled: "Sign-in was cancelled.",
  expired: "That sign-in link expired. Try again.",
  google: "Google couldn’t confirm your account. Try again, or book without signing in.",
  retry: "Too many attempts. Wait a minute and try again.",
};

export default async function SignInPage(props: PageProps<"/signin">) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  if (await getCurrentUser()) redirect(next);
  const configured = isAuthConfigured();
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  return (
    <main className="flex-1 px-6 pb-20 pt-12 sm:pb-24 sm:pt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="type-page text-text-primary">Sign in</h1>
          <p className="text-text-secondary">See and manage your bookings in one place. Booking itself never needs an account.</p>
        </div>

        {/* Unconfigured already says the same thing below; don't repeat it as an error. */}
        {error && !(error === UNAVAILABLE && !configured) && (
          <p role="alert" className="rounded-token-sm border border-error px-4 py-3 text-sm text-error">
            {error}
          </p>
        )}

        {configured ? (
          <>
            <Button href={`/api/auth/google?next=${encodeURIComponent(next)}`} external variant="secondary" size="lg" className="gap-3">
              {/* Google's own mark, required by its sign-in branding rules. */}
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z" />
                <path fill="#FBBC05" d="M10.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.2C1 16.5 0 20.1 0 24s1 7.5 2.6 10.7l7.9-6.2z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.6 42.6 14.6 48 24 48z" />
              </svg>
              Continue with Google
            </Button>
            <p className="text-sm text-text-secondary">
              By continuing you agree to the{" "}
              <Link href="/terms" className="text-text-accent underline underline-offset-4">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-text-accent underline underline-offset-4">
                privacy policy
              </Link>
              .
            </p>
          </>
        ) : (
          <p className="rounded-token-sm bg-surface px-4 py-3 text-sm text-text-secondary">{UNAVAILABLE}</p>
        )}
        </div>
      </div>
    </main>
  );
}
