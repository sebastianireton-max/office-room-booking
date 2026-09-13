import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ROOMS } from "@/lib/rooms-data";
import { SITE } from "@/lib/site-config";
import { AvailabilityFinder } from "@/components/AvailabilityFinder";
import { BOOKING_CONFIG, ROOM_TYPE_LABELS } from "@/types/domain";
import { formatUsdPerHour } from "@/lib/format";

export const metadata: Metadata = {
  description: `${SITE.tagline} Pick an exact date and start time, pay securely, and get a calendar invite.`,
  alternates: { canonical: "/" },
};

const STEPS = [
  ["Pick a room and a time", "Every room lists its gear and size. Times are exact: start on the hour, book 1 to 3 hours."],
  ["Pay to lock it in", `The slot is held for ${BOOKING_CONFIG.holdDurationMinutes} minutes while you check out. Card payment runs through Stripe.`],
  ["Show up and work", "Confirmation and a calendar invite land in your inbox. The gear is set up before you arrive."],
];

export default function HomePage() {
  const rooms = ROOMS.filter((r) => r.active);
  const lowest = Math.min(...rooms.map((r) => r.hourlyRateCents));

  return (
    <main className="flex flex-1 flex-col">
      <section id="find" className="scroll-mt-20 px-6 pb-16 pt-12 sm:pt-20 lg:pb-24">
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-16">
          <div className="flex flex-col gap-8 lg:pt-6">
            <h1 className="font-display text-[clamp(3rem,8.5vw,6.25rem)] leading-[0.92] text-text-primary">
              <span className="block font-normal lowercase">show up.</span>
              <span className="block font-normal lowercase">clock in.</span>
              <span className="block font-extrabold uppercase text-text-accent">CREATE.</span>
            </h1>
            <p className="max-w-[34rem] text-lg leading-relaxed text-text-secondary sm:text-xl">
              Six rooms for filming, recording and meeting, rented by the hour. The lights, mics and screens are
              already set up, so the hour you pay for is spent working.
            </p>
            <dl className="grid max-w-[34rem] grid-cols-3 gap-4 border-t border-border-subtle pt-6">
              {[
                ["From", formatUsdPerHour(lowest)],
                ["Open", `${SITE.hours.open.replace(":00", "")}–${SITE.hours.close.replace(":00", "")}`],
                ["Days", "Every day"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="text-sm text-text-secondary">{k}</dt>
                  <dd className="tabular text-base font-semibold text-text-primary sm:text-lg">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <AvailabilityFinder rooms={rooms} timeZone={SITE.timeZone} />
        </div>
      </section>

      <section id="rooms" className="scroll-mt-20 border-t border-border-subtle bg-surface px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-3 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-4xl font-semibold text-text-primary sm:text-5xl">The rooms</h2>
            <p className="max-w-md text-text-secondary">
              Compare them side by side. The pictures are illustrations of each setup, drawn from its gear list.
            </p>
          </div>

          <ul className="flex flex-col">
            {rooms.map((room) => (
              <li key={room.id} className="border-t border-border-subtle last:border-b">
                <Link
                  href={`/rooms/${room.id}`}
                  className="group grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-5 gap-y-3 py-6 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:gap-x-8"
                >
                  <div className="relative row-span-2 aspect-[4/3] overflow-hidden rounded-token-sm bg-canvas sm:row-span-1">
                    <Image
                      src={`/rooms/art/${room.id}.webp`}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 112px, 192px"
                      className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="text-sm text-text-secondary">
                      {ROOM_TYPE_LABELS[room.type]} · {room.capacity} people · {room.sqft} sq ft
                    </p>
                    <h3 className="font-display text-2xl font-semibold text-text-primary group-hover:text-text-accent sm:text-3xl">
                      {room.name}
                    </h3>
                    <p className="hidden text-text-secondary sm:block">{room.tagline}</p>
                    <p className="hidden truncate text-sm text-text-secondary md:block">{room.equipment.join(" · ")}</p>
                  </div>
                  <div className="col-start-2 flex items-center gap-4 sm:col-start-auto sm:flex-col sm:items-end">
                    <span className="tabular text-lg font-semibold text-text-primary">{formatUsdPerHour(room.hourlyRateCents)}</span>
                    <span className="text-sm font-medium text-text-accent underline-offset-4 group-hover:underline">
                      See room and book
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-4xl font-semibold text-text-primary">How booking works</h2>
            <p className="text-text-secondary">
              No account needed. Sign in with Google if you want your bookings in one place.
            </p>
          </div>
          <ol className="flex flex-col">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="flex gap-6 border-t border-border-subtle py-6 first:border-t-0 first:pt-0">
                <span className="tabular w-8 shrink-0 text-2xl text-text-accent" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                  <p className="leading-relaxed text-text-secondary">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border-subtle bg-surface px-6 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl font-semibold text-text-primary">Questions before you book?</h2>
            <p className="text-text-secondary">Hours, holds, payment and what&apos;s included, answered.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/faq" className="inline-flex min-h-11 items-center rounded-token-full border border-border-default px-6 font-medium text-text-primary hover:border-border-accent hover:text-text-accent">
              Read the FAQ
            </Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center rounded-token-full px-4 font-medium text-text-primary underline underline-offset-4 hover:text-text-accent">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
