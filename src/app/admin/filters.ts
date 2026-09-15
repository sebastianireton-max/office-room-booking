import type { BookingFilters } from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";

/** One name for a paid-after-the-hold-lapsed booking, on every admin surface. */
export const ISSUE_LABEL = "Charged, not booked";

export const STATUSES: [NonNullable<BookingFilters["status"]>, string][] = [
  ["confirmed", "Confirmed"],
  ["pending_payment", "Awaiting payment"],
  ["cancelled", "Cancelled"],
  ["expired", "Expired"],
  ["issue", ISSUE_LABEL],
];

const isoDate = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

/** Shared by the list page and the CSV export so both apply the same validation. Unknown values are ignored. */
export function parseBookingFilters(get: (key: string) => string | string[] | null | undefined): BookingFilters {
  const str = (key: string) => {
    const v = get(key);
    return typeof v === "string" && v ? v : undefined;
  };
  const status = STATUSES.find(([s]) => s === str("status"))?.[0];
  const room = str("room");
  return {
    status,
    roomId: room && getRoomById(room) ? room : undefined,
    from: isoDate(str("from")),
    to: isoDate(str("to")),
    q: str("q")?.slice(0, 100),
  };
}

/** Filters back to the list's query-string keys (room, not roomId). */
export function filtersQuery(f: BookingFilters): string {
  const entries = Object.entries({ q: f.q, status: f.status, room: f.roomId, from: f.from, to: f.to });
  return new URLSearchParams(entries.filter((e): e is [string, string] => Boolean(e[1]))).toString();
}
