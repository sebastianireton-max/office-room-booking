import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Pill button. Primary fill carries near-white text: 5.25:1 on teal-600,
 * 7.28:1 on the teal-700 hover (near-black on teal-600 fails at 3.02:1).
 * One hover signal per variant, one press signal, no overshoot easing.
 */
type Style = "primary" | "secondary" | "ghost";

const styles: Record<Style, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface text-text-primary border border-border-default hover:border-border-accent hover:text-text-accent",
  ghost: "bg-transparent text-text-accent hover:bg-surface",
};

/* Explicit disabled tokens, never an opacity multiplier: opacity lands wherever
   the substrate puts it (ink at 40% over paper is ~2.6:1). text-secondary on
   surface-raised measures 4.86:1. */
const disabled =
  "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-raised disabled:text-text-secondary disabled:ring-1 disabled:ring-inset disabled:ring-border-subtle disabled:hover:bg-surface-raised disabled:hover:text-text-secondary";

const base = `inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-token-full px-6 py-2.5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-expo)] active:scale-[0.98] motion-reduce:active:scale-100 ${disabled}`;

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
