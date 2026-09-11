import Link from "next/link";
import { MediaSlot } from "./MediaSlot";
import { RoomTypeBadge } from "./RoomTypeBadge";
import type { Room } from "@/types/domain";
import { formatUsdPerHour } from "@/lib/format";

/**
 * The Room Card.
 *
 * IMAGERY IS DELIBERATELY ILLUSTRATION, NOT PHOTOGRAPHY. The rooms are not
 * photographed yet, and the owner's standing rule is that nothing may depict
 * a space that does not exist as shown. These are commissioned-style
 * risograph illustrations drawn from each room's real equipment list, so a
 * visitor reads "this is artwork about the room", never "this is the room".
 * When real photos arrive, drop them in public/rooms/art/<id>.webp — no code
 * change, and the alt text below should lose the word "Illustration".
 *
 * The card is horizontal below `sm` and vertical from `sm` up. Measured at
 * 390px, the room grid was 3179px of a 6381px page (59%) as six stacked
 * full-width verticals. The horizontal form roughly halves that without
 * dropping the artwork. The whole card is the link, so the tap target is the
 * card rather than a 100px button, and "View Details" is a non-interactive
 * affordance (nesting a link inside a link is invalid HTML).
 *
 * RESTYLE 2026-08-31 — the inset plate is DELETED, not restyled. It existed
 * only because the illustrations are drawn on a cream ground: flush to the
 * edge on the warm-black substrate they read as a light-mode hole punched
 * through the page (design-verified 4.3, one theme per page), so the dark card
 * was made to frame them on all four sides. The paper substrate removes the
 * problem the plate solved, so the artwork bleeds to the card edge again and
 * the padding, the inner radius and the frame all go with it. A fix that
 * outlives its bug is just decoration.
 *
 * The media goes through MediaSlot (2026-08-31), so this rail is video-ready
 * from the same seam as everything else: a clip added to `rooms-data.ts`
 * replaces the illustration here with no change to this file. MediaSlot
 * carries the card's own surface, not a tinted one, so the letterboxing the
 * mobile `object-contain` leaves is invisible rather than framing the art.
 */
export function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex h-full w-full flex-row overflow-hidden rounded-token-lg border border-border-subtle bg-surface shadow-[var(--shadow-subtle)] transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-border-default hover:shadow-[var(--shadow-medium)] motion-reduce:hover:translate-y-0 sm:flex-col"
    >
      <MediaSlot
        video={room.reel}
        poster={`/rooms/art/${room.id}.webp`}
        alt={`Illustration of ${room.name}: ${room.description}`}
        sizes="(max-width: 640px) 116px, 360px"
        className="w-[116px] shrink-0 self-stretch sm:h-[210px] sm:w-full sm:self-auto"
        /* contain below sm, cover from sm. The illustrations are wide
           landscape scenes; cover on the narrow mobile plate cropped them to
           an unreadable vertical sliver of backdrop. Letterboxed-but-whole
           beats cropped-to-nothing. */
        imageClassName="object-contain p-1 transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:group-hover:scale-100 sm:object-cover sm:p-0"
      />

      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-5">
        <RoomTypeBadge type={room.type} />
        <h3 className="font-display text-xl font-semibold lowercase text-text-primary sm:text-2xl">
          {room.name}
        </h3>
        <p className="text-sm text-text-secondary">
          {room.capacity} people · {room.sqft} sq ft
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2 sm:pt-3">
          <span className="text-sm text-text-secondary">
            From{" "}
            <span className="tabular text-base font-semibold text-text-primary">
              {formatUsdPerHour(room.hourlyRateCents)}
            </span>
          </span>
          {/* Affordance only. The card itself carries the navigation. */}
          <span
            aria-hidden="true"
            className="hidden min-h-11 items-center justify-center rounded-token-full bg-accent px-6 text-sm font-semibold text-on-accent shadow-[var(--shadow-accent)] transition-colors duration-[var(--duration-fast)] group-hover:bg-accent-hover sm:inline-flex"
          >
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
