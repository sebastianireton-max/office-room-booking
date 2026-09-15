import { SITE } from "@/lib/site-config";
import { zonedToUtc } from "@/lib/format";

type Slot = { id: string; date: string; startTime: string; endTime: string };
type Named = { name: string };

const compact = (date: string, time: string) => `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;

/** Google Calendar template link. `ctz` pins the times to the studio's zone. */
export function googleCalendarUrl(b: Slot, room: Named): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${room.name} at ${SITE.name}`,
    dates: `${compact(b.date, b.startTime)}/${compact(b.date, b.endTime)}`,
    details: `Reference ${b.id}`,
    ctz: SITE.timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Outlook web compose link. UTC instants, since the link has no zone parameter. */
export function outlookCalendarUrl(b: Slot, room: Named): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: `${room.name} at ${SITE.name}`,
    startdt: zonedToUtc(b.date, b.startTime, SITE.timeZone).toISOString().replace(".000", ""),
    enddt: zonedToUtc(b.date, b.endTime, SITE.timeZone).toISOString().replace(".000", ""),
    body: `Reference ${b.id}`,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}
