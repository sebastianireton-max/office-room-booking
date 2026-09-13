import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you book a room.",
};

/** DRAFT — deliberately minimal and factual. The owner should review (and
 * ideally have counsel review) before launch; sections that need a business
 * decision are marked as such rather than invented. */
export default function TermsPage() {
  return (
    <main className="flex-1 px-6 py-14">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-semibold text-text-primary">Terms of Service</h1>
          <p className="rounded-token-md border border-dashed border-border-default bg-surface px-4 py-3 text-sm text-text-secondary">
            Draft: review before launch. Sections that depend on business decisions not yet made
            (cancellation terms, liability specifics) are marked below rather than filled with invented
            terms.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Bookings</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            A booking reserves the named room for the exact date and time slot shown at checkout. A
            booking is confirmed only once payment succeeds; until then, a held slot may expire and
            become available to others. Confirmed bookings appear on your confirmation page along with
            calendar links.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Payment</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            All payments are processed by Stripe at the time of booking. The total shown at checkout is
            the full price. There are no additional fees. We never store your card details on our
            servers.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Use of the rooms</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            Rooms and their listed equipment are provided ready to use. Please leave the room in the
            condition you found it, and report any equipment problems right away so we can fix them
            before the next booking.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Cancellations &amp; changes</h2>
          <p className="rounded-token-md border border-dashed border-border-default bg-surface px-4 py-3 text-sm text-text-secondary">
            Placeholder: the cancellation and rescheduling policy is being finalized. Until it&apos;s
            posted here, <Link href="/contact" className="font-medium text-text-accent hover:underline">contact us</Link> about
            any booking changes.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Contact</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            Questions about these terms: <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-text-accent hover:underline">{SITE.contactEmail}</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
