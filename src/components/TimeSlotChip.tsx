/**
 * Mirrors the Figma Time Slot Chip component (node 7:38). Unavailable state
 * is conveyed with a text label ("Booked"), not opacity alone (design
 * package Section 8.6 #6). Tap target padded to 44×44px minimum even though
 * the visible pill is smaller (Section 8.5) via the button's min-h/min-w and
 * padding rather than enlarging the visible chip.
 */
export function TimeSlotChip({
  label,
  state,
  onClick,
}: {
  label: string;
  state: "available" | "selected" | "unavailable";
  onClick?: () => void;
}) {
  const isUnavailable = state === "unavailable";
  return (
    <button
      type="button"
      disabled={isUnavailable}
      onClick={onClick}
      aria-pressed={state === "selected"}
      className={[
        "min-h-11 min-w-11 rounded-token-sm border px-3.5 py-2.5 text-sm font-medium tracking-[0.1px] transition-colors",
        state === "available" &&
          "border-border-default bg-surface-raised text-text-primary hover:border-border-accent",
        state === "selected" && "border-accent bg-accent text-on-accent",
        isUnavailable && "cursor-not-allowed border-border-subtle bg-transparent text-text-secondary opacity-45",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isUnavailable ? `${label} · Booked` : label}
    </button>
  );
}
