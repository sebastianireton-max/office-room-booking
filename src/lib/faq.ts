import { SITE } from "@/lib/site-config";
import { BOOKING_CONFIG } from "@/types/domain";

/** Answers describe how the site actually works. Undecided policy (cancellation)
 * says so instead of inventing terms. Plain strings, so the same text feeds the
 * FAQPage structured data. */
export const FAQS: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: "What are your hours?",
    a: `Rooms can be booked ${SITE.hours.open} to ${SITE.hours.close}, ${SITE.hours.days}. Bookings start on the hour and last 1, 2 or 3 hours.`,
  },
  {
    q: "How far in advance do I need to book?",
    a: `Same-day bookings need at least ${BOOKING_CONFIG.minBookingNoticeHours} hours’ notice. You can book up to ${BOOKING_CONFIG.maxAdvanceDays} days ahead. If a time shows as open, it’s bookable.`,
  },
  {
    q: "Is my time slot reserved while I check out?",
    a: `Yes. Once you enter your details the slot is held for ${BOOKING_CONFIG.holdDurationMinutes} minutes, and nobody else can book it. If you don’t finish, the hold ends and the slot reopens automatically.`,
  },
  {
    q: "What equipment is included?",
    a: "Everything on a room’s equipment list is included in the hourly rate. Each room’s page lists it.",
    link: { href: "/pricing", label: "Compare rooms and rates" },
  },
  {
    q: "How do I pay?",
    a: "By card when you book, through Stripe. Your card details never reach our servers, and a booking is only confirmed once the payment actually succeeds.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can book with just a name and email. If you’d like your bookings in one place, sign in with Google; bookings made with the same email appear there too.",
    link: { href: "/account", label: "Your bookings" },
  },
  {
    q: "What happens after I book?",
    a: "You land on a confirmation page with add-to-calendar links for Google Calendar, Outlook and Apple Calendar, and the confirmation email carries the calendar invite.",
  },
  {
    q: "Can I cancel or reschedule?",
    a: "Contact us and we’ll sort it out. A formal cancellation policy is being finalized and will be posted here.",
    link: { href: "/contact", label: "Contact us" },
  },
  {
    q: "How many people fit in each room?",
    a: "From 2 in the compact content and podcast studios up to 10 in The Boardroom. Each room’s page and the pricing table list capacity.",
  },
];
