import { RoomTypeBadge } from "./RoomTypeBadge";
import { Button } from "./Button";
import type { Room } from "@/types/domain";
import { formatUsdPerHour } from "@/lib/format";

/**
 * The Room Card — specified in the design package (Section 4.9) but never
 * built in Figma (blocked by the rate limit mid-build). Built directly to
 * that spec here: 360px-ish card, image placeholder, badge, name, specs
 * line, price + "View Details" CTA.
 */
export function RoomCard({ room }: { room: Room }) {
  return (
    <div className="flex w-full max-w-[360px] flex-col overflow-hidden rounded-token-lg bg-surface shadow-[var(--shadow-subtle)] transition-shadow hover:shadow-[var(--shadow-medium)]">
      <div className="relative flex h-[200px] w-full items-center justify-center overflow-hidden bg-surface-raised text-text-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed */}
        <img
          src={`/rooms/${room.id}.svg`}
          alt={`${room.name} — room photo placeholder`}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <RoomTypeBadge type={room.type} />
        <h3 className="text-xl font-semibold text-text-primary">{room.name}</h3>
        <p className="text-sm text-text-secondary">
          {room.capacity} people · {room.sqft} sq ft
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-base font-semibold text-text-primary">
            From {formatUsdPerHour(room.hourlyRateCents)}
          </span>
          <Button href={`/rooms/${room.id}`} variant="primary">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
