// Domain types — mirror the Room Data Model in the design package, Section 5.

export type RoomType = "content" | "podcast" | "conference";

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  sqft: number;
  /** Integer cents — never a float. Design package Section 5.3. */
  hourlyRateCents: number;
  description: string;
  equipment: string[];
  active: boolean;
  /** Landing-page marketing fields (added 2026-08-07 when the deferred
   * per-room pages were built). Copy must stay grounded in the room's
   * actual equipment/specs — no invented amenities, no fabricated social
   * proof. */
  tagline: string;
  marketingDescription: string;
  idealFor: string[];
}

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "expired";

export interface Booking {
  id: string;
  roomId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  /** ISO date, e.g. "2026-08-20" */
  date: string;
  /** 24h "HH:mm" */
  startTime: string;
  /** 24h "HH:mm" */
  endTime: string;
  durationMinutes: number;
  /** Snapshotted at booking time — never recomputed live. */
  priceCents: number;
  status: BookingStatus;
  stripePaymentIntentId: string | null;
  /** Slot hold expiry — see design package Section 5.3. Null once confirmed. */
  holdExpiresAt: string | null;
  calendarEventUid: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  content: "Content",
  podcast: "Podcast",
  conference: "Conference",
};

/** Operating hours + slot rules — design package Section 5.3. */
export const BOOKING_CONFIG = {
  operatingStartHour: 8, // 08:00
  operatingEndHour: 22, // 22:00
  slotGranularityMinutes: 60,
  minBookingNoticeHours: 2,
  turnoverBufferMinutes: 15,
  holdDurationMinutes: 10,
  /** Once a Stripe PaymentIntent is attached, the hold is extended to this
   * window instead of the original holdDurationMinutes — see attachPaymentIntent
   * in bookings-repository.ts. Covers slow 3D Secure / delayed webhook delivery
   * without leaving an abandoned payment attempt locking the slot forever. */
  paymentGraceMinutes: 30,
} as const;
