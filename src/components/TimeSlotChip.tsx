/**
 * Mirrors the Figma Time Slot Chip component (node 7:38). Unavailable state
 * is conveyed with a text label ("Booked" / "Closed"), not opacity alone
 * (design package Section 8.6 #6). Tap target padded to 44×44px minimum even
 * though the visible pill is smaller (Section 8.5) via the button's
 * min-h/min-w and padding rather than enlarging the visible chip.
 *
 * RESTYLE 2026-08-31: the unavailable chip dropped `opacity-45`. On the
 * warm-black substrate that dimmed a light grey toward the ground and still
 * read; blended over paper it computes to roughly 2.0:1 (#6b6259 at 45% over
 * #fdfaf4 lands near #bbb6ae) and most of the grid became unreadable. Disabled
 * controls are exempt from WCAG 1.4.3, but "Closed" and "Booked" mean
 * different things and a visitor has to be able to tell which they are looking
 * at. De-emphasis now comes from the three signals that cost no contrast: no
 * fill, the subtle border instead of the default one, and the label itself.
 *
 * The general lesson, since this is the second time it has bitten: an opacity
 * multiplier is not a colour. It survives a substrate flip silently and lands
 * wherever the new background happens to put it.
 */
export function TimeSlotChip({
  label,
  state,
  unavailableReason = "booked",
  onClick,
}: {
  label: string;
  state: "available" | "selected" | "unavailable";
  unavailableReason?: "booked" | "too-soon" | "closed";
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
        "min-h-11 min-w-11 rounded-token-sm border px-3.5 py-2.5 text-sm font-medium tracking-[0.1px] transition active:scale-[0.98] motion-reduce:active:scale-100",
        state === "available" &&
          "border-border-default bg-surface-raised text-text-primary hover:border-border-accent",
        state === "selected" && "border-accent bg-accent text-on-accent",
        isUnavailable && "cursor-not-allowed border-border-subtle bg-transparent text-text-secondary",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isUnavailable ? `${label} · ${unavailableReason === "booked" ? "Booked" : "Closed"}` : label}
    </button>
  );
}
