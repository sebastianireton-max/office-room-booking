import { createEvent, type EventAttributes } from "ics";
import { SITE } from "@/lib/site-config";
import type { Booking, Room } from "@/types/domain";

export { googleCalendarUrl, outlookCalendarUrl } from "./calendar-links";

function parts(date: string, time: string): [number, number, number, number, number] {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return [y, mo, d, h, mi];
}

/** .ics for a confirmed booking. The UID is stable, so re-downloading updates
 * the same calendar entry instead of duplicating it. Times are the studio's
 * local wall-clock times. */
export function generateIcs(booking: Booking, room: Room): string {
  const a = SITE.address;
  const event: EventAttributes = {
    uid: booking.calendarEventUid,
    title: `${room.name} at ${SITE.name}`,
    description: `Your ${room.name} booking. Reference ${booking.id}. Questions: ${SITE.contactEmail}`,
    location: `${a.line1}, ${a.line2}, ${a.city}, ${a.region} ${a.zip}`,
    start: parts(booking.date, booking.startTime),
    startInputType: "local",
    startOutputType: "local",
    end: parts(booking.date, booking.endTime),
    endInputType: "local",
    endOutputType: "local",
    status: "CONFIRMED",
    organizer: { name: SITE.name, email: SITE.contactEmail },
    attendees: [{ name: booking.customerName, email: booking.customerEmail }],
  };
  const { error, value } = createEvent(event);
  if (error || !value) throw error ?? new Error("Failed to generate calendar event.");
  return value;
}
