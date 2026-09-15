import { BOOKING_CONFIG } from "@/types/domain";

export function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function formatUsdPerHour(cents: number): string {
  return `${formatUsd(cents)}/hr`;
}

/** "2026-08-20" -> "Thursday, August 20, 2026" */
export function formatDateLong(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

/** "14:00" -> "2:00 PM" */
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * Wall-clock date and minutes-past-midnight in the studio's own time zone.
 * The old version mixed the UTC date with the server's local hours, so the
 * "same-day notice" rule fired on the wrong day for part of every evening.
 */
export function nowInZone(timeZone: string, at = new Date()): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** "2026-09-13" + n days, calendar arithmetic only (no time zone involved). */
export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "18:00" -> "6 PM", "18:30" -> "6:30 PM" */
export function shortTime(hhmm: string): string {
  return formatTime12h(hhmm).replace(":00 ", " ");
}

/** ("19:00", "21:00") -> "7:00 – 9:00 PM"; the first period is dropped when both share it. */
export function timeRange(start: string, end: string): string {
  const a = formatTime12h(start);
  const b = formatTime12h(end);
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
}

export function priceCents(hourlyRateCents: number, minutes: number): number {
  return Math.round((hourlyRateCents * minutes) / 60);
}

/** Every bookable start hour, e.g. [8, 9, ... 21]. */
export function operatingHours(): number[] {
  const { operatingStartHour: from, operatingEndHour: to } = BOOKING_CONFIG;
  return Array.from({ length: to - from }, (_, i) => from + i);
}

/** "America/New_York" -> "New York time" */
export function zoneLabel(timeZone: string): string {
  return `${timeZone.split("/").pop()!.replace(/_/g, " ")} time`;
}

/** ("America/New_York", "2026-09-15") -> "EDT". Takes the date so DST is right. */
export function zoneAbbrev(timeZone: string, date: string | Date = new Date()): string {
  const at = typeof date === "string" ? new Date(`${date}T12:00:00Z`) : date;
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? timeZone;
}

/** "2026-09-15" -> "Tue, Sep 15" */
export function formatDateShort(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
