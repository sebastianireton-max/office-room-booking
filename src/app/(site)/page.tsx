import type { Metadata } from "next";
import Link from "next/link";
import { ROOMS } from "@/lib/rooms-data";
import { SITE } from "@/lib/site-config";
import { FAQS } from "@/lib/faq";
import { RoomBoard } from "@/components/RoomBoard";
import { Button } from "@/components/Button";
import { BOOKING_CONFIG } from "@/types/domain";

export const metadata: Metadata = {
  description: `${SITE.tagline} Pick an exact date and start time, pay securely, and get a calendar invite.`,
  alternates: { canonical: "/" },
};

const STEPS = [
  ["Pick a time", "Choose a day, a length and an open start time on any room."],
  ["Pay to lock it in", `Your slot is held for ${BOOKING_CONFIG.holdDurationMinutes} minutes while you pay by card through Stripe.`],
  ["Walk in and work", "The confirmation email carries a calendar invite. Everything on the room’s list is included."],
];

// The three questions people most often need answered before paying.
const TOP_QUESTIONS = [FAQS[2], FAQS[4], FAQS[7]];

export default function HomePage() {
  const rooms = ROOMS.filter((r) => r.active);

  return (
    <main className="flex flex-1 flex-col">
      <section className="px-6 pb-20 pt-14">
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
              Six rooms for filming, recording and meeting, gear included. Book them by the hour.
            </p>
            {/* At md and up the board is already in view, so the jump link would be noise. */}
            <Button href="#rooms" size="lg" className="w-fit md:hidden">
              See open times
            </Button>
          </div>
        </div>
      </section>

      <section id="rooms" aria-labelledby="rooms-heading" className="scroll-mt-24 px-6 pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 id="rooms-heading" className="sr-only">
            Rooms and open times
          </h2>
          <RoomBoard rooms={rooms} timeZone={SITE.timeZone} />
          <p className="mt-5 text-sm text-text-secondary">
            Room pictures are illustrations drawn from each room’s gear list. Prices are the full price: no fees, no
            memberships.
          </p>
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-16 border-t border-border-subtle py-16 sm:gap-24 sm:py-24">
          <div>
            <h2 id="steps-heading" className="type-section mb-10 text-text-primary">
              How booking works
            </h2>
            <ol className="grid gap-10 md:grid-cols-3 md:gap-12">
              {STEPS.map(([title, body], i) => (
                <li key={title} className="flex flex-col gap-2">
                  <span className="font-display text-4xl font-semibold leading-none text-text-accent" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="type-subhead mt-2 text-text-primary">{title}</h3>
                  <p className="max-w-[40ch] leading-relaxed text-text-secondary">{body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="type-section text-text-primary">Before you pay</h2>
            <div className="flex max-w-[65ch] flex-col divide-y divide-border-subtle border-y border-border-subtle">
              {TOP_QUESTIONS.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="text-xl text-text-accent transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 leading-relaxed text-text-secondary">{f.a}</p>
                </details>
              ))}
            </div>
            <Link href="/faq" className="inline-flex min-h-11 w-fit items-center font-medium text-text-accent underline underline-offset-4">
              All questions
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
