import { BOOKING_CONFIG } from "@/types/domain";
import { formatTime12h } from "@/lib/format";

const hhmm = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/**
 * Site-wide business details, kept in ONE place so going live is a single
 * edit. Every value below marked PLACEHOLDER is intentionally fake-obvious
 * (per the owner's direction: personalized details stay placeholders until
 * they supply the real ones); swap them before launch. Nothing else in the
 * codebase hardcodes these.
 */
export const SITE = {
  name: "Clockroom",
  /** The name is a pun that needs teaching exactly once; the tagline does it. */
  tagline: "Content rooms, podcast suites, and conference rooms, booked by the hour.",

  /** PLACEHOLDER contact details: replace with real ones before launch. */
  contactEmail: "hello@yourstudio.example",
  phone: "(000) 000-0000",
  address: {
    line1: "123 Your Street",
    line2: "Suite 100",
    city: "Your City",
    region: "ST",
    zip: "00000",
  },

  /** PLACEHOLDER social handles: replace or remove per platform. */
  social: {
    instagram: "https://instagram.com/yourstudio",
    tiktok: "https://tiktok.com/@yourstudio",
  },

  /** Derived from BOOKING_CONFIG so marketing copy and the engine cannot drift.
   * `opensAt`/`closesAt` are 24h "HH:MM" for structured data. */
  hours: {
    open: formatTime12h(hhmm(BOOKING_CONFIG.operatingStartHour)),
    close: formatTime12h(hhmm(BOOKING_CONFIG.operatingEndHour)),
    opensAt: hhmm(BOOKING_CONFIG.operatingStartHour),
    closesAt: hhmm(BOOKING_CONFIG.operatingEndHour),
    days: "7 days a week",
  },

  /** PLACEHOLDER: the studio's IANA time zone. Slot times, same-day notice
   * and "today" are all computed in this zone, not the server's. */
  timeZone: "America/New_York",
} as const;

// A production build without a real origin would ship localhost canonicals,
// sitemap URLs and OAuth redirects, so fail loudly instead.
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error("NEXT_PUBLIC_SITE_URL is not set. Set it to the site's public https origin (see .env.example) before building for production.");
}

/** Absolute origin for canonical URLs, sitemap, OAuth redirect and emails. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
