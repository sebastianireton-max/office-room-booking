import type { Metadata } from "next";
import Link from "next/link";
import { ROOMS } from "@/lib/rooms-data";
import { ROOM_TYPE_LABELS } from "@/types/domain";
import { formatUsd, formatUsdPerHour } from "@/lib/format";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Straightforward hourly rates for every room. The price you see is the price you pay. No fees, no memberships, no minimums.",
};

/** Rates are read straight from the room catalog — the same data the booking
 * engine charges from, so this page can never drift from what Stripe bills. */
export default function PricingPage() {
  const rooms = ROOMS.filter((r) => r.active);

  return (
    <main className="flex-1 px-6 py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-text-accent">Pricing</p>
          <h1 className="font-display text-5xl font-medium tracking-[-0.014em] text-text-primary">
            <span className="font-normal lowercase">by the hour,</span>{" "}
            <span className="font-extrabold uppercase">NOTHING HIDDEN.</span>
          </h1>
          <p className="max-w-2xl text-base text-text-secondary">
            Every room is booked by the hour, {SITE.hours.open}–{SITE.hours.close}, {SITE.hours.days}. The
            total below is exactly what you pay at checkout. No cleaning fees, no service fees, no
            membership required.
          </p>
        </div>

        {/* Mobile: stacked cards. Desktop: full table. */}
        <div className="flex flex-col gap-4 md:hidden">
          {rooms.map((room) => (
            <div key={room.id} className="flex flex-col gap-2 rounded-token-lg bg-surface p-5 shadow-[var(--shadow-subtle)]">
              <div className="flex items-baseline justify-between gap-3">
                <Link href={`/rooms/${room.id}`} className="font-display text-xl lowercase text-text-primary">
                  {room.name}
                </Link>
                <span className="text-base font-semibold text-text-primary">
                  {formatUsdPerHour(room.hourlyRateCents)}
                </span>
              </div>
              <p className="text-sm text-text-secondary">
                {ROOM_TYPE_LABELS[room.type]} · {room.capacity} people · {room.sqft} sq ft
              </p>
              <p className="text-sm text-text-secondary">
                2 hrs {formatUsd(room.hourlyRateCents * 2)} · 3 hrs {formatUsd(room.hourlyRateCents * 3)}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-default">
                <th className="py-3 pr-4 text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Room</th>
                <th className="py-3 pr-4 text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Type</th>
                <th className="py-3 pr-4 text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">Fits</th>
                <th className="py-3 pr-4 text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">1 hour</th>
                <th className="py-3 pr-4 text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">2 hours</th>
                <th className="py-3 pr-4 text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">3 hours</th>
                <th className="py-3 text-sm font-semibold uppercase tracking-[1.5px] text-text-primary">
                  <span className="sr-only">Book</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-b border-border-subtle">
                  <td className="py-4 pr-4">
                    <Link href={`/rooms/${room.id}`} className="font-display text-lg lowercase text-text-primary hover:text-text-accent">
                      {room.name}
                    </Link>
                  </td>
                  <td className="py-4 pr-4 text-sm text-text-secondary">{ROOM_TYPE_LABELS[room.type]}</td>
                  <td className="py-4 pr-4 text-sm text-text-secondary">{room.capacity} people</td>
                  <td className="py-4 pr-4 text-sm font-semibold text-text-primary">{formatUsd(room.hourlyRateCents)}</td>
                  <td className="py-4 pr-4 text-sm text-text-secondary">{formatUsd(room.hourlyRateCents * 2)}</td>
                  <td className="py-4 pr-4 text-sm text-text-secondary">{formatUsd(room.hourlyRateCents * 3)}</td>
                  <td className="py-4">
                    <Link
                      href={`/rooms/${room.id}#book`}
                      className="rounded-token-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
                    >
                      Book
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-text-secondary">
          Every booking includes the room&apos;s full equipment list. See each room&apos;s page for exactly
          what&apos;s inside. Payment is processed securely by Stripe at the time of booking.
        </p>
      </div>
    </main>
  );
}
