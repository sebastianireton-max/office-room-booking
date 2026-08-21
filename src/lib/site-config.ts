/**
 * Site-wide business details, kept in ONE place so going live is a single
 * edit. Every value below marked PLACEHOLDER is intentionally fake-obvious
 * (per the owner's direction: personalized details stay placeholders until
 * they supply the real ones) — swap them before launch. Nothing else in the
 * codebase hardcodes these.
 */
export const SITE = {
  name: "Clockroom",
  /** The name is a pun that needs teaching exactly once; the tagline does it. */
  tagline: "Content rooms, podcast suites, and conference rooms, booked by the hour.",
  wordmarkTagline: "Show up. Clock in. Create.",

  /** PLACEHOLDER contact details — replace with real ones before launch. */
  contactEmail: "hello@yourstudio.example",
  phone: "(000) 000-0000",
  address: {
    line1: "123 Your Street",
    line2: "Suite 100",
    city: "Your City",
    region: "ST",
    zip: "00000",
  },

  /** PLACEHOLDER social handles — replace or remove per platform. */
  social: {
    instagram: "https://instagram.com/yourstudio",
    tiktok: "https://tiktok.com/@yourstudio",
  },

  /** Real values — mirrored from BOOKING_CONFIG so marketing pages and the
   * booking engine can't drift apart. */
  hours: { open: "8:00 AM", close: "10:00 PM", days: "7 days a week" },
} as const;

export const PLACEHOLDER_NOTE =
  "Placeholder: the owner supplies the real details before launch.";
