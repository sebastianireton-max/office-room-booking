import type { RoomType } from "@/types/domain";
import { ROOM_TYPE_LABELS } from "@/types/domain";

/**
 * Mirrors the Figma Room Type Badge component (node 7:11).
 *
 * RESTYLE 2026-08-31: the per-type colour dot is gone. It encoded category in
 * three separate hues, which is three accents on a one-accent page
 * (design-verified 4.3), and 4.6 bans decorative status dots regardless. The
 * label beside it already carried the whole meaning, so this is a deletion,
 * not a recolour.
 *
 * The first attempt replaced the dot with uppercase wide tracking. The
 * verifier rejected it: six chips styled that way ARE six eyebrows by the
 * Section 2.3 count (6 over 5 sections against a budget of 2), whatever they
 * are called in the component. Sentence case, no extra tracking.
 */
export function RoomTypeBadge({ type }: { type: RoomType }) {
  return (
    <span className="inline-flex w-fit items-center rounded-token-full border border-border-default bg-surface-raised px-3 py-1 text-xs font-medium text-text-secondary">
      {ROOM_TYPE_LABELS[type]}
    </span>
  );
}
