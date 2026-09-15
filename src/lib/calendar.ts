import { createEvent, type EventAttributes } from "ics";
import { SITE } from "@/lib/site-config";
import { zonedToUtc } from "@/lib/format";
import type { Booking, Room } from "@/types/domain";

export { googleCalendarUrl, outlookCalendarUrl } from "./calendar-links";

// UTC instants: floating local times shift when the calendar sits in another zone.
const utc = (date: string, time: string) => zonedToUtc(date, time, SITE.timeZone).getTime();

/** .ics for a confirmed booking. The UID is stable, so re-downloading updates
 * the same calendar entry instead of duplicating it. No attendee: the file is
 * served by booking id alone, so it carries no customer name or email. */
export function generateIcs(booking: Booking, room: Room): string {
  const a = SITE.address;
  const event: EventAttributes = {
    uid: booking.calendarEventUid,
    title: `${room.name} at ${SITE.name}`,
    description: `Your ${room.name} booking. Reference ${booking.id}. Questions: ${SITE.contactEmail}`,
    location: `${a.line1}, ${a.line2}, ${a.city}, ${a.region} ${a.zip}`,
    start: utc(booking.date, booking.startTime),
    startInputType: "utc",
    startOutputType: "utc",
    end: utc(booking.date, booking.endTime),
    endInputType: "utc",
    endOutputType: "utc",
    status: "CONFIRMED",
    organizer: { name: SITE.name, email: SITE.contactEmail },
  };
  const { error, value } = createEvent(event);
  if (error || !value) throw error ?? new Error("Failed to generate calendar event.");
  return value;
}
