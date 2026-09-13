import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site-config";
import { BOOKING_CONFIG } from "@/types/domain";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Hours, booking holds, equipment, payment, accounts and what happens after you book, answered.",
  alternates: { canonical: "/faq" },
};

/** Answers describe how the site actually works. Undecided policy (cancellation)
 * says so instead of inventing terms. Plain strings, so the same text feeds the
 * FAQPage structured data. */
const FAQS: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: "What are your hours?",
    a: `Rooms can be booked ${SITE.hours.open} to ${SITE.hours.close}, ${SITE.hours.days}. Bookings start on the hour and last 1, 2 or 3 hours.`,
  },
  {
    q: "How far in advance do I need to book?",
    a: `Same-day bookings need at least ${BOOKING_CONFIG.minBookingNoticeHours} hours' notice. You can book up to ${BOOKING_CONFIG.maxAdvanceDays} days ahead. If a time shows as open, it's bookable.`,
  },
  {
    q: "Is my time slot reserved while I check out?",
    a: `Yes. Once you enter your details the slot is held for ${BOOKING_CONFIG.holdDurationMinutes} minutes, and nobody else can book it. If you don't finish, the hold ends and the slot reopens automatically.`,
  },
  {
    q: "What equipment is included?",
    a: "Everything on a room's equipment list is included in the hourly rate and set up before you arrive. Each room's page lists it.",
    link: { href: "/pricing", label: "Compare rooms and rates" },
  },
  {
    q: "How do I pay?",
    a: "By card when you book, through Stripe. Your card details never reach our servers, and a booking is only confirmed once the payment actually succeeds.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can book with just a name and email. If you'd like your bookings in one place, sign in with Google; bookings made with the same email appear there too.",
    link: { href: "/account", label: "Your bookings" },
  },
  {
    q: "What happens after I book?",
    a: "You land on a confirmation page with add-to-calendar links for Google Calendar, Outlook and Apple Calendar, and the confirmation email carries the calendar invite.",
  },
  {
    q: "Can I cancel or reschedule?",
    a: "Contact us and we'll sort it out. A formal cancellation policy is being finalized and will be posted here.",
    link: { href: "/contact", label: "Contact us" },
  },
  {
    q: "How many people fit in each room?",
    a: "From 2 in the compact content and podcast studios up to 10 in The Boardroom. Each room's page and the pricing table list capacity.",
  },
];

export default function FaqPage() {
  return (
    <main className="flex-1 px-6 py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <h1 className="font-display text-5xl font-semibold text-text-primary sm:text-6xl">Questions, answered</h1>

        <dl className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
          {FAQS.map((item) => (
            <div key={item.q} className="flex flex-col gap-2 py-6">
              <dt className="text-lg font-semibold text-text-primary">{item.q}</dt>
              <dd className="leading-relaxed text-text-secondary">
                {item.a}
                {item.link && (
                  <>
                    {" "}
                    <Link href={item.link.href} className="font-medium text-text-accent hover:underline">
                      {item.link.label}
                    </Link>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col items-start gap-3">
          <p className="font-display text-2xl font-semibold text-text-primary">Something else?</p>
          <Link href="/contact" className="inline-flex min-h-11 items-center rounded-token-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">
            Get in touch
          </Link>
        </div>
      </div>
    </main>
  );
}
