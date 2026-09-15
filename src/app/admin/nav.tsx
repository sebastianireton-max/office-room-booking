"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  ["/admin", "Today"],
  ["/admin/bookings", "Bookings"],
  ["/admin/blocks", "Block-outs"],
  ["/admin/activity", "Activity"],
];

/** Client only for usePathname: a layout does not re-render between its pages. */
export function AdminNav({ className = "" }: { className?: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className={`flex flex-nowrap gap-1 overflow-x-auto ${className}`}>
      {NAV.map(([href, label]) => {
        const current = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-token-sm px-3 text-sm font-medium hover:bg-surface-raised hover:text-text-primary ${
              current ? "text-text-primary underline decoration-2 underline-offset-8" : "text-text-secondary"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
