import Link from "next/link";
import { ROOMS } from "@/lib/rooms-data";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/Button";
import { SITE } from "@/lib/site-config";
import { BOOKING_CONFIG, ROOM_TYPE_LABELS } from "@/types/domain";
import type { RoomType } from "@/types/domain";
import { formatUsdPerHour } from "@/lib/format";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick your room",
    body: "Every room lists exactly what's included before you commit. No surprises when you walk in.",
  },
  {
    step: "02",
    title: "Book your slot",
    body: `Choose an exact date and time, ${SITE.hours.open} to ${SITE.hours.close}. Your slot is held while you check out, and payment is handled securely by Stripe.`,
  },
  {
    step: "03",
    title: "Show up and create",
    body: "You'll get a confirmation with add-to-calendar links for Google, Outlook, or Apple. The room and its gear are ready when you are.",
  },
];

/* The room grid used to be six structurally identical cards in one 3x2 block,
   which read as "six interchangeable boxes" and made someone hunting for a
   podcast room parse all six. Grouping by type keeps every room a peer (no
   invented "featured" hierarchy) while giving the scroll a rhythm and letting
   a visitor skip straight to the type they came for. */
const TYPE_ORDER: RoomType[] = ["content", "podcast", "conference"];

const TYPE_BLURB: Record<RoomType, string> = {
  content: "Backdrops, lighting, and mics already standing. Walk in and shoot.",
  podcast: "Broadcast mics, multi-cam, and acoustic treatment on the walls.",
  conference: "A screen, a tracking camera, and a network that holds up on a call.",
};

const TYPE_DOT: Record<RoomType, string> = {
  content: "bg-accent",
  podcast: "bg-info",
  conference: "bg-warning",
};

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
      {/* Hero — design package Section 6.1. The headline is now the brand line
          itself: the name is a pun that needs teaching exactly once, and the
          existing lowercase-italic + CAPS pattern does that teaching for free.
          No eyebrow here on purpose — the previous one ("On-demand rooms,
          ready when you are") only restated the headline, and dropping it
          leaves the budget for the one eyebrow that carries a real fact. */}
      <section className="px-6 pt-16 pb-16 sm:pt-24 sm:pb-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <h1 className="font-display text-5xl font-medium tracking-[-0.02em] text-text-primary sm:text-7xl">
            <span className="lowercase italic">show up.</span>{" "}
            <span className="lowercase italic">clock in.</span>{" "}
            <span className="uppercase">CREATE.</span>
          </h1>
          <p className="max-w-2xl text-lg text-text-secondary">{SITE.tagline}</p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button href="#rooms" variant="primary">
              Check availability
            </Button>
            <Link
              href="/pricing"
              className="inline-flex min-h-11 items-center rounded-token-full px-6 text-base font-medium text-text-primary underline underline-offset-4 transition-colors hover:text-text-accent"
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
              <dt className="font-display text-2xl font-medium tracking-[-0.01em] text-text-primary sm:min-h-[3.6rem]">
                {fact.value}
              </dt>
              <dd className="text-sm leading-relaxed text-text-secondary">{fact.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Room grid, grouped by type — design package Section 6.1 */}
      <section id="rooms" className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 font-display text-4xl font-medium tracking-[-0.014em] text-text-primary">
            <span className="lowercase italic">six rooms,</span>{" "}
            <span className="uppercase">THREE WAYS TO WORK.</span>
          </h2>

          <div className="flex flex-col gap-14">
            {TYPE_ORDER.map((type) => {
              const rooms = activeRooms.filter((r) => r.type === type);
              if (rooms.length === 0) return null;
              return (
                <div key={type}>
                  <div className="mb-6 flex flex-col gap-1 border-t border-border-default pt-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                    <h3 className="flex items-center gap-2.5 font-display text-2xl font-medium lowercase italic text-text-primary">
                      <span className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT[type]}`} aria-hidden="true" />
                      {ROOM_TYPE_LABELS[type]}
                    </h3>
                    <p className="max-w-md text-sm text-text-secondary sm:text-right">{TYPE_BLURB[type]}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    {rooms.map((room) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works. Deliberately NOT the three-equal-column feature row it
          used to be: heading left, steps as a hairline-divided list right. Same
          content, but the page stops repeating the proof band's rhythm. */}
      <section className="border-t border-border-subtle bg-surface px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
          <h2 className="font-display text-4xl font-medium tracking-[-0.014em] text-text-primary">
            <span className="lowercase italic">three steps,</span>{" "}
            <span className="uppercase">THEN YOU&apos;RE IN.</span>
          </h2>
          <ol className="flex flex-col">
            {HOW_IT_WORKS.map((item) => (
              <li
                key={item.step}
                className="flex flex-col gap-2 border-t border-border-subtle py-6 first:border-t-0 first:pt-0 sm:flex-row sm:gap-8"
              >
                <span
                  className="font-display text-3xl italic leading-none text-text-accent sm:w-16 sm:shrink-0"
                  aria-hidden="true"
                >
                  {item.step}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing band. This was two stacked full-bleed bands (an FAQ teaser and
          a CTA) doing near-identical jobs back to back, splitting attention at
          the exact moment the page should end on one instruction. Merged: one
          primary action, with the FAQ demoted to the secondary link it always
          was. */}
      <section className="border-t border-border-subtle px-6 py-16 sm:py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <h2 className="font-display text-4xl font-medium tracking-[-0.014em] text-text-primary sm:text-5xl">
            <span className="lowercase italic">the room is ready</span>{" "}
            <span className="uppercase">WHEN YOU ARE.</span>
          </h2>
          <p className="max-w-xl text-base text-text-secondary">
            Book by the hour, {SITE.hours.open}–{SITE.hours.close}, {SITE.hours.days}. No memberships, no
            minimums.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/#rooms"
              className="inline-flex min-h-11 items-center rounded-token-full bg-accent px-8 text-base font-semibold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.98] motion-reduce:active:scale-100"
            >
              Browse the rooms
            </Link>
            <Link
              href="/faq"
              className="inline-flex min-h-11 items-center rounded-token-full px-6 text-base font-medium text-text-primary underline underline-offset-4 transition-colors hover:text-text-accent"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
