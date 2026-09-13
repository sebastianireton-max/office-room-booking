import { requireAdmin } from "@/lib/auth/require";
import { listBlocks } from "@/lib/db/bookings-repository";
import { ROOMS, getRoomById } from "@/lib/rooms-data";
import { SITE } from "@/lib/site-config";
import { formatDateLong, formatTime12h, nowInZone } from "@/lib/format";
import { BOOKING_CONFIG } from "@/types/domain";
import { createBlockAction, deleteBlockAction } from "../actions";
import { Flash, inputClass, primaryButton } from "../ui";

export const metadata = { title: "Block-outs" };

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

export default async function AdminBlocks(props: PageProps<"/admin/blocks">) {
  await requireAdmin("/admin/blocks");
  const sp = await props.searchParams;
  const today = nowInZone(SITE.timeZone).date;
  const blocks = listBlocks(today);
  const hours = Array.from({ length: BOOKING_CONFIG.operatingEndHour - BOOKING_CONFIG.operatingStartHour + 1 }, (_, i) => BOOKING_CONFIG.operatingStartHour + i);

  return (
    <div className="flex flex-col gap-8">
      <Flash sp={sp} />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold text-text-primary">Block-outs</h1>
        <p className="max-w-2xl text-text-secondary">
          Close a room, or every room, for maintenance, a private event or a holiday. Blocked times stop showing as bookable.
          Existing bookings inside the window are kept, and you&apos;ll be told about them.
        </p>
      </div>

      <form action={createBlockAction} className="grid grid-cols-2 gap-3 rounded-token-md bg-surface p-5 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1.5fr_auto] md:items-end">
        <label className="col-span-2 flex flex-col gap-1.5 text-sm font-medium text-text-primary md:col-span-1">
          Room
          <select name="roomId" className={inputClass} defaultValue="all">
            <option value="all">Every room</option>
            {ROOMS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1.5 text-sm font-medium text-text-primary md:col-span-1">
          Date
          <input type="date" name="date" min={today} defaultValue={today} required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          From
          <select name="startTime" className={inputClass} defaultValue={hh(BOOKING_CONFIG.operatingStartHour)}>
            {hours.slice(0, -1).map((h) => <option key={h} value={hh(h)}>{formatTime12h(hh(h))}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Until
          <select name="endTime" className={inputClass} defaultValue={hh(BOOKING_CONFIG.operatingEndHour)}>
            {hours.slice(1).map((h) => <option key={h} value={hh(h)}>{formatTime12h(hh(h))}</option>)}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1.5 text-sm font-medium text-text-primary md:col-span-1">
          Reason (staff only)
          <input name="reason" required maxLength={200} placeholder="e.g. Lighting repair" className={inputClass} />
        </label>
        <button className={`${primaryButton} col-span-2 md:col-span-1`}>Block</button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-text-primary">Upcoming</h2>
        {blocks.length === 0 ? (
          <p className="text-text-secondary">No block-outs scheduled.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
            {blocks.map((bl) => (
              <li key={bl.id} className="flex flex-wrap items-center justify-between gap-4 py-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-text-primary">
                    {bl.roomId ? getRoomById(bl.roomId)?.name : "Every room"} · {formatDateLong(bl.date)}, {formatTime12h(bl.startTime)} to{" "}
                    {formatTime12h(bl.endTime)}
                  </span>
                  <span className="text-text-secondary">{bl.reason} · added by {bl.createdBy}</span>
                </div>
                <form action={deleteBlockAction}>
                  <input type="hidden" name="id" value={bl.id} />
                  <button className="inline-flex min-h-11 items-center px-2 font-medium text-error underline underline-offset-4">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
