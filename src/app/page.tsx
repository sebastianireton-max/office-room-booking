import Link from "next/link";
import { ROOMS } from "@/lib/rooms-data";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/Button";
import { SITE } from "@/lib/site-config";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick your room",
    body: "Six rooms, three ways to work — content, podcast, or conference. Every room lists exactly what's included before you commit.",
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

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero — design package Section 6.1 */}
      <section className="border-b border-border-subtle px-6 py-24 sm:py-32">
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
            Content rooms, podcast suites, and a conference room — available by the hour.
          </p>
          <Button href="#rooms" variant="primary" className="mt-2">
            Check availability
          </Button>
        </div>
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
          <div className="mb-10 flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[2px] text-text-accent">How it works</p>
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
              Hours, holds, gear, what happens after you pay — the short version of everything.
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
