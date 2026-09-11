import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site-config";
import { BOOKING_CONFIG } from "@/types/domain";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Hours, booking holds, equipment, payment, and what happens after you book, answered.",
};

/** Every answer below is grounded in how the app actually works (operating
 * hours, hold behavior, Stripe flow, calendar links) — not aspirational
 * policy. Policy questions the owner hasn't decided yet (cancellation terms)
 * honestly say "contact us" instead of inventing terms. */
const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What are your hours?",
    a: `Rooms can be booked ${SITE.hours.open}–${SITE.hours.close}, ${SITE.hours.days}. Bookings are hourly, for 1, 2, or 3 hours at a time.`,
  },
  {
    q: "How far in advance do I need to book?",
    a: `Same-day bookings need at least ${BOOKING_CONFIG.minBookingNoticeHours} hours' notice. Beyond that, if a slot shows as available, it's yours.`,
  },
  {
    q: "Is my time slot reserved while I check out?",
    a: "Yes. The moment you enter your details, the slot is held for you while you complete payment. Nobody else can book it out from under you. If you don't finish checking out, the hold expires and the slot opens back up automatically.",
  },
  {
    q: "What equipment is included?",
    a: (
      <>
        Every room&apos;s full equipment list is on its page. What you see listed is included in the
        hourly rate, already set up when you arrive. Browse the rooms from the{" "}
        <Link href="/#rooms" className="font-medium text-text-accent hover:underline">
          homepage
        </Link>{" "}
        or check{" "}
        <Link href="/pricing" className="font-medium text-text-accent hover:underline">
          pricing
        </Link>{" "}
        for a side-by-side view.
      </>
    ),
  },
  {
    q: "How do I pay?",
    a: "By card at the time of booking, processed securely by Stripe. Your card details never touch our servers, and a booking is only confirmed once payment actually succeeds.",
  },
  {
    q: "Do I need an account?",
    a: "No. Checkout is guest-only: name, email, and an optional phone number. Your email gets the confirmation.",
  },
  {
    q: "What happens after I book?",
    a: "You'll land on a confirmation page with your booking details and add-to-calendar links for Google Calendar, Outlook, and Apple Calendar (.ics download).",
  },
  {
    q: "Can I cancel or reschedule?",
    a: (
      <>
        Need to change a booking?{" "}
        <Link href="/contact" className="font-medium text-text-accent hover:underline">
          Contact us
        </Link>{" "}
        and we&apos;ll sort it out. A formal cancellation policy is being finalized and will be posted
        here.
      </>
    ),
  },
  {
    q: "How many people can each room hold?",
    a: "It varies by room, from 2 (the compact content and podcast studios) up to 10 (The Boardroom). Each room's page and the pricing table list its capacity.",
  },
];

export default function FaqPage() {
  return (
    <main className="flex-1 px-6 py-14">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-text-accent">FAQ</p>
          <h1 className="font-display text-5xl font-medium tracking-[-0.014em] text-text-primary">
            <span className="font-normal lowercase">asked &amp;</span>{" "}
            <span className="font-extrabold uppercase">ANSWERED.</span>
          </h1>
        </div>

        <dl className="flex flex-col divide-y divide-border-subtle">
          {FAQS.map((item) => (
            <div key={item.q} className="flex flex-col gap-2 py-6 first:pt-0">
              <dt className="text-lg font-semibold text-text-primary">{item.q}</dt>
              <dd className="text-base leading-relaxed text-text-secondary">{item.a}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col items-start gap-3 rounded-token-lg bg-surface p-6 shadow-[var(--shadow-subtle)]">
          <p className="font-display text-xl lowercase text-text-primary">still wondering something?</p>
          <p className="text-sm text-text-secondary">
            We&apos;d rather answer a question than lose a booking over it.
          </p>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center rounded-token-full bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </main>
  );
}
