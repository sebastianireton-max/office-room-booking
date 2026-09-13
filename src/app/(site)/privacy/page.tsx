import type { Metadata } from "next";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What we collect when you book, why, and what we never see.",
};

/** DRAFT — describes what the app ACTUALLY collects and does today, nothing
 * more. Updated 2026-09-13 for Google sign-in and confirmation email. If
 * analytics or marketing email are added, update this page in the same change.
 * Owner/counsel review before launch. */
export default function PrivacyPage() {
  return (
    <main className="flex-1 px-6 py-14">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-semibold text-text-primary">Privacy Policy</h1>
          <p className="rounded-token-md border border-dashed border-border-default bg-surface px-4 py-3 text-sm text-text-secondary">
            Draft: review before launch. This describes what the site actually collects today.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">What we collect</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            When you book a room we collect your name, email address, an optional phone number, and your
            booking details (room, date, time). There are no tracking pixels and no advertising analytics
            on this site.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">If you sign in with Google</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            Signing in is optional. If you choose it, Google shares your name, verified email address,
            profile picture link and an account identifier with us, so we can show your bookings in one
            place. We never receive your Google password. A single cookie keeps you signed in for up to 14
            days; signing out removes it.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">What we never see</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            Your payment card details. Payment is handled entirely by Stripe. Card information goes
            directly from your browser to Stripe and never touches our servers. Stripe&apos;s own privacy
            policy governs that data.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Why we collect it</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            To operate your booking: confirming your slot, generating your calendar invite, and reaching
            you if something changes about your reservation. We don&apos;t sell your information or use it
            for marketing. The services that process it for us are Stripe (payments), Google (sign-in, only
            if you use it) and our email provider, Resend (booking confirmations).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Questions or removal</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            To ask what we hold about you or request deletion, email{" "}
            <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-text-accent hover:underline">{SITE.contactEmail}</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
