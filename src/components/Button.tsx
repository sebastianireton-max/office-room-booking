import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Pill button. Primary fill carries near-white text: 5.25:1 on teal-600,
 * 7.28:1 on the teal-700 hover (near-black on teal-600 fails at 3.02:1).
 * Danger uses the error fill with the same near-white label (6.27:1).
 * One hover signal per variant, one press signal, no overshoot easing.
 */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-outline";
type Size = "sm" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface text-text-primary border border-border-default hover:border-border-accent hover:text-text-accent",
  ghost: "bg-transparent text-text-accent hover:bg-surface",
  danger: "bg-error text-on-status hover:bg-text-primary",
  "danger-outline": "bg-transparent text-error border border-error hover:bg-error hover:text-on-status",
};

const sizes: Record<Size, string> = {
  sm: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-7 text-base",
};

/* Explicit disabled tokens, never an opacity multiplier: opacity lands wherever
   the substrate puts it (ink at 40% over paper is ~2.6:1). text-secondary on
   surface-raised measures 4.86:1. */
const disabled =
  "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-raised disabled:text-text-secondary disabled:ring-1 disabled:ring-inset disabled:ring-border-subtle disabled:hover:bg-surface-raised disabled:hover:text-text-secondary";

const base = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-token-full py-2.5 font-semibold transition-[background-color,border-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-expo)] active:scale-[0.98] motion-reduce:active:scale-100 ${disabled}`;

/** Classes for button-styled elements Button doesn't render (a <label>, a <summary>). */
export function buttonClass(variant: Variant = "primary", size: Size = "sm"): string {
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  /** Renders a plain <a download> (Link would try to route to a file). */
  download?: boolean | string;
  /** Renders a plain <a> for off-site links. */
  external?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "sm", href, download, external, className = "", children, ...rest }: ButtonProps) {
  const classes = `${buttonClass(variant, size)} ${className}`;
  if (href && (download || external)) {
    return (
      <a href={href} className={classes} download={download === true ? "" : download || undefined}>
        {children}
      </a>
    );
  }
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
