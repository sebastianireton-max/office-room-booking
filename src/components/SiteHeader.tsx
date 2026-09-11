"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";

const NAV = [
  { href: "/#rooms", label: "Rooms" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  /* On a room page the booking widget is already rendered at #book. Sending
     "Book a room" to the homepage grid from there walks the visitor backwards
     out of the one page where they are closest to converting. */
  const bookHref = pathname.startsWith("/rooms/") ? "#book" : "/#rooms";

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
            {/* Ink square on paper. The mark keeps its dark ground across the
                substrate flip so it reads as a stamp pressed into the page,
                and so the favicon (src/app/icon.svg, same geometry) stays
                identical to it. No stroke: on paper the fill is the contrast. */}
            <rect width="32" height="32" rx="8" fill="var(--neutral-50)" />
            <path d="M16 16 L23 9" stroke="var(--accent-teal-400)" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2.1" fill="var(--neutral-1000)" />
          </svg>
          <Wordmark className="text-lg" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium ${
                pathname === item.href ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={bookHref}
            className="inline-flex min-h-11 items-center rounded-token-full bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.98] motion-reduce:active:scale-100"
          >
            Book a room
          </Link>
        </nav>

        {/* Mobile menu button — 44px tap target */}
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-token-md text-text-primary md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            {open ? (
              <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav panel */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-border-subtle bg-canvas px-6 pb-6 pt-2 md:hidden"
        >
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block py-3.5 text-base font-medium text-text-primary"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-3">
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
    </header>
  );
}
