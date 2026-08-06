import type { RoomType } from "@/types/domain";
import { ROOM_TYPE_LABELS } from "@/types/domain";

/** Mirrors the Figma Room Type Badge component (node 7:11). Dot color is
 * derived from type, never set independently — design package Section 9.4. */
const dotColor: Record<RoomType, string> = {
  content: "bg-accent",
  podcast: "bg-info",
  conference: "bg-warning",
};

export function RoomTypeBadge({ type }: { type: RoomType }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-token-full bg-surface-raised px-3 py-1 text-xs font-medium tracking-[0.3px] text-text-primary">
      <span className={`h-2 w-2 rounded-full ${dotColor[type]}`} aria-hidden="true" />
      {ROOM_TYPE_LABELS[type]}
    </span>
  );
}
