import type { Booking } from "@/types/domain";

/**
 * What a booking id alone may reveal. The id is the confirmation page's
 * capability token (an unguessable UUID), but a leaked URL still should not
 * hand out the customer's email, phone or Stripe references.
 */
export function publicBooking(b: Booking) {
  return {
    id: b.id,
    roomId: b.roomId,
    date: b.date,
    startTime: b.startTime,
    endTime: b.endTime,
    durationMinutes: b.durationMinutes,
    priceCents: b.priceCents,
    status: b.status,
    holdExpiresAt: b.holdExpiresAt,
  };
}

export type PublicBooking = ReturnType<typeof publicBooking>;
