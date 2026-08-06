"use client";

import { useEffect, useMemo, useState } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { TimeSlotChip } from "@/components/TimeSlotChip";
import { InputField } from "@/components/InputField";
import { Button } from "@/components/Button";
import { PaymentStep } from "./PaymentStep";
import { formatDateLong, formatTime12h, formatUsd, todayIso } from "@/lib/format";
import type { Booking, Room, TimeSlot } from "@/types/domain";

const STEPS = [{ label: "Date & Time" }, { label: "Your Details" }, { label: "Payment" }];
const DURATIONS = [
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 180, label: "3 hours" },
];

interface FormState {
  name: string;
  email: string;
  phone: string;
}

export function BookingFlow({ room }: { room: Room }) {
  const [stepIndex, setStepIndex] = useState(0);

  // Step 1 — Date & Time
  const [date, setDate] = useState(todayIso());
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);

  // Step 2 — Your Details
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "" });
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});
  const [creatingHold, setCreatingHold] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  // Step 3 — Payment
  const [booking, setBooking] = useState<Booking | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentError, setPaymentIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    // Resetting selection/loading state here (not in an event handler) is
    // intentional: this effect re-fetches whenever room/date/duration change,
    // and the UI needs to reflect "loading" for that new fetch immediately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedStart(null);
    setLoadingSlots(true);
    setSlotsError(null);
    const controller = new AbortController();

    fetch(`/api/availability?roomId=${room.id}&date=${date}&durationMinutes=${durationMinutes}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => setSlots(data.slots ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") setSlotsError("Couldn't load availability. Please try again.");
      })
      .finally(() => setLoadingSlots(false));

    return () => controller.abort();
  }, [room.id, date, durationMinutes]);

  // Countdown to hold expiry, once a hold exists.
  useEffect(() => {
    if (!booking?.holdExpiresAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the countdown when the hold goes away is the intended reset.
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(booking.holdExpiresAt!).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking?.holdExpiresAt]);

  const priceCents = useMemo(
    () => Math.round(room.hourlyRateCents * (durationMinutes / 60)),
    [room.hourlyRateCents, durationMinutes]
  );

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
        if (res.status === 409) {
          // Slot taken between selection and submit — design package Section 9.7:
          // return to Step 1, don't advance.
          setSelectedStart(null);
          setStepIndex(0);
        }
        return;
      }
      setBooking(data.booking);
      setStepIndex(2);
      await createPaymentIntent(data.booking.id);
    } catch {
      setHoldError("Something went wrong saving your booking. Your card has not been charged — please try again.");
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
      if (!data.clientSecret) {
        setPaymentIntentError(data.error ?? null);
      }
    } catch {
      setPaymentIntentError("Could not start payment. Please try again.");
    } finally {
      setCreatingIntent(false);
    }
  }

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="flex flex-col gap-6 rounded-token-lg bg-surface p-6 shadow-[var(--shadow-medium)]">
      <StepIndicator steps={STEPS} currentIndex={stepIndex} />

      {/* Persistent booking summary — design package Section 6.8 */}
      <div className="flex flex-col gap-1 rounded-token-md bg-surface-raised p-4">
        <p className="text-sm font-semibold text-text-primary">{room.name}</p>
        {selectedStart ? (
          <p className="text-sm text-text-secondary">
            {formatDateLong(date)} · {formatTime12h(selectedStart)} (
            {durationMinutes / 60} hr{durationMinutes > 60 ? "s" : ""})
          </p>
        ) : (
          <p className="text-sm text-text-secondary">Pick a date and time to get started</p>
        )}
        <p className="text-base font-semibold text-text-primary">{formatUsd(priceCents)}</p>
        {secondsLeft !== null && stepIndex === 2 && (
          <p className={`text-xs ${secondsLeft < 120 ? "text-error" : "text-text-secondary"}`}>
            Slot held for {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, "0")}
          </p>
        )}
      </div>

      {stepIndex === 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="booking-date" className="text-sm font-medium text-text-primary">
              Date
            </label>
            <input
              id="booking-date"
              type="date"
              min={todayIso()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-11 rounded-token-sm border border-border-default bg-surface-raised px-3.5 py-2.5 text-text-primary"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-primary">Duration</span>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.minutes}
                  type="button"
                  onClick={() => setDurationMinutes(d.minutes)}
                  className={`min-h-11 flex-1 rounded-token-sm border px-3 py-2.5 text-sm font-medium transition-colors ${
                    durationMinutes === d.minutes
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border-default bg-surface-raised text-text-primary"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-primary">Pick a date and time that works for you.</span>
            {loadingSlots && <p className="text-sm text-text-secondary">Checking availability…</p>}
            {slotsError && <p className="text-sm text-error">{slotsError}</p>}
            {!loadingSlots && !slotsError && availableCount === 0 && (
              <p className="text-sm text-text-secondary">No open slots on this day. Try another date.</p>
            )}
            {!loadingSlots && !slotsError && availableCount > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <TimeSlotChip
                    key={slot.startTime}
                    label={formatTime12h(slot.startTime)}
                    state={
                      !slot.available
                        ? "unavailable"
                        : selectedStart === slot.startTime
                        ? "selected"
                        : "available"
                    }
                    onClick={() => slot.available && setSelectedStart(slot.startTime)}
                  />
                ))}
              </div>
            )}
          </div>
          <Button disabled={!selectedStart} onClick={() => setStepIndex(1)} className="mt-2 w-full">
            Continue
          </Button>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="flex flex-col gap-4">
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
            hint="We'll send your confirmation and calendar invite here."
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
              {creatingHold ? "Saving…" : "Continue"}
            </Button>
          </div>
        </div>
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
          {booking && !clientSecret && !creatingIntent && !paymentIntentError && (
            <p className="text-sm text-text-secondary">
              Stripe isn&apos;t connected yet — add your keys to see the live payment form here. See the README.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
