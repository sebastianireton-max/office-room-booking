import Link from "next/link";
import { ROOMS } from "@/lib/rooms-data";
import { MediaSlot } from "@/components/MediaSlot";
import { Button } from "@/components/Button";
import { SITE } from "@/lib/site-config";
import { BOOKING_CONFIG, ROOM_TYPE_LABELS } from "@/types/domain";
import type { Room, RoomType } from "@/types/domain";
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

/* The group headers used to carry a colour-coded dot per type. Both halves of
   that were wrong under the 2026-08-31 palette: design-verified 4.3 allows one
   accent for the whole page (three category hues is three accents), and 4.6
   bans decorative status dots outright. The ruled header and the type name
   already say which group this is, so the dot was deleted rather than
   recoloured. Same change in RoomTypeBadge. */

/**
 * One room in the homepage showcase.
 *
 * Local to this page on purpose: `RoomCard` still exists and is still the
 * right component for the compact 3-up cross-sell rail on room pages. These
 * two jobs are genuinely different (a showcase sells the room, a rail offers
 * an alternative), and collapsing them into one component with a `variant`
 * prop would make both worse.
 *
 * The media goes through MediaSlot, so a hero clip dropped into
 * `rooms-data.ts` replaces the illustration here with no change to this file.
 */
function ShowcaseTile({ room, wide, className = "" }: { room: Room; wide: boolean; className?: string }) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className={`group flex flex-col overflow-hidden rounded-token-lg border border-border-subtle bg-surface shadow-[var(--shadow-subtle)] transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-border-default hover:shadow-[var(--shadow-medium)] motion-reduce:hover:translate-y-0 ${className}`}
    >
      <MediaSlot
        video={room.reel}
        poster={`/rooms/art/${room.id}.webp`}
        alt={`Illustration of ${room.name}: ${room.description}`}
        sizes={wide ? "(max-width: 1024px) 100vw, 640px" : "(max-width: 1024px) 100vw, 420px"}
        /* Both tiles keep 16:9. The first version gave the narrow tile a 4:5
           portrait crop for variety, and it was wrong twice: all six
           illustrations are wide landscape scenes, so portrait cropped the
           subject out, and the mismatched heights left a dead gap in the wide
           tile where flex stretched it to match. The column split and the
           alternating side already carry the asymmetry; the media does not
           need to fight the artwork to prove it. */
        className="aspect-[16/9] w-full"
        imageClassName="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
      />

      <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
        <h4
          className={`font-display lowercase leading-[1.05] text-text-primary ${
            wide ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {room.name}
        </h4>
        {/* The room's own tagline. Real copy, grounded in its equipment list,
            already written and reviewed. This is where the personality lives:
            "Batch a month of content in one afternoon" says more about the
            room than any adjective the layout could add. */}
        <p className="max-w-[34ch] text-base leading-relaxed text-text-secondary">{room.tagline}</p>

        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-border-subtle pt-5">
          {/* Mono, but NOT uppercase and NOT wide-tracked. Six of those across
              the page would be six eyebrows against a budget of two, which the
              verifier counts and rejects (Section 2.3) whatever the component
              calls them. Learned the hard way on the room badges earlier. */}
          <span className="tabular text-xs text-text-secondary">
            {room.capacity} people · {room.sqft} sq ft
          </span>
          <span className="tabular text-lg font-semibold text-text-primary">
            {formatUsdPerHour(room.hourlyRateCents)}
          </span>
        </div>
      </div>
    </Link>
  );
}

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
      {/* Hero. The headline is the brand line itself: the name is a pun that
          needs teaching exactly once, and the weight-contrast pattern (light
          lowercase against heavy caps) does that teaching for free.
          No eyebrow here on purpose — the previous one ("On-demand rooms,
          ready when you are") only restated the headline, and dropping it
          leaves the budget for the one eyebrow that carries a real fact.

          OVERHAUL 2026-08-30: was centered. design-verified 2.5 bans centered
          heroes above DESIGN_VARIANCE 4 and this page runs at 8, so the
          composition is now left-aligned and asymmetric: the headline claims
          the left ten columns and the right stays deliberately empty. No stat
          block or trust strip is added here — 4.1 bans both in the hero, and
          the proof band below already carries those facts once. */}
      <section className="relative px-6 pt-20 pb-24 sm:pt-32 sm:pb-36">
        {/* The soft gradient wash that used to sit behind this headline is
            gone. Two reasons, and neither is taste: a large low-opacity radial
            bloom is on the banned-tells list (brandkit: no generic startup
            gradients), and it was the one element on the page a visitor could
            not name the purpose of. Paper, air and type carry the hero now.
            Scale does the work a gradient was being asked to do. */}
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display max-w-[14ch] text-[clamp(3rem,11vw,8.5rem)] leading-[0.9] text-text-primary">
            <span className="font-normal lowercase">show up. clock in.</span>{" "}
            <span className="font-extrabold uppercase text-text-accent">CREATE.</span>
          </h1>
          <p className="mt-9 max-w-md text-xl leading-relaxed text-text-secondary">{SITE.tagline}</p>
          <div className="mt-11 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button href="#rooms" variant="primary">
              Check availability
            </Button>
            <Link
              href="/pricing"
              className="inline-flex min-h-11 items-center rounded-token-full px-4 text-base font-medium text-text-primary underline underline-offset-4 transition-colors hover:text-text-accent"
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
        className="reveal border-y border-border-subtle bg-surface px-6 py-12"
      >
        <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:divide-x lg:divide-border-subtle">
          {HOOK_FACTS.map((fact, i) => (
            <div key={fact.value} className={`flex flex-col gap-1.5 ${i > 0 ? "lg:pl-10" : ""}`}>
              {/* Reserve two lines from the 2-up breakpoint onward: "Instant
                  confirmation" wraps where the others do not, and without the
                  reserve the descriptions sit on mismatched baselines. */}
              <dt className="font-display text-2xl font-semibold text-text-primary sm:min-h-[3.6rem]">
                {fact.value}
              </dt>
              <dd className="text-sm leading-relaxed text-text-secondary">{fact.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Room showcase, grouped by type.
          Was six structurally identical cards in a 2-up grid. Six identical
          anythings is the template tell: it says "these were generated from a
          list", which is exactly the read the owner asked to lose. Each group
          is now an asymmetric pair on a 5-column grid, and the wide side
          alternates down the page, so the eye never lands twice in the same
          place. The two tiles carry different aspect ratios (16:9 against 4:5)
          for the same reason.

          Each tile also earns its size: it leads with the room's own tagline,
          which is real copy grounded in that room's equipment list, and closes
          on a mono spec rail. That is what turns a card into a room. */}
      <section id="rooms" className="px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="reveal mb-14 font-display text-[clamp(2rem,5.5vw,4rem)] leading-[1.02] text-text-primary sm:mb-20">
            <span className="font-normal lowercase">six rooms,</span>{" "}
            <span className="font-extrabold uppercase">THREE WAYS TO WORK.</span>
          </h2>

          <div className="flex flex-col gap-20 sm:gap-28">
            {TYPE_ORDER.map((type, groupIndex) => {
              const rooms = activeRooms.filter((r) => r.type === type);
              if (rooms.length === 0) return null;
              /* Alternate which side of the pair is wide. With three groups
                 this gives wide-left, wide-right, wide-left. */
              const wideFirst = groupIndex % 2 === 0;
              return (
                <div key={type} className="reveal">
                  <div className="mb-8 flex flex-col gap-1 border-t border-border-default pt-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                    <h3 className="font-display text-2xl font-semibold lowercase text-text-primary">
                      {ROOM_TYPE_LABELS[type]}
                    </h3>
                    <p className="max-w-md text-sm text-text-secondary sm:text-right">{TYPE_BLURB[type]}</p>
                  </div>
                  {/* items-start, so each tile is its own natural height
                      instead of both stretching to the taller one. The stagger
                      that produces is the point: two tiles of different widths
                      and different heights read as a composition, two tiles
                      forced to the same baseline read as a grid. */}
                  <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-5 lg:gap-8">
                    {rooms.map((room, i) => {
                      const isWide = wideFirst ? i === 0 : i === rooms.length - 1;
                      return (
                        <ShowcaseTile
                          key={room.id}
                          room={room}
                          wide={isWide}
                          className={isWide ? "lg:col-span-3" : "lg:col-span-2"}
                        />
                      );
                    })}
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
      <section className="reveal border-t border-border-subtle bg-surface px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
          <h2 className="font-display text-4xl text-text-primary sm:text-5xl">
            <span className="font-normal lowercase">three steps,</span>{" "}
            <span className="font-extrabold uppercase">THEN YOU&apos;RE IN.</span>
          </h2>
          <ol className="flex flex-col">
            {HOW_IT_WORKS.map((item) => (
              <li
                key={item.step}
                className="flex flex-col gap-2 border-t border-border-subtle py-6 first:border-t-0 first:pt-0 sm:flex-row sm:gap-8"
              >
                <span
                  className="tabular text-3xl font-medium leading-none text-text-accent sm:w-16 sm:shrink-0"
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
      <section className="reveal border-t border-border-subtle px-6 py-20 sm:py-28">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <h2 className="font-display text-4xl text-text-primary sm:text-5xl">
            <span className="font-normal lowercase">the room is ready</span>{" "}
            <span className="font-extrabold uppercase">WHEN YOU ARE.</span>
          </h2>
          <p className="max-w-xl text-base text-text-secondary">
            Book by the hour, {SITE.hours.open}–{SITE.hours.close}, {SITE.hours.days}. No memberships, no
            minimums.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/#rooms"
              className="inline-flex min-h-11 items-center rounded-token-full bg-accent px-8 text-base font-semibold text-on-accent shadow-[var(--shadow-accent)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-accent-hover active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0"
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
