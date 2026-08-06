import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import { getRoomById } from "@/lib/rooms-data";
import { BOOKING_CONFIG, type Booking, type BookingStatus, type TimeSlot } from "@/types/domain";

export class SlotUnavailableError extends Error {
  constructor() {
    super("That time slot is no longer available.");
    this.name = "SlotUnavailableError";
  }
}
export class RoomNotFoundError extends Error {
  constructor() {
    super("Room not found.");
    this.name = "RoomNotFoundError";
  }
}
export class InvalidBookingWindowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBookingWindowError";
  }
}

type BookingRow = {
  id: string;
  room_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_cents: number;
  status: string;
  stripe_payment_intent_id: string | null;
  hold_expires_at: string | null;
  calendar_event_uid: string;
  created_at: string;
  updated_at: string;
};

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    roomId: row.room_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    status: row.status as BookingStatus,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    holdExpiresAt: row.hold_expires_at,
    calendarEventUid: row.calendar_event_uid,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Minutes since local midnight, from "HH:mm". */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Release any pending_payment bookings whose hold has expired. Called
 * opportunistically before every read/write that depends on availability
 * (sweep-on-read), so no separate cron job is required for v1. Design
 * package Section 5.3 — "Time-based slot hold (required, not optional)".
 */
export function expireStaleHolds(): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE bookings SET status = 'expired', updated_at = ? WHERE status = 'pending_payment' AND hold_expires_at < ?`
  ).run(now, now);
}

/** True if [startTime, endTime) on `date` has no active (confirmed or held) booking overlapping it. */
function isRangeFree(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const rows = db
    .prepare(
      `SELECT start_time, end_time FROM bookings
       WHERE room_id = ? AND date = ? AND id != ?
         AND (status = 'confirmed' OR (status = 'pending_payment' AND hold_expires_at > ?))`
    )
    .all(roomId, date, excludeBookingId ?? "", now) as Pick<BookingRow, "start_time" | "end_time">[];

  const s1 = toMinutes(startTime);
  const e1 = toMinutes(endTime);
  for (const row of rows) {
    const s2 = toMinutes(row.start_time);
    const e2 = toMinutes(row.end_time);
    if (s1 < e2 && s2 < e1) return false; // overlap
  }
  return true;
}

/**
 * Every candidate start-time slot for a room/date/duration, with availability
 * computed against confirmed bookings and other customers' active holds.
 */
export function listAvailableSlots(
  roomId: string,
  date: string,
  durationMinutes: number
): TimeSlot[] {
  expireStaleHolds();

  const { operatingStartHour, operatingEndHour, slotGranularityMinutes, minBookingNoticeHours } =
    BOOKING_CONFIG;
  const dayStart = operatingStartHour * 60;
  const dayEnd = operatingEndHour * 60;

  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  const earliestMinutesToday = isToday
    ? now.getHours() * 60 + now.getMinutes() + minBookingNoticeHours * 60
    : -1;

  const slots: TimeSlot[] = [];
  for (let start = dayStart; start + durationMinutes <= dayEnd; start += slotGranularityMinutes) {
    const end = start + durationMinutes;
    const startTime = toHHMM(start);
    const endTime = toHHMM(end);

    if (isToday && start < earliestMinutesToday) {
      slots.push({ startTime, endTime, available: false });
      continue;
    }
    slots.push({ startTime, endTime, available: isRangeFree(roomId, date, startTime, endTime) });
  }
  return slots;
}

export interface CreateHoldInput {
  roomId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}

/**
 * Creates a pending_payment booking with a short-lived hold, guarding against
 * the double-booking race condition called out in the design package
 * (Section 2.6 / 5.3): two customers reaching checkout for the same exact
 * slot at once. Price is computed here, server-side, from the room's stored
 * rate — never trusted from client input (Section 10.4).
 */
export function createHold(input: CreateHoldInput): Booking {
  const room = getRoomById(input.roomId);
  if (!room || !room.active) throw new RoomNotFoundError();

  const { operatingStartHour, operatingEndHour } = BOOKING_CONFIG;
  const startMin = toMinutes(input.startTime);
  const endMin = startMin + input.durationMinutes;
  if (startMin < operatingStartHour * 60 || endMin > operatingEndHour * 60) {
    throw new InvalidBookingWindowError("Selected time is outside operating hours.");
  }
  const endTime = toHHMM(endMin);

  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    expireStaleHolds();
    if (!isRangeFree(input.roomId, input.date, input.startTime, endTime)) {
      db.exec("ROLLBACK");
      throw new SlotUnavailableError();
    }

    const id = randomUUID();
    const now = new Date();
    const nowIso = now.toISOString();
    const holdExpiresAt = new Date(
      now.getTime() + BOOKING_CONFIG.holdDurationMinutes * 60_000
    ).toISOString();
    const priceCents = Math.round(room.hourlyRateCents * (input.durationMinutes / 60));

    db.prepare(
      `INSERT INTO bookings
        (id, room_id, customer_name, customer_email, customer_phone, date, start_time, end_time,
         duration_minutes, price_cents, status, stripe_payment_intent_id, hold_expires_at,
         calendar_event_uid, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', NULL, ?, ?, ?, ?)`
    ).run(
      id,
      input.roomId,
      input.customerName,
      input.customerEmail,
      input.customerPhone ?? null,
      input.date,
      input.startTime,
      endTime,
      input.durationMinutes,
      priceCents,
      holdExpiresAt,
      `${id}@booking-platform`,
      nowIso,
      nowIso
    );
    db.exec("COMMIT");

    return rowToBooking(
      db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(id) as BookingRow
    );
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* already rolled back */
    }
    throw err;
  }
}

export function getBookingById(id: string): Booking | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(id) as
    | BookingRow
    | undefined;
  return row ? rowToBooking(row) : null;
}

/**
 * Attaches a Stripe PaymentIntent and extends the hold to
 * BOOKING_CONFIG.paymentGraceMinutes (30 min), replacing the original
 * short holdDurationMinutes (10 min).
 *
 * PREVENTIVE FIX for the race documented on confirmBookingByPaymentIntent
 * below: expireStaleHolds() only checks hold_expires_at, so once a real
 * payment attempt is underway the hold needs enough runway to survive a
 * slow 3D Secure confirmation or delayed webhook delivery — otherwise the
 * opportunistic sweep can free the slot to a second customer while the
 * first customer's payment is still legitimately in flight. If the payment
 * is actually abandoned (never completes), the slot still recovers
 * automatically once this longer window elapses — see
 * releaseHoldOnPaymentFailure for the faster path when Stripe tells us
 * definitively that it failed.
 *
 * Returns false (and attaches nothing) if the booking already moved off
 * pending_payment between the caller's own status check and this call —
 * a narrow, separate race from the one above (e.g. expireStaleHolds()
 * firing mid-request). Callers MUST check the return value: proceeding to
 * hand a clientSecret to the browser after a false return would let someone
 * pay for a slot the system no longer holds for them.
 */
export function attachPaymentIntent(bookingId: string, paymentIntentId: string): boolean {
  const db = getDb();
  const now = new Date();
  const graceExpiresAt = new Date(
    now.getTime() + BOOKING_CONFIG.paymentGraceMinutes * 60_000
  ).toISOString();
  const result = db
    .prepare(
      `UPDATE bookings SET stripe_payment_intent_id = ?, hold_expires_at = ?, updated_at = ?
       WHERE id = ? AND status = 'pending_payment'`
    )
    .run(paymentIntentId, graceExpiresAt, now.toISOString(), bookingId);
  return result.changes > 0;
}

/**
 * Immediately releases a hold when Stripe tells us the payment definitely
 * failed or was canceled — rather than waiting out the paymentGraceMinutes
 * window for a payment that's already known dead. Called from the
 * payment_intent.payment_failed / payment_intent.canceled webhook handlers.
 * No-ops if the booking already moved on (confirmed/expired/cancelled).
 */
export function releaseHoldOnPaymentFailure(paymentIntentId: string): void {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, status FROM bookings WHERE stripe_payment_intent_id = ?`)
    .get(paymentIntentId) as Pick<BookingRow, "id" | "status"> | undefined;
  if (!row || row.status !== "pending_payment") return;

  db.prepare(
    `UPDATE bookings SET status = 'expired', updated_at = ? WHERE id = ? AND status = 'pending_payment'`
  ).run(new Date().toISOString(), row.id);
}

/**
 * Marks a booking confirmed. Called ONLY from the Stripe webhook handler
 * after signature verification of a payment_intent.succeeded event — never
 * from a client-side redirect. Design package Section 10.3.
 *
 * SECURITY/INTEGRITY GUARD (added by security-auditor, 2nd pass): only
 * transitions pending_payment -> confirmed (the normal path), or re-confirms
 * an already-confirmed booking (idempotent no-op for Stripe's webhook
 * retries). It deliberately does NOT resurrect an expired/cancelled booking
 * back to confirmed.
 *
 * Why: `expireStaleHolds()` runs opportunistically on every read/write and
 * flips a stale pending_payment hold to 'expired' the moment its
 * hold_expires_at passes — independently of whether a PaymentIntent for it
 * is still in flight (e.g. a slow 3D Secure confirmation, or a delayed
 * webhook delivery). If that late-but-legitimate payment_intent.succeeded
 * event were still allowed to unconditionally flip the row to 'confirmed',
 * it could resurrect a booking whose slot has since been re-sold: a second
 * customer can hold + pay for the same room/date/time once the first
 * booking shows as 'expired', producing two 'confirmed' rows for the same
 * slot when the first customer's payment finally clears. Reproduced locally
 * against a throwaway sqlite db using this file's own SQL before this fix.
 *
 * This guard stops the double-booked-confirmed state, but does NOT decide
 * what should happen to the affected customer (who did legitimately pay) —
 * that's a product/business call (auto-refund? manual outreach? try to
 * rebook them?) left for the owner. The case is logged loudly so it's
 * discoverable instead of failing silently.
 */
export function confirmBookingByPaymentIntent(paymentIntentId: string): Booking | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM bookings WHERE stripe_payment_intent_id = ?`)
    .get(paymentIntentId) as BookingRow | undefined;
  if (!row) return null;

  if (row.status !== "pending_payment" && row.status !== "confirmed") {
    console.error(
      `payment_intent.succeeded for paymentIntentId=${paymentIntentId} bookingId=${row.id}, but the ` +
        `booking's hold already moved to status="${row.status}" (likely expired before this payment ` +
        "confirmed). NOT auto-confirming — the slot may already be booked by someone else. This booking " +
        "needs manual reconciliation (the customer was charged; verify and refund or rebook as appropriate)."
    );
    return null;
  }

  db.prepare(
    `UPDATE bookings SET status = 'confirmed', hold_expires_at = NULL, updated_at = ? WHERE id = ?`
  ).run(new Date().toISOString(), row.id);

  return getBookingById(row.id);
}

export function cancelBooking(id: string): void {
  const db = getDb();
  db.prepare(`UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    id
  );
}
