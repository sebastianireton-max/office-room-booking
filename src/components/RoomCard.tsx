import Image from "next/image";
import { RoomTypeBadge } from "./RoomTypeBadge";
import { Button } from "./Button";
import type { Room } from "@/types/domain";
import { formatUsdPerHour } from "@/lib/format";

/**
 * The Room Card — specified in the design package (Section 4.9) but never
 * built in Figma (blocked by the rate limit mid-build). Built directly to
 * that spec here: 360px-ish card, image, badge, name, specs line,
 * price + "View Details" CTA.
 *
 * IMAGERY IS DELIBERATELY ILLUSTRATION, NOT PHOTOGRAPHY. The rooms are not
 * photographed yet, and the owner's standing rule is that nothing may depict
 * a space that does not exist as shown. These are commissioned-style
 * risograph illustrations drawn from each room's real equipment list, so a
 * visitor reads "this is artwork about the room", never "this is the room".
 * When real photos arrive, drop them in public/rooms/art/<id>.webp — no code
 * change, and the alt text below should lose the word "Illustration".
 */
export function RoomCard({ room }: { room: Room }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-token-lg bg-surface shadow-[var(--shadow-subtle)] transition-shadow hover:shadow-[var(--shadow-medium)]">
      <div className="relative h-[200px] w-full overflow-hidden bg-surface-raised">
        <Image
          src={`/rooms/art/${room.id}.webp`}
          alt={`Illustration of ${room.name}: ${room.description}`}
          fill
          sizes="(max-width: 640px) 100vw, 360px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <RoomTypeBadge type={room.type} />
        <h3 className="font-display text-2xl font-medium lowercase italic text-text-primary">{room.name}</h3>
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
