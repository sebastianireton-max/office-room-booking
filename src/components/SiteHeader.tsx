"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";

const NAV = [
  { href: "/#rooms", label: "Rooms" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/account", label: "Account" },
];

/**
 * Floating pill nav, contained to the page width instead of a full-bleed bar
 * with a hairline (hallmark: "the AI nav"). Sticky, one line, 56px tall.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // On a room page the booking widget is right there; don't send people back.
  const bookHref = pathname.startsWith("/rooms/") ? "#book" : "/#rooms";

  return (
    <header className="sticky top-3 z-40 px-3 pt-3 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-token-lg border border-border-subtle bg-surface/90 shadow-[var(--shadow-subtle)] backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-4 pl-5 pr-2">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
              <rect width="32" height="32" rx="8" fill="var(--neutral-50)" />
              <path d="M16 16 L23 9" stroke="var(--accent-teal-400)" strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="16" cy="16" r="2.1" fill="var(--neutral-1000)" />
            </svg>
            <Wordmark className="text-lg" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-token-full px-3.5 text-sm font-medium transition-colors ${
                    active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={bookHref}
              className="ml-2 inline-flex min-h-11 items-center whitespace-nowrap rounded-token-full bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.98] motion-reduce:active:scale-100"
            >
              Book a room
            </Link>
          </nav>

          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-token-full px-4 text-sm font-semibold text-text-primary md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Main" className="border-t border-border-subtle px-5 pb-4 md:hidden">
            <ul className="flex flex-col">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block py-3 text-base font-medium text-text-primary" onClick={() => setOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  href={bookHref}
                  className="block rounded-token-full bg-accent px-5 py-3 text-center text-base font-semibold text-on-accent"
                  onClick={() => setOpen(false)}
                >
                  Book a room
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
