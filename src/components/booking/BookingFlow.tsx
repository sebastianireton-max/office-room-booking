"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StepIndicator } from "@/components/StepIndicator";
import { TimeSlotChip } from "@/components/TimeSlotChip";
import { BOOKING_CONFIG } from "@/types/domain";
import { InputField } from "@/components/InputField";
import { Button } from "@/components/Button";
import { PaymentStep } from "./PaymentStep";
import { formatDateLong, formatTime12h, formatUsd, nowInZone } from "@/lib/format";
import { SITE } from "@/lib/site-config";
import type { PublicBooking } from "@/lib/public-booking";
import type { Room, TimeSlot } from "@/types/domain";

const STEPS = [{ label: "Date & time" }, { label: "Your details" }, { label: "Payment" }];
const DURATIONS = [60, 120, 180];

interface FormState {
  name: string;
  email: string;
  phone: string;
}

export function BookingFlow({ room }: { room: Room }) {
  const params = useSearchParams();
  const today = nowInZone(SITE.timeZone).date;
  const paramDate = params.get("date");
  const paramDuration = Number(params.get("duration"));
  // A time picked in the homepage finder arrives as ?date=&start=&duration=.
  const pendingStart = useRef(/^\d{2}:\d{2}$/.test(params.get("start") ?? "") ? params.get("start") : null);

  const [stepIndex, setStepIndex] = useState(0);
  const [date, setDate] = useState(paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate) && paramDate >= today ? paramDate : today);
  const [durationMinutes, setDurationMinutes] = useState(DURATIONS.includes(paramDuration) ? paramDuration : 60);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "" });
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});
  const [creatingHold, setCreatingHold] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentError, setPaymentIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new query invalidates the old selection
    setSelectedStart(null);
    setLoadingSlots(true);
    setSlotsError(null);
    const controller = new AbortController();

    fetch(`/api/availability?roomId=${room.id}&date=${date}&durationMinutes=${durationMinutes}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((data: { slots: TimeSlot[] }) => {
        setSlots(data.slots ?? []);
        const wanted = pendingStart.current;
        pendingStart.current = null;
        if (wanted && data.slots.some((s) => s.startTime === wanted && s.available)) setSelectedStart(wanted);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setSlotsError("Couldn't load availability. Please try again.");
      })
      .finally(() => setLoadingSlots(false));

    return () => controller.abort();
  }, [room.id, date, durationMinutes]);

  useEffect(() => {
    if (!booking?.holdExpiresAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the countdown when the hold goes away
      setSecondsLeft(null);
      return;
    }
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.floor((new Date(booking.holdExpiresAt!).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking?.holdExpiresAt]);

  const priceCents = useMemo(() => Math.round(room.hourlyRateCents * (durationMinutes / 60)), [room.hourlyRateCents, durationMinutes]);

  function validateForm(): boolean {
    const errors: Partial<FormState> = {};
    if (!form.name.trim()) errors.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleDetailsContinue() {
    if (!selectedStart || !validateForm()) return;
    setCreatingHold(true);
    setHoldError(null);
    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          date,
          startTime: selectedStart,
          durationMinutes,
          customerName: form.name.trim(),
          customerEmail: form.email.trim(),
          customerPhone: form.phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHoldError(data.error ?? "Something went wrong. Please try again.");
        if (res.status === 409 || res.status === 400) {
          // Slot taken or no longer bookable: back to step 1 to pick again.
          setSelectedStart(null);
          setStepIndex(0);
        }
        return;
      }
      setBooking(data.booking);
      setStepIndex(2);
      await createPaymentIntent(data.booking.id);
    } catch {
      setHoldError("Something went wrong saving your booking. Your card has not been charged. Please try again.");
    } finally {
      setCreatingHold(false);
    }
  }

  async function createPaymentIntent(bookingId: string) {
    setCreatingIntent(true);
    setPaymentIntentError(null);
    try {
      const res = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentIntentError(data.error ?? "Could not start payment.");
        return;
      }
      setClientSecret(data.clientSecret ?? null);
      if (!data.clientSecret) setPaymentIntentError(data.error ?? null);
    } catch {
      setPaymentIntentError("Could not start payment. Please try again.");
    } finally {
      setCreatingIntent(false);
    }
  }

  const availableCount = slots.filter((s) => s.available).length;
  const hours = durationMinutes / 60;

  return (
    <div className="flex flex-col gap-6 rounded-token-lg border border-border-subtle bg-surface p-5 shadow-[var(--shadow-medium)] sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-text-primary">Book this room</h2>
        <span className="tabular text-sm text-text-secondary">{formatUsd(room.hourlyRateCents)}/hr</span>
      </div>
      <StepIndicator steps={STEPS} currentIndex={stepIndex} />

      <div className="flex items-center justify-between gap-4 rounded-token-sm bg-surface-raised px-4 py-3">
        <p className="text-sm text-text-primary">
          {selectedStart ? (
            <>
              {formatDateLong(date)}
              <br />
              <span className="tabular">
                {formatTime12h(selectedStart)}, {hours} hour{hours > 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <span className="text-text-secondary">Pick a date and start time</span>
          )}
        </p>
        <div className="text-right">
          <p className="tabular text-lg font-semibold text-text-primary">{formatUsd(priceCents)}</p>
          {secondsLeft !== null && stepIndex === 2 && (
            <p className={`tabular text-xs ${secondsLeft < 120 ? "text-error" : "text-text-secondary"}`}>
              Held {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, "0")}
            </p>
          )}
        </div>
      </div>

      {stepIndex === 0 && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="booking-date" className="text-sm font-medium text-text-primary">
                Date
              </label>
              <input
                id="booking-date"
                type="date"
                min={today}
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="min-h-11 rounded-token-sm border border-border-default bg-surface-raised px-3.5 py-2.5 text-text-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Length</span>
              <div className="flex gap-2">
                {DURATIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={durationMinutes === m}
                    onClick={() => setDurationMinutes(m)}
                    className={`min-h-11 flex-1 rounded-token-sm border px-2 text-sm font-medium transition active:scale-[0.98] motion-reduce:active:scale-100 ${
                      durationMinutes === m ? "border-accent bg-accent text-on-accent" : "border-border-default bg-surface-raised text-text-primary"
                    }`}
                  >
                    {m / 60}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-primary">Start time</span>
            {!loadingSlots && !slotsError && slots.some((s) => s.unavailableReason === "too-soon") && (
              <p className="text-sm text-text-secondary">
                Same-day bookings need {BOOKING_CONFIG.minBookingNoticeHours} hours&apos; notice, so earlier times are closed.
              </p>
            )}
            {loadingSlots && <p className="text-sm text-text-secondary">Checking availability…</p>}
            {slotsError && <p className="text-sm text-error">{slotsError}</p>}
            {!loadingSlots && !slotsError && availableCount === 0 && (
              <p className="text-sm text-text-secondary">No open times on this day. Try another date.</p>
            )}
            {!loadingSlots && !slotsError && availableCount > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((slot) => (
                  <TimeSlotChip
                    key={slot.startTime}
                    label={formatTime12h(slot.startTime)}
                    state={!slot.available ? "unavailable" : selectedStart === slot.startTime ? "selected" : "available"}
                    unavailableReason={slot.unavailableReason}
                    onClick={() => slot.available && setSelectedStart(slot.startTime)}
                  />
                ))}
              </div>
            )}
          </div>
          <Button disabled={!selectedStart} onClick={() => setStepIndex(1)} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="flex flex-col gap-4">
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
            autoComplete="tel"
          />
          {holdError && (
            <p role="alert" className="text-sm text-error">
              {holdError}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStepIndex(0)} className="flex-1">
              Back
            </Button>
            <Button disabled={creatingHold} onClick={handleDetailsContinue} className="flex-1">
              {creatingHold ? "Holding your slot…" : "Continue to payment"}
            </Button>
          </div>
        </div>
      )}

      {stepIndex === 0 && holdError && (
        <p role="alert" className="text-sm text-error">
          {holdError}
        </p>
      )}

      {stepIndex === 2 && (
        <div className="flex flex-col gap-4">
          {creatingIntent && <p className="text-sm text-text-secondary">Preparing payment…</p>}
          {paymentIntentError && (
            <p role="alert" className="text-sm text-error">
              {paymentIntentError}
            </p>
          )}
          {booking && clientSecret && <PaymentStep booking={booking} clientSecret={clientSecret} />}
        </div>
      )}
    </div>
  );
}
