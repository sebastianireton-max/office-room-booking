import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Mirrors the Figma Button component (node 6:20): Style × State variants.
 * "State" here is handled by native CSS (:hover, :disabled) rather than a
 * separate prop, since in code hover is a real interaction, not a static
 * variant to choose. Default background uses the corrected accent (coral) 600 fill
 * — design package Section 8.3.
 */

type Style = "primary" | "secondary" | "ghost";

const styles: Record<Style, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent",
  secondary:
    "bg-surface text-text-accent border border-border-default hover:bg-surface-raised disabled:opacity-40",
  ghost: "bg-transparent text-text-accent hover:bg-surface disabled:opacity-40",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-token-md px-5 py-2.5 text-sm font-medium tracking-[0.1px] transition disabled:cursor-not-allowed min-h-11 active:scale-[0.98] motion-reduce:active:scale-100";

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
