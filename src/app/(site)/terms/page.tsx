import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The draft terms for booking a room at ${SITE.name}: how bookings and holds work, payment through Stripe with no added fees, using the rooms, and who to contact about changes.`,
  alternates: { canonical: "/terms" },
};

const h2 = "type-subhead text-text-primary";
const body = "text-base leading-relaxed text-text-secondary";
const notice = "rounded-token-sm border border-dashed border-border-default bg-surface px-4 py-3 text-sm text-text-secondary";

/** DRAFT: deliberately minimal and factual. The owner should review (and
 * ideally have counsel review) before launch; sections that need a business
 * decision are marked as such rather than invented. */
export default function TermsPage() {
  return (
    <main className="flex-1 px-6 pb-20 pt-12 sm:pb-24 sm:pt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex max-w-[65ch] flex-col gap-4">
          <h1 className="type-page text-text-primary">Terms of Service</h1>
          <p className={notice}>
            Draft: review before launch. Sections that depend on business decisions not yet made
            (cancellation terms, liability specifics) are marked below rather than filled with invented
            terms.
          </p>
        </div>

        <section className="flex max-w-[65ch] flex-col gap-2">
          <h2 className={h2}>Bookings</h2>
          <p className={body}>
            A booking reserves the named room for the exact date and time slot shown at checkout. A
            booking is confirmed only once payment succeeds; until then, a held slot may expire and
            become available to others. Confirmed bookings appear on your confirmation page along with
            calendar links.
          </p>
        </section>

        <section className="flex max-w-[65ch] flex-col gap-2">
          <h2 className={h2}>Payment</h2>
          <p className={body}>
            All payments are processed by Stripe at the time of booking. The total shown at checkout is
            the full price. There are no additional fees. We never store your card details on our
            servers.
          </p>
        </section>

        <section className="flex max-w-[65ch] flex-col gap-2">
          <h2 className={h2}>Use of the rooms</h2>
          <p className={body}>
            Rooms and their listed equipment are provided ready to use. Please leave the room in the
            condition you found it, and report any equipment problems to us right away.
          </p>
        </section>

        <section className="flex max-w-[65ch] flex-col gap-2">
          <h2 className={h2}>Cancellations &amp; changes</h2>
          <p className={notice}>
            Placeholder: the cancellation and rescheduling policy is being finalized. Until it&rsquo;s
            posted here,{" "}
            <Link href="/contact" className="font-medium text-text-accent underline underline-offset-4">
              contact us
            </Link>{" "}
            about any booking changes.
          </p>
        </section>

        <section className="flex max-w-[65ch] flex-col gap-2">
          <h2 className={h2}>Contact</h2>
          <p className={body}>
            Questions about these terms:{" "}
            <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-text-accent underline underline-offset-4">
              {SITE.contactEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
