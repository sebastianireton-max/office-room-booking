"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StepIndicator } from "@/components/StepIndicator";
import { InputField } from "@/components/InputField";
import { Button } from "@/components/Button";
import { PaymentStep } from "./PaymentStep";
import { DURATIONS, TimeStep } from "./TimeStep";
import { BOOKING_CONFIG } from "@/types/domain";
import { addDaysIso, formatDateLong, formatDateShort, formatUsd, nowInZone, priceCents, shortTime, timeRange, zoneAbbrev } from "@/lib/format";
import { SITE } from "@/lib/site-config";
import type { PublicBooking } from "@/lib/public-booking";
import type { Room, TimeSlot } from "@/types/domain";

/*
 * SECURITY-RELEVANT (payment flow, guardrail 2): this component only renders
 * and routes. Price, hold and confirmation truth all live on the server; the
 * figures shown here are previews until the hold returns the booking.
 */

const STEPS = [{ label: "Time" }, { label: "Details" }, { label: "Review & pay" }];
const ENDING_SOON_MS = 2 * 60_000;

interface Details {
  name: string;
  email: string;
  phone: string;
}

const addMinutes = (hhmm: string, minutes: number) => {
  const total = Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5)) + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
const hoursLabel = (minutes: number) => `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
const clockInZone = (iso: string) =>
  `${new Date(iso).toLocaleTimeString("en-US", { timeZone: SITE.timeZone, hour: "numeric", minute: "2-digit" })} ${zoneAbbrev(SITE.timeZone, new Date(iso))}`;

export function BookingFlow({ room }: { room: Room }) {
  const params = useSearchParams();
  const today = nowInZone(SITE.timeZone).date;
  const maxDate = addDaysIso(today, BOOKING_CONFIG.maxAdvanceDays);
  const paramDate = params.get("date");
  const paramDuration = Number(params.get("duration"));
  // A time picked on the homepage board arrives as ?date=&start=&duration=.
  const pendingStart = useRef(/^\d{2}:00$/.test(params.get("start") ?? "") ? params.get("start") : null);

  const [stepIndex, setStepIndex] = useState(0);
  const [date, setDate] = useState(paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate) && paramDate >= today && paramDate <= maxDate ? paramDate : today);
  const [durationMinutes, setDurationMinutes] = useState(DURATIONS.includes(paramDuration) ? paramDuration : 60);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);

  const [form, setForm] = useState<Details>({ name: "", email: "", phone: "" });
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Details>>({});
  const [creatingHold, setCreatingHold] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [heldDetails, setHeldDetails] = useState<Details | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [now, setNow] = useState(0);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusStep = useRef(false);
  const focusInvalid = useRef(false);

  // Signed-in customers get their Google name and email filled in.
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user: { name: string; email: string } | null } | null) => {
        if (!d?.user) return;
        setSignedInAs(d.user.email);
        setForm((f) => ({ name: f.name || d.user!.name, email: f.email || d.user!.email, phone: f.phone }));
      })
      .catch(() => {});
  }, []);

  // After a user-driven step change, move focus into the new step and keep it clear of the sticky header.
  useEffect(() => {
    if (!focusStep.current) return;
    focusStep.current = false;
    const target = panelRef.current?.querySelector<HTMLElement>("[data-step-focus]") ?? headingRef.current;
    target?.scrollIntoView({ block: "center" });
    target?.focus({ preventScroll: true });
  }, [stepIndex]);

  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [formErrors]);

  const expiresAt = stepIndex === 2 ? booking?.holdExpiresAt : null;
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const onSlotsLoaded = useCallback((slots: TimeSlot[]) => {
    const wanted = pendingStart.current;
    if (!wanted) return;
    pendingStart.current = null;
    if (slots.some((s) => s.startTime === wanted && s.available)) {
      setSelectedStart(wanted);
      setStepIndex(1); // No focus move: this is page load, not a user action.
    } else {
      setSlotNotice(`${shortTime(wanted)} is no longer open. Pick another time.`);
    }
  }, []);

  function goTo(step: number) {
    focusStep.current = true;
    setStepIndex(step);
  }

  function backToTimes(notice: string | null) {
    setSelectedStart(null);
    setSlotNotice(notice);
    setRefreshKey((k) => k + 1);
    goTo(0);
  }

  const endTime = selectedStart ? addMinutes(selectedStart, durationMinutes) : null;
  const total = priceCents(room.hourlyRateCents, durationMinutes);
  const selectionText = selectedStart && endTime ? `${formatDateShort(date)} · ${timeRange(selectedStart, endTime)}` : null;
  const holdMs = booking?.holdExpiresAt && now ? Date.parse(booking.holdExpiresAt) - now : null;
  const holdEnded = holdMs !== null && holdMs <= 0;
  const holdEndingSoon = holdMs !== null && holdMs > 0 && holdMs < ENDING_SOON_MS;
  // The visitor's own unexpired hold should still look open to them when they come back to change something.
  const heldStart =
    booking && !holdEnded && booking.date === date && booking.durationMinutes === durationMinutes ? booking.startTime : null;

  async function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedStart || creatingHold) return;
    const details = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() };
    const errors: Partial<Details> = {};
    if (!details.name) errors.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email)) errors.email = "Enter an email like name@example.com.";
    setHoldError(null);
    focusInvalid.current = Object.keys(errors).length > 0;
    setFormErrors(errors);
    if (focusInvalid.current) return;

    const sameSlot =
      booking &&
      booking.holdExpiresAt &&
      Date.parse(booking.holdExpiresAt) > Date.now() &&
      booking.date === date &&
      booking.startTime === selectedStart &&
      booking.durationMinutes === durationMinutes;
    if (sameSlot && heldDetails && JSON.stringify(heldDetails) === JSON.stringify(details)) {
      goTo(2);
      if (!clientSecret && !creatingIntent) void createPaymentIntent(booking.id);
      return;
    }
    if (sameSlot) {
      // The server would refuse a second hold on a slot this visitor already holds.
      setHoldError(`This time is held for you with your earlier details until ${clockInZone(booking.holdExpiresAt!)}. Use those details, or pick a different time.`);
      return;
    }

    setCreatingHold(true);
    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          date,
          startTime: selectedStart,
          durationMinutes,
          customerName: details.name,
          customerEmail: details.email,
          customerPhone: details.phone || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBooking(data.booking);
        setHeldDetails(details);
        setClientSecret(null);
        goTo(2);
        await createPaymentIntent(data.booking.id);
      } else if (res.status === 400 && data.fieldErrors) {
        focusInvalid.current = true;
        setFormErrors({ name: data.fieldErrors.customerName, email: data.fieldErrors.customerEmail, phone: data.fieldErrors.customerPhone });
      } else if (res.status === 409 || res.status === 400) {
        backToTimes(data.error ?? "That time is no longer open. Pick another time.");
      } else {
        setHoldError(data.error ?? "Something went wrong saving your booking. You have not been charged. Please try again.");
      }
    } catch {
      setHoldError("Something went wrong saving your booking. You have not been charged. Please try again.");
    } finally {
      setCreatingHold(false);
    }
  }

  async function createPaymentIntent(bookingId: string) {
    setCreatingIntent(true);
    setIntentError(null);
    try {
      const res = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.clientSecret) {
        setIntentError(data.error ?? "Payment couldn't start. Try again, or go back and pick another time.");
        return;
      }
      setClientSecret(data.clientSecret);
      // Starting payment extends the hold on the server; show that deadline, not the original one.
      if (data.holdExpiresAt) setBooking((b) => (b && b.id === bookingId ? { ...b, holdExpiresAt: data.holdExpiresAt } : b));
    } catch {
      setIntentError("Payment couldn't start. Check your connection and try again.");
    } finally {
      setCreatingIntent(false);
    }
  }

  function leaveEndedHold() {
    setBooking(null);
    setHeldDetails(null);
    setClientSecret(null);
    setIntentError(null);
    backToTimes(null);
  }

  const summary = selectionText && (
    <div className="flex flex-col gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="tabular text-sm font-medium text-text-primary">{selectionText}</p>
        <p className="text-sm text-text-secondary">You won&apos;t be charged yet.</p>
        {stepIndex === 1 && (
          <button type="button" onClick={() => goTo(0)} className="inline-flex min-h-11 items-center self-start text-sm font-medium text-text-accent hover:underline">
            Change time
          </button>
        )}
      </div>
      <p className="tabular whitespace-nowrap text-sm sm:text-right text-text-secondary">
        {durationMinutes / 60} h × {formatUsd(room.hourlyRateCents)} = <span className="text-lg font-semibold text-text-primary">{formatUsd(total)}</span>
      </p>
    </div>
  );

  return (
    <div ref={panelRef} className="flex flex-col gap-6 rounded-token-lg border border-border-subtle bg-surface p-5 shadow-[var(--shadow-medium)] sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 ref={headingRef} tabIndex={-1} className="type-subhead text-text-primary focus:outline-none">
          Book this room
        </h2>
        <span className="tabular text-sm text-text-secondary">{formatUsd(room.hourlyRateCents)}/hr</span>
      </div>
      <StepIndicator steps={STEPS} currentIndex={stepIndex} />

      {stepIndex === 0 && (
        <>
          <TimeStep
            room={room}
            today={today}
            date={date}
            onDate={(d) => {
              setDate(d);
              setSelectedStart(null);
              setSlotNotice(null);
            }}
            durationMinutes={durationMinutes}
            onDuration={(m) => {
              setDurationMinutes(m);
              setSelectedStart(null);
              setSlotNotice(null);
            }}
            selectedStart={selectedStart}
            onSelect={(s) => {
              setSelectedStart(s);
              setSlotNotice(null);
            }}
            refreshKey={refreshKey}
            heldStart={heldStart}
            notice={slotNotice}
            onSlotsLoaded={onSlotsLoaded}
          />
          {summary}
          <div className="hidden lg:block">
            <Button disabled={!selectedStart} onClick={() => goTo(1)} size="lg" className="w-full">
              Continue
            </Button>
          </div>
        </>
      )}

      {stepIndex === 1 && (
        <form id="booking-details" noValidate onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
          {summary}
          {signedInAs ? (
            <p className="text-sm text-text-secondary">Signed in as {signedInAs}. This booking will show in your account.</p>
          ) : (
            <p className="text-sm text-text-secondary">
              No account needed.{" "}
              <a
                href={`/api/auth/google?next=${encodeURIComponent(`/rooms/${room.id}?date=${date}&start=${selectedStart}&duration=${durationMinutes}#book`)}`}
                className="font-medium text-text-accent hover:underline"
              >
                Continue with Google
              </a>{" "}
              to fill this in and keep your bookings together.
            </p>
          )}
          <InputField
            label="Full name"
            data-step-focus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            autoComplete="name"
          />
          <InputField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={formErrors.email}
            hint="Your confirmation and calendar invite go here."
            autoComplete="email"
          />
          <InputField
            label="Phone (optional)"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            error={formErrors.phone}
            autoComplete="tel"
          />
          {holdError && (
            <div role="alert" className="flex flex-col items-start gap-1 text-sm text-error">
              <p>{holdError}</p>
              {heldDetails && holdError.startsWith("This time is held") && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(heldDetails);
                    setHoldError(null);
                  }}
                  className="inline-flex min-h-11 items-center font-medium text-text-accent hover:underline"
                >
                  Use earlier details
                </button>
              )}
            </div>
          )}
          <div className="hidden lg:block">
            <Button type="submit" disabled={creatingHold} size="lg" className="w-full">
              {creatingHold ? "Holding your time…" : "Review booking"}
            </Button>
          </div>
        </form>
      )}

      {stepIndex === 2 && booking && (
        <div className="flex flex-col gap-5">
          <dl className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle text-sm">
            <div className="flex items-start justify-between gap-4 py-3">
              <div className="flex flex-col gap-0.5">
                <dt className="text-text-secondary">Booking</dt>
                <dd className="font-medium text-text-primary">{room.name}</dd>
                <dd className="text-text-primary">{formatDateLong(booking.date)}</dd>
                <dd className="tabular text-text-primary">
                  {timeRange(booking.startTime, booking.endTime)} {zoneAbbrev(SITE.timeZone, booking.date)} · {hoursLabel(booking.durationMinutes)}
                </dd>
              </div>
              <button type="button" onClick={() => goTo(0)} aria-label="Edit time" className="inline-flex min-h-11 items-center px-1 font-medium text-text-accent hover:underline">
                Edit
              </button>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-text-secondary">You</dt>
                <dd className="text-text-primary">{heldDetails?.name}</dd>
                <dd className="break-words text-text-primary">{heldDetails?.email}</dd>
              </div>
              <button type="button" onClick={() => goTo(1)} aria-label="Edit your details" className="inline-flex min-h-11 items-center px-1 font-medium text-text-accent hover:underline">
                Edit
              </button>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-text-secondary">
                {room.name} · {hoursLabel(booking.durationMinutes)} × {formatUsd(room.hourlyRateCents)}
              </dt>
              <dd className="tabular text-lg font-semibold text-text-primary">{formatUsd(booking.priceCents)}</dd>
            </div>
          </dl>

          <p className="text-sm text-text-secondary">
            Need to change or cancel? Contact us.{" "}
            <Link href="/faq" className="font-medium text-text-accent hover:underline">
              A formal cancellation policy is being finalized.
            </Link>
          </p>

          <p className="sr-only" role="alert">
            {holdEndingSoon ? "Your hold on this time ends in under 2 minutes." : ""}
          </p>

          {holdEnded ? (
            <div className="flex flex-col items-start gap-3">
              <p className="font-medium text-text-primary">Your hold has ended.</p>
              <p className="text-sm text-text-secondary">Go back to check whether this time is still open.</p>
              <Button onClick={leaveEndedHold}>Back to times</Button>
            </div>
          ) : (
            <>
              {booking.holdExpiresAt && (
                <p className="text-sm text-text-primary">
                  {holdEndingSoon && <span className="font-semibold">Ending soon: </span>}
                  Held for you until <span className="tabular">{clockInZone(booking.holdExpiresAt)}</span>.
                </p>
              )}
              {creatingIntent && <p className="text-sm text-text-secondary">Preparing payment…</p>}
              {intentError && !creatingIntent && (
                <div className="flex flex-col gap-3">
                  <p role="alert" className="text-sm text-error">
                    {intentError}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => createPaymentIntent(booking.id)}>Try again</Button>
                    <Button variant="secondary" onClick={() => goTo(0)}>
                      Change time
                    </Button>
                  </div>
                </div>
              )}
              {booking && clientSecret && (
                <PaymentStep booking={booking} clientSecret={clientSecret} amountCents={booking.priceCents} />
              )}
            </>
          )}
        </div>
      )}

      {stepIndex < 2 && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(4.5rem+env(safe-area-inset-bottom))] items-start gap-3 border-t border-border-subtle bg-surface px-4 pb-[env(safe-area-inset-bottom)] pt-3 lg:hidden">
          {/* Reserve the bar's height at the end of the page so it never covers the footer. */}
          <style>{"@media (width < 64rem) { body { padding-bottom: calc(4.5rem + env(safe-area-inset-bottom)); } }"}</style>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="tabular truncate text-sm font-medium text-text-primary">
              {selectedStart && endTime ? timeRange(selectedStart, endTime) : "Pick a time"}
            </p>
            <p className="tabular truncate text-sm text-text-secondary">
              {selectedStart ? formatDateShort(date) : `${durationMinutes / 60} h`} · {formatUsd(total)}
            </p>
          </div>
          {/* Distinct keys: reusing one <button> would turn the Continue click into a form submit mid-event. */}
          {stepIndex === 0 ? (
            <Button key="continue" disabled={!selectedStart} onClick={() => goTo(1)}>
              Continue
            </Button>
          ) : (
            <Button key="review" type="submit" form="booking-details" disabled={creatingHold}>
              {creatingHold ? "Holding…" : "Review booking"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

