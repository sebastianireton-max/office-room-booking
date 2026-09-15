"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDateShort, formatUsd, nowInZone, priceCents, shortTime } from "@/lib/format";
import { ROOM_TYPE_LABELS, type Room, type RoomType } from "@/types/domain";

const DURATIONS = [60, 120, 180];
const MAX_TIMES = 4;

/**
 * The homepage's one working surface: every room, its specs, its price for the
 * chosen length, and its real open times for the chosen day.
 */
export function RoomBoard({ rooms, timeZone }: { rooms: Room[]; timeZone: string }) {
  // "Today" is read after mount: the page is prerendered, so reading it during
  // render would freeze the build date into the HTML.
  const [today, setToday] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState<RoomType | "all">("all");
  const [open, setOpen] = useState<Record<string, string[]> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const now = nowInZone(timeZone).date;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client clock is only known after mount
    setToday(now);
    setDate(now);
  }, [timeZone]);

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new query clears stale times
    setOpen(null);
    setError(false);
    fetch(`/api/availability/day?date=${date}&durationMinutes=${duration}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((d: { rooms: { roomId: string; open: string[] }[] }) =>
        setOpen(Object.fromEntries(d.rooms.map((r) => [r.roomId, r.open])))
      )
      .catch((e) => e?.name !== "AbortError" && setError(true));
    return () => controller.abort();
  }, [date, duration]);

  const shown = rooms.filter((r) => type === "all" || r.type === type);
  const types = Object.keys(ROOM_TYPE_LABELS) as RoomType[];
  const control = "min-h-11 rounded-token-sm border border-border-default bg-surface px-3 text-text-primary";
  const withTimes = open ? shown.filter((r) => open[r.id]?.length).length : 0;

  return (
    <div className="flex flex-col">
      <div className="-mx-3 flex flex-col gap-3 rounded-token-md border border-border-subtle bg-canvas/95 p-3 backdrop-blur-md sm:mx-0 md:sticky md:top-[5.25rem] md:z-30 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-2 gap-3 md:flex md:items-end">
          <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
            Day
            <input
              type="date"
              min={today ?? undefined}
              value={date ?? ""}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className={control}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
            Length
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={control}>
              {DURATIONS.map((m) => (
                <option key={m} value={m}>
                  {m / 60} hour{m > 60 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div role="group" aria-label="Room type" className="flex gap-1 sm:gap-1.5">
          {(["all", ...types] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={`min-h-11 min-w-11 whitespace-nowrap rounded-token-full px-2.5 text-sm font-medium transition-colors sm:px-4 ${
                type === t ? "bg-inverse text-on-inverse-strong" : "text-text-primary hover:bg-surface-raised"
              }`}
            >
              {t === "all" ? "All" : ROOM_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <p role="status" className="sr-only">
        {open && date ? `${shown.length} rooms, ${withTimes} with open times on ${formatDateShort(date)}` : ""}
      </p>
      {error && (
        <p role="alert" className="py-6 text-error">
          Couldn’t load open times. Change the date or refresh to try again.
        </p>
      )}

      <ul className="mt-4 flex flex-col" aria-busy={!open && !error}>
        {shown.map((room, i) => {
          const times = open?.[room.id];
          return (
            <li key={room.id} className="enter border-b border-border-subtle" style={{ "--i": i } as React.CSSProperties}>
              <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 py-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-8 lg:grid-cols-[13rem_minmax(0,1fr)_auto]">
                <Link
                  href={`/rooms/${room.id}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="aspect-[4/3] self-start rounded-token-sm bg-surface p-2"
                >
                  <span className="relative block h-full w-full">
                    <Image src={`/rooms/art/${room.id}.webp`} alt="" fill sizes="(max-width: 640px) 104px, 208px" className="object-contain" />
                  </span>
                </Link>

                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="text-sm text-text-secondary">
                    {ROOM_TYPE_LABELS[room.type]} · {room.capacity} people · {room.sqft} sq ft
                  </p>
                  <h3 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
                    <Link href={`/rooms/${room.id}`} className="text-text-primary hover:text-text-accent">
                      {room.name}
                    </Link>
                  </h3>
                  <p className="line-clamp-1 text-text-secondary sm:line-clamp-none">{room.tagline}</p>
                  <p className="text-text-secondary">
                    <span className="tabular text-lg font-semibold text-text-primary">
                      {formatUsd(priceCents(room.hourlyRateCents, duration))}
                    </span>{" "}
                    for {duration / 60} hour{duration > 60 ? "s" : ""}
                  </p>
                </div>

                <div className="col-span-2 flex flex-col gap-2 lg:col-span-1 lg:w-[27rem]">
                  <p className="text-sm text-text-secondary">Open start times</p>
                  {!times && !error && <div className="h-11 animate-pulse rounded-token-sm bg-surface-raised motion-reduce:animate-none" />}
                  {times && times.length === 0 && <p className="text-sm text-text-primary">No open times this day. Try another date.</p>}
                  {times && times.length > 0 && (
                    <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-center gap-2 lg:grid-cols-[repeat(4,5rem)_auto] lg:justify-start">
                      {times.slice(0, MAX_TIMES).map((t) => (
                        <Link
                          key={t}
                          href={`/rooms/${room.id}?date=${date}&start=${t}&duration=${duration}#book`}
                          className="tabular inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-token-sm border border-border-default bg-surface-raised px-2 text-sm font-medium text-text-primary transition-colors hover:border-border-accent"
                        >
                          {shortTime(t)}
                        </Link>
                      ))}
                      {times.length > MAX_TIMES && (
                        <Link
                          href={`/rooms/${room.id}?date=${date}&duration=${duration}#book`}
                          className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-sm font-medium text-text-accent hover:underline"
                        >
                          +{times.length - MAX_TIMES} more
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
