import type { Metadata } from "next";
import Link from "next/link";
import { ROOMS } from "@/lib/rooms-data";
import { ROOM_TYPE_LABELS } from "@/types/domain";
import { formatUsd, priceCents } from "@/lib/format";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Hourly rates for every content, podcast and meeting room. The price you see is the price you pay. No fees, no memberships, no minimums.",
  alternates: { canonical: "/pricing" },
};

const LENGTHS = [60, 120, 180];
const th = "py-3 pr-4 text-sm font-medium text-text-secondary";

/** Rates are read straight from the room catalog, the same data the booking
 * engine charges from, so this page can never drift from what Stripe bills. */
export default function PricingPage() {
  const rooms = ROOMS.filter((r) => r.active);

  return (
    <main className="flex-1 px-6 pb-20 pt-12 sm:pb-24 sm:pt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h1 className="type-page text-text-primary">Pricing</h1>
          <p className="max-w-[65ch] text-lg leading-relaxed text-text-secondary">
            Every room is booked by the hour, {SITE.hours.open} to {SITE.hours.close}, {SITE.hours.days}. The
            total below is exactly what you pay at checkout. No cleaning fees, no service fees, no
            membership required.
          </p>
        </div>

        {/* Mobile: hairline rows. Desktop: full table. */}
        <ul className="flex flex-col border-t border-border-default md:hidden">
          {rooms.map((room) => (
            <li key={room.id} className="flex flex-col gap-2 border-b border-border-subtle py-4">
              <div className="flex items-baseline justify-between gap-3">
                <Link href={`/rooms/${room.id}#book`} className="type-subhead text-text-primary hover:text-text-accent">
                  {room.name}
                </Link>
                <span className="tabular text-base font-semibold text-text-primary">
                  {formatUsd(room.hourlyRateCents)}/hr
                </span>
              </div>
              <p className="text-sm text-text-secondary">
                {ROOM_TYPE_LABELS[room.type]} · {room.capacity} people · {room.sqft} sq ft
              </p>
              <p className="text-sm text-text-secondary">
                2 hours <span className="tabular">{formatUsd(priceCents(room.hourlyRateCents, 120))}</span> · 3 hours{" "}
                <span className="tabular">{formatUsd(priceCents(room.hourlyRateCents, 180))}</span>
              </p>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-default">
                <th className={th}>Room</th>
                <th className={th}>Type</th>
                <th className={th}>Fits</th>
                {LENGTHS.map((m) => (
                  <th key={m} className={`${th} text-right`}>
                    {m / 60} {m === 60 ? "hour" : "hours"}
                  </th>
                ))}
                <th className="py-3">
                  <span className="sr-only">Book</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-b border-border-subtle">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/rooms/${room.id}#book`}
                      className="inline-flex min-h-11 items-center text-lg font-semibold text-text-primary hover:text-text-accent"
                    >
                      {room.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-sm text-text-secondary">{ROOM_TYPE_LABELS[room.type]}</td>
                  <td className="py-2 pr-4 text-sm text-text-secondary">{room.capacity} people</td>
                  {LENGTHS.map((m) => (
                    <td
                      key={m}
                      className={`tabular py-2 pr-4 text-right text-base ${m === 60 ? "font-semibold text-text-primary" : "text-text-secondary"}`}
                    >
                      {formatUsd(priceCents(room.hourlyRateCents, m))}
                    </td>
                  ))}
                  <td className="py-2 pl-4 text-right">
                    <Link
                      href={`/rooms/${room.id}#book`}
                      className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-text-accent underline underline-offset-4 hover:text-text-primary"
                    >
                      Book<span className="sr-only"> {room.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="max-w-[62ch] text-sm leading-relaxed text-text-secondary">
          Every booking includes the room&rsquo;s full equipment list. See each room&rsquo;s page for exactly
          what&rsquo;s inside. Payment is processed securely by Stripe at the time of booking.
        </p>
      </div>
    </main>
  );
}
