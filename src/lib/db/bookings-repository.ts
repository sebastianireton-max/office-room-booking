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

export function attachPaymentIntent(bookingId: string, paymentIntentId: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE bookings SET stripe_payment_intent_id = ?, updated_at = ? WHERE id = ?`
  ).run(paymentIntentId, new Date().toISOString(), bookingId);
}

/**
 * Marks a booking confirmed. Called ONLY from the Stripe webhook handler
 * after signature verification of a payment_intent.succeeded event — never
 * from a client-side redirect. Design package Section 10.3.
 */
export function confirmBookingByPaymentIntent(paymentIntentId: string): Booking | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM bookings WHERE stripe_payment_intent_id = ?`)
    .get(paymentIntentId) as BookingRow | undefined;
  if (!row) return null;

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
