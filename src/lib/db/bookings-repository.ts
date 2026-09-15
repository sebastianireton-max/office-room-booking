import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import { getRoomById } from "@/lib/rooms-data";
import { SITE } from "@/lib/site-config";
import { addDaysIso, nowInZone, priceCents } from "@/lib/format";
import {
  BOOKING_CONFIG,
  type Booking,
  type BookingStatus,
  type RoomBlock,
  type TimeSlot,
} from "@/types/domain";

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
  user_id: string | null;
  payment_issue: string | null;
  stripe_refund_id: string | null;
  confirmation_sent_at: string | null;
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
    userId: row.user_id,
    paymentIssue: row.payment_issue,
    stripeRefundId: row.stripe_refund_id,
    confirmationSentAt: row.confirmation_sent_at,
  };
}

/** Minutes since local midnight, from "HH:mm". */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
export function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Release pending_payment holds whose window has passed. Runs before every
 * availability read/write (sweep-on-read), so no cron is needed.
 */
export function expireStaleHolds(): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(`UPDATE bookings SET status = 'expired', updated_at = ? WHERE status = 'pending_payment' AND hold_expires_at < ?`)
    .run(now, now);
}

const overlaps = (s1: number, e1: number, s2: number, e2: number) => s1 < e2 && s2 < e1;

/** Why [start, end) on `date` cannot be booked, or null when it is free. */
function rangeConflict(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string
): "booked" | "closed" | null {
  const db = getDb();
  const s1 = toMinutes(startTime);
  const e1 = toMinutes(endTime);

  const blocks = db
    .prepare(`SELECT start_time, end_time FROM room_blocks WHERE date = ? AND (room_id IS NULL OR room_id = ?)`)
    .all(date, roomId) as { start_time: string; end_time: string }[];
  if (blocks.some((b) => overlaps(s1, e1, toMinutes(b.start_time), toMinutes(b.end_time)))) return "closed";

  const rows = db
    .prepare(
      `SELECT start_time, end_time FROM bookings
       WHERE room_id = ? AND date = ?
         AND (status = 'confirmed' OR (status = 'pending_payment' AND hold_expires_at > ?))`
    )
    .all(roomId, date, new Date().toISOString()) as { start_time: string; end_time: string }[];
  if (rows.some((r) => overlaps(s1, e1, toMinutes(r.start_time), toMinutes(r.end_time)))) return "booked";

  return null;
}

/**
 * The earliest bookable minute on `date` in the studio's time zone:
 * -1 for a future day, Infinity for a past day or one beyond the horizon.
 */
function earliestStartMinute(date: string): number {
  const now = nowInZone(SITE.timeZone);
  if (date < now.date || date > addDaysIso(now.date, BOOKING_CONFIG.maxAdvanceDays)) return Infinity;
  if (date > now.date) return -1;
  return now.minutes + BOOKING_CONFIG.minBookingNoticeHours * 60;
}

export function listAvailableSlots(roomId: string, date: string, durationMinutes: number): TimeSlot[] {
  expireStaleHolds();
  const { operatingStartHour, operatingEndHour, slotGranularityMinutes } = BOOKING_CONFIG;
  const earliest = earliestStartMinute(date);

  const slots: TimeSlot[] = [];
  for (let start = operatingStartHour * 60; start + durationMinutes <= operatingEndHour * 60; start += slotGranularityMinutes) {
    const startTime = toHHMM(start);
    const endTime = toHHMM(start + durationMinutes);
    if (start < earliest) {
      slots.push({ startTime, endTime, available: false, unavailableReason: "too-soon" });
      continue;
    }
    const conflict = rangeConflict(roomId, date, startTime, endTime);
    slots.push({ startTime, endTime, available: !conflict, ...(conflict ? { unavailableReason: conflict } : {}) });
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
  userId?: string | null;
}

/**
 * Creates a pending_payment booking with a short hold. BEGIN IMMEDIATE takes the
 * write lock before the overlap check, so two customers racing for one slot
 * cannot both pass it. Price is computed here from the catalog, never the client.
 */
export function createHold(input: CreateHoldInput): Booking {
  const room = getRoomById(input.roomId);
  if (!room || !room.active) throw new RoomNotFoundError();

  const { operatingStartHour, operatingEndHour, slotGranularityMinutes } = BOOKING_CONFIG;
  const startMin = toMinutes(input.startTime);
  const endMin = startMin + input.durationMinutes;
  if (startMin < operatingStartHour * 60 || endMin > operatingEndHour * 60) {
    throw new InvalidBookingWindowError("Selected time is outside operating hours.");
  }
  if (startMin % slotGranularityMinutes !== 0 || input.durationMinutes % slotGranularityMinutes !== 0) {
    throw new InvalidBookingWindowError("Bookings start on the hour and run in whole hours.");
  }
  // The UI already greys these out; the server has to refuse them too, or the
  // API books yesterday or ten minutes from now.
  if (startMin < earliestStartMinute(input.date)) {
    throw new InvalidBookingWindowError(
      `That time can no longer be booked. Same-day bookings need ${BOOKING_CONFIG.minBookingNoticeHours} hours' notice.`
    );
  }
  const endTime = toHHMM(endMin);

  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    expireStaleHolds();
    if (rangeConflict(input.roomId, input.date, input.startTime, endTime)) {
      throw new SlotUnavailableError();
    }

    const id = randomUUID();
    const now = new Date();
    const nowIso = now.toISOString();
    const holdExpiresAt = new Date(now.getTime() + BOOKING_CONFIG.holdDurationMinutes * 60_000).toISOString();
    const price = priceCents(room.hourlyRateCents, input.durationMinutes);

    db.prepare(
      `INSERT INTO bookings
        (id, room_id, customer_name, customer_email, customer_phone, date, start_time, end_time,
         duration_minutes, price_cents, status, stripe_payment_intent_id, hold_expires_at,
         calendar_event_uid, created_at, updated_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', NULL, ?, ?, ?, ?, ?)`
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
      price,
      holdExpiresAt,
      `${id}@clockroom`,
      nowIso,
      nowIso,
      input.userId ?? null
    );
    db.exec("COMMIT");
    return getBookingById(id)!;
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
  const row = getDb().prepare(`SELECT * FROM bookings WHERE id = ?`).get(id) as BookingRow | undefined;
  return row ? rowToBooking(row) : null;
}

export function getBookingByPaymentIntent(paymentIntentId: string): Booking | null {
  const row = getDb().prepare(`SELECT * FROM bookings WHERE stripe_payment_intent_id = ?`).get(paymentIntentId) as
    | BookingRow
    | undefined;
  return row ? rowToBooking(row) : null;
}

/**
 * Attaches a PaymentIntent and stretches the hold to paymentGraceMinutes so a
 * slow 3D Secure or late webhook cannot lose the slot mid-payment. Returns false
 * if the booking already left pending_payment; callers MUST cancel the intent then.
 */
export function attachPaymentIntent(bookingId: string, paymentIntentId: string): boolean {
  const now = new Date();
  const graceExpiresAt = new Date(now.getTime() + BOOKING_CONFIG.paymentGraceMinutes * 60_000).toISOString();
  const result = getDb()
    .prepare(
      `UPDATE bookings SET stripe_payment_intent_id = ?, hold_expires_at = ?, updated_at = ?
       WHERE id = ? AND status = 'pending_payment'`
    )
    .run(paymentIntentId, graceExpiresAt, now.toISOString(), bookingId);
  return result.changes > 0;
}

/** Frees the slot at once when Stripe says the payment failed or was cancelled. */
export function releaseHoldOnPaymentFailure(paymentIntentId: string): void {
  getDb()
    .prepare(
      `UPDATE bookings SET status = 'expired', updated_at = ? WHERE stripe_payment_intent_id = ? AND status = 'pending_payment'`
    )
    .run(new Date().toISOString(), paymentIntentId);
}

/**
 * Marks a booking confirmed. Called ONLY from the signature-verified webhook.
 *
 * Only pending_payment -> confirmed (or a no-op re-confirm on Stripe retries).
 * An expired/cancelled booking is never resurrected: its slot may already be
 * resold, and confirming it would double-book. Instead the booking is flagged
 * with payment_issue so the admin dashboard surfaces a charged customer who
 * needs a refund or a rebook.
 */
export function confirmBookingByPaymentIntent(
  paymentIntentId: string
): { booking: Booking; newlyConfirmed: boolean } | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM bookings WHERE stripe_payment_intent_id = ?`).get(paymentIntentId) as
    | BookingRow
    | undefined;
  if (!row) return null;
  const now = new Date().toISOString();

  if (row.status === "confirmed") return { booking: rowToBooking(row), newlyConfirmed: false };

  if (row.status !== "pending_payment") {
    console.error(
      `payment_intent.succeeded for ${paymentIntentId} but booking ${row.id} is "${row.status}". Not confirming; flagged for the admin.`
    );
    db.prepare(`UPDATE bookings SET payment_issue = ?, updated_at = ? WHERE id = ?`).run(
      row.status === "expired"
        ? "Paid after the hold had ended, so the slot was released."
        : `Paid after the booking was ${row.status}.`,
      now,
      row.id
    );
    return null;
  }

  db.prepare(`UPDATE bookings SET status = 'confirmed', hold_expires_at = NULL, updated_at = ? WHERE id = ? AND status = 'pending_payment'`).run(
    now,
    row.id
  );
  return { booking: getBookingById(row.id)!, newlyConfirmed: true };
}

export function markConfirmationSent(id: string): void {
  getDb().prepare(`UPDATE bookings SET confirmation_sent_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
}

// ---- Customer account --------------------------------------------------

/** A signed-in customer's bookings: ones made while signed in, plus ones made
 * earlier with the same (Google-verified) email address. */
export function listBookingsForUser(userId: string, email: string): Booking[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM bookings
       WHERE (user_id = ? OR customer_email = ? COLLATE NOCASE)
         AND status IN ('confirmed', 'completed', 'cancelled')
       ORDER BY date DESC, start_time DESC`
    )
    .all(userId, email) as BookingRow[];
  return rows.map(rowToBooking);
}

// ---- Admin -------------------------------------------------------------

export interface BookingFilters {
  status?: BookingStatus | "issue";
  roomId?: string;
  from?: string;
  to?: string;
  q?: string;
}

export function listBookings(filters: BookingFilters, limit = 200): Booking[] {
  expireStaleHolds();
  const where: string[] = [];
  const params: (string | number)[] = [];
  const add = (clause: string, value: string) => {
    where.push(clause);
    params.push(value);
  };
  if (filters.status === "issue") where.push("payment_issue IS NOT NULL");
  else if (filters.status) add("status = ?", filters.status);
  if (filters.roomId) add("room_id = ?", filters.roomId);
  if (filters.from) add("date >= ?", filters.from);
  if (filters.to) add("date <= ?", filters.to);
  // Substring match, so the 8-character reference customers see finds the full id.
  const q = filters.q?.trim().replace(/[%_]/g, "");
  if (q) {
    where.push("(customer_name LIKE ? OR customer_email LIKE ? OR id LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const sql = `SELECT * FROM bookings ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
               ORDER BY date DESC, start_time DESC LIMIT ?`;
  return (getDb().prepare(sql).all(...params, limit) as BookingRow[]).map(rowToBooking);
}

export function bookingsOnDate(date: string): Booking[] {
  expireStaleHolds();
  return (
    getDb()
      .prepare(`SELECT * FROM bookings WHERE date = ? AND status IN ('confirmed', 'pending_payment') ORDER BY start_time`)
      .all(date) as BookingRow[]
  ).map(rowToBooking);
}

export function adminStats(today: string) {
  const db = getDb();
  const monthStart = `${today.slice(0, 7)}-01`;
  const one = (sql: string, ...p: string[]) => (db.prepare(sql).get(...p) as { n: number | null }).n ?? 0;
  return {
    todayCount: one(`SELECT COUNT(*) n FROM bookings WHERE date = ? AND status = 'confirmed'`, today),
    upcomingCount: one(`SELECT COUNT(*) n FROM bookings WHERE date > ? AND status = 'confirmed'`, today),
    monthRevenueCents: one(
      `SELECT SUM(price_cents) n FROM bookings WHERE date >= ? AND status IN ('confirmed','completed') AND stripe_refund_id IS NULL`,
      monthStart
    ),
    issueCount: one(`SELECT COUNT(*) n FROM bookings WHERE payment_issue IS NOT NULL`),
  };
}

/** Cancels a confirmed or held booking, which frees the slot immediately. */
export function cancelBooking(id: string, refundId: string | null): boolean {
  const result = getDb()
    .prepare(
      `UPDATE bookings SET status = 'cancelled', hold_expires_at = NULL,
         stripe_refund_id = COALESCE(?, stripe_refund_id), updated_at = ?
       WHERE id = ? AND status IN ('confirmed', 'pending_payment')`
    )
    .run(refundId, new Date().toISOString(), id);
  return result.changes > 0;
}

/** Records a refund on a booking that was never confirmed (the payment_issue case). */
export function resolvePaymentIssue(id: string, refundId: string | null): void {
  getDb()
    .prepare(
      `UPDATE bookings SET payment_issue = NULL, stripe_refund_id = COALESCE(?, stripe_refund_id), updated_at = ? WHERE id = ?`
    )
    .run(refundId, new Date().toISOString(), id);
}

type BlockRow = {
  id: string;
  room_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_by: string;
  created_at: string;
};

export function listBlocks(fromDate: string): RoomBlock[] {
  return (
    getDb().prepare(`SELECT * FROM room_blocks WHERE date >= ? ORDER BY date, start_time`).all(fromDate) as BlockRow[]
  ).map((r) => ({
    id: r.id,
    roomId: r.room_id,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    reason: r.reason,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }));
}

/**
 * Adds a block-out. Returns the confirmed bookings it overlaps so the admin can
 * deal with them; the block does not cancel anyone on its own.
 */
export function createBlock(input: Omit<RoomBlock, "id" | "createdAt">): { id: string; clashes: Booking[] } {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO room_blocks (id, room_id, date, start_time, end_time, reason, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.roomId, input.date, input.startTime, input.endTime, input.reason, input.createdBy, new Date().toISOString());

  const s = toMinutes(input.startTime);
  const e = toMinutes(input.endTime);
  const clashes = bookingsOnDate(input.date).filter(
    (b) =>
      b.status === "confirmed" &&
      (input.roomId === null || b.roomId === input.roomId) &&
      overlaps(s, e, toMinutes(b.startTime), toMinutes(b.endTime))
  );
  return { id, clashes };
}

export function deleteBlock(id: string): boolean {
  return getDb().prepare(`DELETE FROM room_blocks WHERE id = ?`).run(id).changes > 0;
}
