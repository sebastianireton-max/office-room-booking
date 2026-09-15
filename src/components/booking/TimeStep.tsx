"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BOOKING_CONFIG } from "@/types/domain";
import { addDaysIso, formatDateShort, formatUsd, priceCents, shortTime, zoneAbbrev, zoneLabel } from "@/lib/format";
import { SITE } from "@/lib/site-config";
import type { Room, TimeSlot } from "@/types/domain";

export const DURATIONS = [60, 120, 180];

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Radio chip: a native radio in a label, so arrow keys and roving focus come
 * free. Selection is a heavier teal outline and teal text, never a fill, so the
 * page's one filled accent stays the primary action. teal-700 on the sheet is
 * 7.28:1; the unselected border (#8b8175) is 3.67:1 as a non-text edge. The
 * invisible radio covers the whole chip, so the chip is its tap target. */
const radioInput = "absolute -inset-px m-0 cursor-pointer appearance-none opacity-0";
const chipClass = (checked: boolean) =>
  `relative cursor-pointer rounded-token-sm border has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border-accent transition-[border-color,color,transform] active:scale-[0.98] motion-reduce:active:scale-100 ${
    checked
      ? "border-accent bg-surface font-semibold text-text-accent ring-1 ring-inset ring-accent"
      : "border-border-default bg-surface text-text-primary hover:border-border-accent"
  }`;

interface Props {
  room: Room;
  today: string;
  date: string;
  onDate: (date: string) => void;
  durationMinutes: number;
  onDuration: (minutes: number) => void;
  selectedStart: string | null;
  onSelect: (start: string) => void;
  /** Bumped after a 409 so both lists refetch. */
  refreshKey: number;
  /** This visitor's own live hold on this date and length still counts as open to them. */
  heldStart: string | null;
  notice: string | null;
  onSlotsLoaded: (slots: TimeSlot[]) => void;
}

export function TimeStep(p: Props) {
  const ids = useId();
  const maxDate = addDaysIso(p.today, BOOKING_CONFIG.maxAdvanceDays);
  const weekStart = addDaysIso(p.today, Math.floor(daysBetween(p.today, p.date) / 7) * 7);
  const weekLength = Math.min(7, daysBetween(weekStart, maxDate) + 1);
  const weekDates = Array.from({ length: weekLength }, (_, i) => addDaysIso(weekStart, i));
  const nextWeek = addDaysIso(weekStart, 7);
  const canNext = nextWeek <= maxDate;

  const [week, setWeek] = useState<{ key: string; counts: Record<string, number> } | null>(null);
  const [slotsState, setSlotsState] = useState<{ key: string; slots: TimeSlot[] | null; error: false | "busy" | "failed" } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [retry, setRetry] = useState(0);
  const dateGroupRef = useRef<HTMLDivElement>(null);
  const focusDate = useRef(false);

  const weekKey = `${p.room.id}|${weekStart}|${p.durationMinutes}|${p.refreshKey}|${retry}`;
  const slotsKey = `${p.room.id}|${p.date}|${p.durationMinutes}|${p.refreshKey}|${retry}`;

  // "Next available" and "Try the next week" unmount themselves; keep keyboard focus on the new date.
  const jumpTo = (d: string) => {
    focusDate.current = true;
    p.onDate(d);
  };
  useEffect(() => {
    if (!focusDate.current) return;
    focusDate.current = false;
    dateGroupRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
  }, [p.date]);
  const { onSlotsLoaded } = p;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/availability/week?roomId=${p.room.id}&from=${weekStart}&days=${weekLength}&durationMinutes=${p.durationMinutes}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((data: { days: { date: string; openCount: number }[] }) =>
        setWeek({ key: weekKey, counts: Object.fromEntries(data.days.map((d) => [d.date, d.openCount])) })
      )
      .catch(() => {}); // Counts are a hint; the day's own list below is authoritative.
    return () => controller.abort();
  }, [weekKey, p.room.id, weekStart, weekLength, p.durationMinutes]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/availability?roomId=${p.room.id}&date=${p.date}&durationMinutes=${p.durationMinutes}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status === 429 ? "busy" : "failed"))))
      .then((data: { slots: TimeSlot[] }) => {
        setSlotsState({ key: slotsKey, slots: data.slots, error: false });
        onSlotsLoaded(data.slots);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setSlotsState({ key: slotsKey, slots: null, error: err.message === "busy" ? "busy" : "failed" });
      });
    return () => controller.abort();
  }, [slotsKey, p.room.id, p.date, p.durationMinutes, onSlotsLoaded]);

  const counts = week?.key === weekKey ? week.counts : null;
  const current = slotsState?.key === slotsKey ? slotsState : null;
  const isOpen = (s: TimeSlot) => s.available || s.startTime === p.heldStart;
  const open = current?.slots?.filter(isOpen) ?? [];
  const closedReasons = current?.slots?.filter((s) => !isOpen(s)) ?? [];
  const tooSoon = closedReasons.some((s) => s.unavailableReason === "too-soon") && p.date === p.today;
  const booked = closedReasons.filter((s) => s.unavailableReason === "booked").length;
  const blocked = closedReasons.filter((s) => s.unavailableReason === "closed").length;
  const reasons = [
    tooSoon && `Earlier times today need ${BOOKING_CONFIG.minBookingNoticeHours} hours' notice.`,
    booked > 0 && `${plural(booked, "time")} already booked.`,
    blocked > 0 && `${plural(blocked, "time")} closed.`,
  ].filter(Boolean);

  const nextOpenDay = counts ? weekDates.find((d) => d > p.date && counts[d] > 0) : undefined;
  const groups = [
    { label: "Morning", times: open.filter((s) => Number(s.startTime.slice(0, 2)) < 12) },
    { label: "Afternoon", times: open.filter((s) => Number(s.startTime.slice(0, 2)) >= 12 && Number(s.startTime.slice(0, 2)) < 17) },
    { label: "Evening", times: open.filter((s) => Number(s.startTime.slice(0, 2)) >= 17) },
  ].filter((g) => g.times.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span id={`${ids}-length`} className="text-sm font-medium text-text-primary">
          Length
        </span>
        <div role="radiogroup" aria-labelledby={`${ids}-length`} className="grid grid-cols-3 gap-2">
          {DURATIONS.map((m) => {
            const checked = p.durationMinutes === m;
            const total = formatUsd(priceCents(p.room.hourlyRateCents, m));
            return (
              <label key={m} className={`flex min-h-12 flex-col items-center justify-center px-2 py-1.5 ${chipClass(checked)}`}>
                <input
                  type="radio"
                  name={`${ids}-length-radio`}
                  className={radioInput}
                  checked={checked}
                  onChange={() => p.onDuration(m)}
                  aria-label={`${plural(m / 60, "hour")}, ${total}`}
                />
                <span className="text-sm">{m / 60}h</span>
                <span className={`tabular text-xs ${checked ? "text-text-accent" : "text-text-secondary"}`}>{total}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span id={`${ids}-date`} className="text-sm font-medium text-text-primary">
            Date
          </span>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => p.onDate(addDaysIso(weekStart, -7))}
              disabled={weekStart === p.today}
              aria-label="Previous week"
              className="inline-flex h-11 w-11 items-center justify-center rounded-token-full text-lg text-text-primary hover:bg-surface-raised disabled:cursor-not-allowed disabled:text-text-secondary disabled:hover:bg-transparent"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => p.onDate(nextWeek)}
              disabled={!canNext}
              aria-label="Next week"
              className="inline-flex h-11 w-11 items-center justify-center rounded-token-full text-lg text-text-primary hover:bg-surface-raised disabled:cursor-not-allowed disabled:text-text-secondary disabled:hover:bg-transparent"
            >
              ›
            </button>
          </div>
        </div>
        <div
          ref={dateGroupRef}
          role="radiogroup"
          aria-labelledby={`${ids}-date`}
          className="-mx-3 grid grid-cols-7 gap-0.5 sm:mx-0 sm:gap-1.5"
        >
          {weekDates.map((d) => {
            const checked = d === p.date;
            const n = counts?.[d];
            const at = new Date(`${d}T12:00:00Z`);
            const long = at.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });
            return (
              <label key={d} className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 px-0 py-1.5 ${chipClass(checked)}`}>
                <input
                  type="radio"
                  name={`${ids}-date-radio`}
                  className={radioInput}
                  checked={checked}
                  onChange={() => p.onDate(d)}
                  aria-label={n === undefined ? long : `${long}, ${n === 0 ? "no open times" : plural(n, "open time")}`}
                />
                <span className="text-xs">{at.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short" })}</span>
                <span className="tabular text-base leading-none">{at.getUTCDate()}</span>
                <span className={`whitespace-nowrap text-[11px] leading-tight ${checked ? "text-text-accent" : "text-text-secondary"}`}>
                  {n === undefined ? " " : n === 0 ? "None" : `${n} open`}
                </span>
              </label>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <p className="text-sm text-text-secondary">
            Times in {zoneLabel(SITE.timeZone)} ({zoneAbbrev(SITE.timeZone, p.date)})
          </p>
          <button
            type="button"
            aria-expanded={showPicker}
            onClick={() => setShowPicker((v) => !v)}
            className="inline-flex min-h-11 items-center text-sm font-medium text-text-accent hover:underline"
          >
            Pick a date
          </button>
        </div>
        {showPicker && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="booking-date" className="text-sm font-medium text-text-primary">
              Any date up to {formatDateShort(maxDate)}
            </label>
            <input
              id="booking-date"
              type="date"
              min={p.today}
              max={maxDate}
              value={p.date}
              onChange={(e) => e.target.value >= p.today && e.target.value <= maxDate && p.onDate(e.target.value)}
              className="min-h-11 rounded-token-sm border border-border-default bg-surface px-3.5 py-2.5 text-text-primary"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span id={`${ids}-time`} className="text-sm font-medium text-text-primary">
          Start time on {formatDateShort(p.date)}
        </span>
        {p.notice && (
          <p role="alert" className="text-sm text-error">
            {p.notice}
          </p>
        )}
        {!current && <p className="text-sm text-text-secondary">Checking open times…</p>}
        {current?.error && (
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm text-error">
              {current.error === "busy"
                ? "Too many lookups in a short time. Wait a moment, then try again."
                : "Couldn't load open times. Check your connection and try again."}
            </p>
            <button type="button" onClick={() => setRetry((n) => n + 1)} className="inline-flex min-h-11 items-center text-sm font-medium text-text-accent hover:underline">
              Try again
            </button>
          </div>
        )}
        {current?.slots && open.length === 0 && (
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm text-text-primary">Nothing open on {formatDateShort(p.date)}.</p>
            {nextOpenDay ? (
              <button type="button" onClick={() => jumpTo(nextOpenDay)} className="inline-flex min-h-11 items-center text-sm font-medium text-text-accent hover:underline">
                Next available: {formatDateShort(nextOpenDay)}
              </button>
            ) : (
              canNext &&
              counts && (
                <button type="button" onClick={() => jumpTo(nextWeek)} className="inline-flex min-h-11 items-center text-sm font-medium text-text-accent hover:underline">
                  Try the next week
                </button>
              )
            )}
          </div>
        )}
        {groups.length > 0 && (
          <div role="radiogroup" aria-labelledby={`${ids}-time`} className="flex flex-col gap-4">
            {groups.map((g) => (
              <div key={g.label} className="flex flex-col gap-2">
                <p className="text-xs text-text-secondary">{g.label}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {g.times.map((s) => {
                    const checked = s.startTime === p.selectedStart;
                    return (
                      <label
                        key={s.startTime}
                        className={`tabular flex min-h-11 items-center justify-center whitespace-nowrap px-2 text-sm ${chipClass(checked)}`}
                      >
                        <input
                          type="radio"
                          name={`${ids}-time-radio`}
                          className={radioInput}
                          checked={checked}
                          onChange={() => p.onSelect(s.startTime)}
                        />
                        {shortTime(s.startTime)}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {current?.slots && reasons.length > 0 && <p className="text-sm text-text-secondary">{reasons.join(" ")}</p>}
      </div>
    </div>
  );
}
