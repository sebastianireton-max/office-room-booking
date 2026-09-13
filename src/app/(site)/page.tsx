import type { Metadata } from "next";
import Link from "next/link";
import { ROOMS } from "@/lib/rooms-data";
import { SITE } from "@/lib/site-config";
import { FAQS } from "@/lib/faq";
import { RoomBoard } from "@/components/RoomBoard";
import { BOOKING_CONFIG } from "@/types/domain";

export const metadata: Metadata = {
  description: `${SITE.tagline} Pick an exact date and start time, pay securely, and get a calendar invite.`,
  alternates: { canonical: "/" },
};

const STEPS = [
  ["Pick a time", "Choose a day, a length and an open start time on any room."],
  ["Pay to lock it in", `Your slot is held for ${BOOKING_CONFIG.holdDurationMinutes} minutes while you pay by card through Stripe.`],
  ["Walk in and work", "The confirmation email carries a calendar invite. The gear is set up before you arrive."],
];

// The three questions people most often need answered before paying.
const TOP_QUESTIONS = [FAQS[2], FAQS[4], FAQS[7]];

export default function HomePage() {
  const rooms = ROOMS.filter((r) => r.active);

  return (
    <main className="flex flex-1 flex-col">
      <section className="px-6 pb-10 pt-14 sm:pb-14 sm:pt-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <h1 className="font-display text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.9] text-text-primary">
            <span className="block font-normal lowercase">
              show up. <br className="sm:hidden" />
              clock in.
            </span>
            <span className="block font-extrabold uppercase text-text-accent">CREATE.</span>
          </h1>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
            <p className="max-w-[31rem] text-lg leading-relaxed text-text-secondary sm:text-xl">
              Six rooms for filming, recording and meeting, with the gear already set up. Book them by the hour.
            </p>
            <Link
              href="#rooms"
              className="inline-flex min-h-12 w-fit items-center whitespace-nowrap rounded-token-full bg-accent px-7 font-semibold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.98] motion-reduce:active:scale-100"
            >
              See open times
            </Link>
          </div>
        </div>
      </section>

      <section id="rooms" aria-labelledby="rooms-heading" className="scroll-mt-24 px-6 pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <h2 id="rooms-heading" className="sr-only">
            Rooms and open times
          </h2>
          <RoomBoard rooms={rooms} timeZone={SITE.timeZone} />
          <p className="mt-5 text-sm text-text-secondary">
            Room pictures are illustrations drawn from each room&apos;s gear list. Prices are the full price: no fees, no
            memberships.
          </p>
        </div>
      </section>

      <section className="bg-surface px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 font-display text-4xl font-semibold text-text-primary sm:text-5xl">How booking works</h2>
          <ol className="grid gap-px overflow-hidden rounded-token-md border border-border-subtle bg-border-subtle md:grid-cols-[1.2fr_1fr_1fr]">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="flex flex-col gap-3 bg-surface p-6 sm:p-8">
                <span className="tabular text-sm text-text-accent" aria-hidden="true">
                  Step {i + 1}
                </span>
                <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
                <p className="leading-relaxed text-text-secondary">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-4xl font-semibold text-text-primary">Before you pay</h2>
            <Link href="/faq" className="w-fit font-medium text-text-accent underline underline-offset-4">
              All questions
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
            {TOP_QUESTIONS.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="tabular text-xl text-text-accent transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-5 leading-relaxed text-text-secondary">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
