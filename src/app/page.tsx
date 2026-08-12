import Link from "next/link";
import { ROOMS } from "@/lib/rooms-data";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/Button";
import { SITE } from "@/lib/site-config";
import { BOOKING_CONFIG } from "@/types/domain";
import { formatUsdPerHour } from "@/lib/format";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick your room",
    body: "Six rooms, three ways to work: content, podcast, or conference. Every room lists exactly what's included before you commit.",
  },
  {
    step: "02",
    title: "Book your slot",
    body: `Choose an exact date and time, ${SITE.hours.open}–${SITE.hours.close}. Your slot is held while you check out, and payment is handled securely by Stripe.`,
  },
  {
    step: "03",
    title: "Show up & create",
    body: "You'll get a confirmation with add-to-calendar links for Google, Outlook, or Apple. The room and its gear are ready when you are.",
  },
];

export default function HomePage() {
  const activeRooms = ROOMS.filter((r) => r.active);

  /* Every figure in the hook band is derived, never typed in, so marketing copy
     cannot drift from what the booking engine actually charges and enforces.
     Competitor research (studio rental sites, Aug 2026) showed the strongest
     single lever above the fold is concrete specifics: a real price anchor,
     real hours, and a plain statement of what happens after you pay. The ones
     we deliberately do NOT copy are the fabricated-trust patterns: invented
     testimonials, "trusted by" logo walls, and urgency counters. */
  const lowestRateCents = Math.min(...activeRooms.map((r) => r.hourlyRateCents));

  const HOOK_FACTS = [
    {
      value: `${activeRooms.length} rooms`,
      body: "Content, podcast, and conference. Every room lists its exact gear before you book.",
    },
    {
      value: `From ${formatUsdPerHour(lowestRateCents)}`,
      body: "Booked by the hour. No memberships, no minimums, no cleaning fees.",
    },
    {
      value: `${SITE.hours.open}–${SITE.hours.close}`,
      body: `Open ${SITE.hours.days}. Pick an exact date and an exact start time.`,
    },
    {
      value: "Instant confirmation",
      body: `Your slot is held for ${BOOKING_CONFIG.holdDurationMinutes} minutes while you check out, then a calendar invite lands in your inbox.`,
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero — design package Section 6.1. Held to the four text elements the
          design-verified skill allows (eyebrow, headline, subtext, CTAs); the
          supporting proof lives in its own band directly below, not in here. */}
      <section className="px-6 pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <p className="text-sm font-medium uppercase tracking-[2px] text-text-accent">
            On-demand rooms, ready when you are
          </p>
          <h1 className="font-display text-5xl font-medium tracking-[-0.5px] text-text-primary sm:text-7xl">
            <span className="lowercase italic">your room is</span>{" "}
            <span className="uppercase">READY.</span>
            <br />
            <span className="lowercase italic">show up &amp;</span>{" "}
            <span className="uppercase">CREATE.</span>
          </h1>
          <p className="max-w-2xl text-lg text-text-secondary">
            Content rooms, podcast suites, and conference rooms, available by the hour.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button href="#rooms" variant="primary">
              Check availability
            </Button>
            <Link
              href="/pricing"
              className="rounded-token-full px-6 py-3 text-base font-medium text-text-primary underline underline-offset-4 transition-colors hover:text-text-accent"
            >
              See all rates
            </Link>
          </div>
        </div>
      </section>

      {/* Hook proof band. Hairline-divided facts rather than cards: the skill
          bans card containers where spacing and rules do the same job, and bans
          the three-equal-card row outright. */}
      <section
        aria-label="What booking here involves"
        className="border-y border-border-subtle bg-surface px-6 py-10"
      >
        <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:divide-x lg:divide-border-subtle">
          {HOOK_FACTS.map((fact, i) => (
            <div key={fact.value} className={`flex flex-col gap-1.5 ${i > 0 ? "lg:pl-10" : ""}`}>
              {/* Reserve two lines from the 2-up breakpoint onward: "Instant
                  confirmation" wraps where the others do not, and without the
                  reserve the descriptions sit on mismatched baselines. */}
              <dt className="font-display text-2xl font-medium tracking-[-0.3px] text-text-primary sm:min-h-[3.6rem]">
                {fact.value}
              </dt>
              <dd className="text-sm leading-relaxed text-text-secondary">{fact.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Room grid — design package Section 6.1 */}
      <section id="rooms" className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[2px] text-text-accent">Our Rooms</p>
            <h2 className="font-display text-4xl font-medium tracking-[-0.5px] text-text-primary">
              <span className="lowercase italic">six rooms,</span>{" "}
              <span className="uppercase">THREE WAYS TO WORK.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 place-items-center gap-8 sm:grid-cols-2 sm:place-items-stretch lg:grid-cols-3">
            {activeRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border-subtle bg-surface px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          {/* No eyebrow here on purpose: with six sections the skill allows two
              eyebrows, and the headline already names the section. */}
          <div className="mb-10 flex flex-col gap-2">
            <h2 className="font-display text-4xl font-medium tracking-[-0.5px] text-text-primary">
              <span className="lowercase italic">three steps,</span>{" "}
              <span className="uppercase">THEN YOU&apos;RE IN.</span>
            </h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex flex-col gap-3">
                <span className="font-display text-5xl italic text-text-accent" aria-hidden="true">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="border-t border-border-subtle px-6 py-16 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl font-medium text-text-primary">
              <span className="lowercase italic">questions?</span>{" "}
              <span className="uppercase">WE WROTE THEM DOWN.</span>
            </h2>
            <p className="text-base text-text-secondary">
              Hours, holds, gear, what happens after you pay: the short version of everything.
            </p>
          </div>
          <Button href="/faq" variant="primary">
            Read the FAQ
          </Button>
        </div>
      </section>

      {/* Closing CTA band */}
      <section className="border-t border-border-subtle bg-surface px-6 py-20 sm:py-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <h2 className="font-display text-4xl font-medium tracking-[-0.5px] text-text-primary sm:text-5xl">
            <span className="lowercase italic">the room is ready</span>{" "}
            <span className="uppercase">WHEN YOU ARE.</span>
          </h2>
          <p className="max-w-xl text-base text-text-secondary">
            Book by the hour, {SITE.hours.open}–{SITE.hours.close}, {SITE.hours.days}. No memberships, no
            minimums.
          </p>
          <Link
            href="/#rooms"
            className="rounded-token-full bg-accent px-8 py-3.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.98] motion-reduce:active:scale-100"
          >
            Browse the rooms
          </Link>
        </div>
      </section>
    </main>
  );
}
