"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTime12h, formatUsd, nowInZone } from "@/lib/format";
import { ROOM_TYPE_LABELS, type Room, type RoomType } from "@/types/domain";

const DURATIONS = [60, 120, 180];
const MAX_TIMES = 3;

/**
 * "When can I get in?" answered for every room at once. The old homepage made
 * a visitor open six room pages to learn the same thing.
 */
export function AvailabilityFinder({ rooms, timeZone }: { rooms: Room[]; timeZone: string }) {
  const today = nowInZone(timeZone).date;
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState<RoomType | "all">("all");
  const [open, setOpen] = useState<Record<string, string[]> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the query changes
    setOpen(null);
    setError(false);
    fetch(`/api/availability/day?date=${date}&durationMinutes=${duration}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { rooms: { roomId: string; open: string[] }[] }) =>
        setOpen(Object.fromEntries(d.rooms.map((r) => [r.roomId, r.open])))
      )
      .catch((e) => e?.name !== "AbortError" && setError(true));
    return () => controller.abort();
  }, [date, duration]);

  const shown = rooms.filter((r) => type === "all" || r.type === type);
  const types = Object.keys(ROOM_TYPE_LABELS) as RoomType[];

  return (
    <div className="flex flex-col gap-5 rounded-token-lg border border-border-subtle bg-surface p-5 shadow-[var(--shadow-medium)] sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-text-primary">Find an open room</h2>
        <span className="tabular text-xs text-text-secondary">Live availability</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Date
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="min-h-11 rounded-token-sm border border-border-default bg-surface-raised px-3 text-text-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Length
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="min-h-11 rounded-token-sm border border-border-default bg-surface-raised px-3 text-text-primary"
          >
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                {m / 60} hour{m > 60 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div role="group" aria-label="Room type" className="flex flex-wrap gap-2">
        {(["all", ...types] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => setType(t)}
            className={`min-h-11 rounded-token-full border px-4 text-sm font-medium transition-colors ${
              type === t
                ? "border-accent bg-accent text-on-accent"
                : "border-border-default bg-surface text-text-primary hover:border-border-accent"
            }`}
          >
            {t === "all" ? "All rooms" : ROOM_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <ul className="flex flex-col divide-y divide-border-subtle border-t border-border-subtle" aria-live="polite" aria-busy={!open && !error}>
        {error && <li className="py-4 text-sm text-error">Could not load availability. Refresh to try again.</li>}
        {shown.map((room) => {
          const times = open?.[room.id];
          return (
            <li key={room.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <Link href={`/rooms/${room.id}`} className="font-semibold text-text-primary hover:text-text-accent">
                  {room.name}
                </Link>
                <span className="tabular text-sm text-text-secondary">
                  {formatUsd(room.hourlyRateCents * (duration / 60))} · {room.capacity} ppl
                </span>
              </div>
              {!times && !error && <div className="h-9 animate-pulse rounded-token-sm bg-surface-raised motion-reduce:animate-none" />}
              {times && times.length === 0 && <p className="text-sm text-text-secondary">Fully booked or closed this day.</p>}
              {times && times.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {times.slice(0, MAX_TIMES).map((t) => (
                    <Link
                      key={t}
                      href={`/rooms/${room.id}?date=${date}&start=${t}&duration=${duration}#book`}
                      className="tabular inline-flex min-h-11 items-center rounded-token-sm border border-border-default bg-surface-raised px-3 text-sm text-text-primary transition-colors hover:border-accent hover:bg-accent hover:text-on-accent"
                    >
                      {formatTime12h(t)}
                    </Link>
                  ))}
                  {times.length > MAX_TIMES && (
                    <Link href={`/rooms/${room.id}?date=${date}&duration=${duration}#book`} className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-text-accent hover:underline">
                      +{times.length - MAX_TIMES} more
                    </Link>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
