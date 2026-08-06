import { createEvent, type EventAttributes } from "ics";
import type { Booking, Room } from "@/types/domain";

function parts(date: string, time: string): [number, number, number, number, number] {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return [y, mo, d, h, mi];
}

/** Generates .ics content for a confirmed booking. UID is stable (booking id
 * based) so re-downloading or a future update regenerates the same calendar
 * entry instead of creating a duplicate — design package Section 5.3. */
export function generateIcs(booking: Booking, room: Room): string {
  const event: EventAttributes = {
    uid: booking.calendarEventUid,
    title: `${room.name} — Booking Confirmation`,
    description: `Your booking at ${room.name}. Reference #${booking.id}. Questions? Reply to this email.`,
    start: parts(booking.date, booking.startTime),
    end: parts(booking.date, booking.endTime),
    status: "CONFIRMED",
    organizer: { name: "Room Booking Platform" },
    attendees: [{ name: booking.customerName, email: booking.customerEmail }],
  };
  const { error, value } = createEvent(event);
  if (error || !value) {
    throw error ?? new Error("Failed to generate calendar event.");
  }
  return value;
}

function toGoogleDate(date: string, time: string): string {
  const [y, mo, d] = date.split("-");
  const [h, mi] = time.split(":");
  return `${y}${mo}${d}T${h}${mi}00`;
}

/** Google Calendar "add event" link — no OAuth required, just a URL template. */
export function googleCalendarUrl(booking: Booking, room: Room): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${room.name} — Booking Confirmation`,
    dates: `${toGoogleDate(booking.date, booking.startTime)}/${toGoogleDate(
      booking.date,
      booking.endTime
    )}`,
    details: `Your booking at ${room.name}. Reference #${booking.id}.`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Outlook web "deeplink" add-event link — also URL-only, no OAuth. */
export function outlookCalendarUrl(booking: Booking, room: Room): string {
  const startdt = new Date(`${booking.date}T${booking.startTime}:00`).toISOString();
  const enddt = new Date(`${booking.date}T${booking.endTime}:00`).toISOString();
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: `${room.name} — Booking Confirmation`,
    startdt,
    enddt,
    body: `Your booking at ${room.name}. Reference #${booking.id}.`,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
