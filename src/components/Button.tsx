import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Mirrors the Figma Button component (node 6:20): Style × State variants.
 * "State" here is handled by native CSS (:hover, :disabled) rather than a
 * separate prop, since in code hover is a real interaction, not a static
 * variant to choose.
 *
 * Pill radius, per the Awwwards Premium pack's radius system taken whole.
 *
 * RESTYLE 2026-08-31: the primary fill carries near-WHITE text again. On the
 * warm-paper substrate the accent is dark, so near-white on teal-600 measures
 * 5.25:1 (7.28:1 on the teal-700 hover) while near-black measures 3.02:1 and
 * fails. This is the exact opposite of the rule that was correct here
 * yesterday. See the re-inversion banner in globals.css before changing it.
 */

type Style = "primary" | "secondary" | "ghost";

const styles: Record<Style, string> = {
  primary: "bg-accent text-on-accent shadow-[var(--shadow-accent)] hover:bg-accent-hover hover:-translate-y-px",
  secondary:
    "bg-surface text-text-primary border border-border-default hover:border-border-accent hover:text-text-accent",
  ghost: "bg-transparent text-text-accent hover:bg-surface",
};

/* One disabled treatment for all three variants, not three.
   `secondary` and `ghost` used to dim themselves with `disabled:opacity-40`,
   which is the same bug that made the time slot grid unreadable: an opacity
   multiplier is not a colour, so it lands wherever the new substrate puts it
   (ink at 40% over paper computes to about 2.6:1). An explicit disabled fill
   and an explicit disabled text token survive a substrate flip, and
   text-secondary on surface-raised measures 4.86:1 on this one. */
const disabled =
  "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-raised disabled:text-text-secondary disabled:shadow-none disabled:ring-1 disabled:ring-inset disabled:ring-border-subtle disabled:hover:translate-y-0 disabled:hover:bg-surface-raised disabled:hover:text-text-secondary";

const base = `inline-flex items-center justify-center gap-2 rounded-token-full px-6 py-2.5 text-sm font-semibold tracking-[0.1px] transition-all duration-[var(--duration-fast)] ease-[var(--ease-spring)] min-h-11 active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0 ${disabled}`;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Style;
  href?: string;
  children: ReactNode;
}

export function Button({ variant = "primary", href, className = "", children, ...rest }: ButtonProps) {
  const classes = `${base} ${styles[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
