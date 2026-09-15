import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listBookings } from "@/lib/db/bookings-repository";
import { ROOMS, getRoomById } from "@/lib/rooms-data";
import { formatTime12h, formatUsd } from "@/lib/format";
import { buttonClass } from "@/components/Button";
import { Flash, StatusPill, inputClass } from "../ui";
import { STATUSES, filtersQuery, parseBookingFilters } from "../filters";

export const metadata = { title: "Bookings" };

export default async function AdminBookings(props: PageProps<"/admin/bookings">) {
  await requireAdmin("/admin/bookings");
  const sp = await props.searchParams;
  const filters = parseBookingFilters((k) => sp[k]);
  const bookings = listBookings(filters);
  const query = filtersQuery(filters);

  return (
    <div className="flex flex-col gap-6">
      <Flash sp={sp} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold text-text-primary">Bookings</h1>
        <a href={`/admin/bookings/export?${query}`} className="text-sm font-medium text-text-accent hover:underline">
          Download CSV
        </a>
      </div>

      <form className="grid grid-cols-2 gap-3 rounded-token-md bg-surface p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
        <input name="q" defaultValue={filters.q} placeholder="Name, email or reference" aria-label="Search" className={`${inputClass} col-span-2 md:col-span-1`} />
        <select name="status" defaultValue={filters.status ?? ""} aria-label="Status" className={inputClass}>
          <option value="">Any status</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="room" defaultValue={filters.roomId ?? ""} aria-label="Room" className={inputClass}>
          <option value="">Any room</option>
          {ROOMS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input type="date" name="from" defaultValue={filters.from} aria-label="From date" className={inputClass} />
        <input type="date" name="to" defaultValue={filters.to} aria-label="To date" className={inputClass} />
        <button className={buttonClass()}>Filter</button>
      </form>

      <p className="text-sm text-text-secondary">
        {bookings.length === 200 ? "Showing the latest 200. Narrow the filters to see more." : `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
      </p>

      <div className="overflow-x-auto rounded-token-md border border-border-subtle">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead className="bg-surface text-left text-text-secondary">
            <tr>
              {["When", "Room", "Customer", "Total", "Status"].map((h) => (
                <th key={h} className="border-b border-border-subtle p-3 font-medium">{h}</th>
              ))}
              {/* relative: an absolute sr-only span would otherwise escape the scroll box and widen the page. */}
              <th className="relative border-b border-border-subtle p-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-border-subtle last:border-0 hover:bg-surface">
                <td className="tabular p-3 text-text-primary">
                  {b.date}
                  <br />
                  <span className="text-text-secondary">{formatTime12h(b.startTime)} to {formatTime12h(b.endTime)}</span>
                </td>
                <td className="p-3 text-text-primary">{getRoomById(b.roomId)?.name ?? b.roomId}</td>
                <td className="p-3">
                  <span className="text-text-primary">{b.customerName}</span>
                  <br />
                  <span className="text-text-secondary">{b.customerEmail}</span>
                </td>
                <td className="tabular p-3 text-text-primary">{formatUsd(b.priceCents)}</td>
                <td className="p-3"><StatusPill status={b.status} issue={b.paymentIssue} /></td>
                <td className="p-3 text-right">
                  <Link href={`/admin/bookings/${b.id}`} className="inline-flex min-h-11 items-center font-medium text-text-accent hover:underline">Open</Link>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-text-secondary">No bookings match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
