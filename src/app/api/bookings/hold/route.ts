import { NextRequest, NextResponse } from "next/server";
import {
  createHold,
  InvalidBookingWindowError,
  RoomNotFoundError,
  SlotUnavailableError,
  updateHoldCustomer,
} from "@/lib/db/bookings-repository";
import { createHoldSchema, CUSTOMER_FIELDS, updateHoldSchema } from "@/lib/validation";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { publicBooking } from "@/lib/public-booking";

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Partial<Record<(typeof CUSTOMER_FIELDS)[number], string>> = {};
  for (const issue of issues) {
    const key = CUSTOMER_FIELDS.find((f) => f === issue.path[0]);
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function POST(req: NextRequest) {
  // Tighter limit than availability reads — this writes a row.
  const rl = checkRateLimit(`hold:${clientKey(req)}`, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createHoldSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = fieldErrorsOf(parsed.error.issues);
    // Without fieldErrors the client treats it like a lost slot: back to times.
    return Object.keys(fieldErrors).length
      ? NextResponse.json({ error: "Check the highlighted fields.", fieldErrors }, { status: 400 })
      : NextResponse.json({ error: "That time can't be booked. Pick another time." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const booking = createHold({ ...parsed.data, userId: user?.id ?? null });
    return NextResponse.json({ booking: publicBooking(booking) });
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return NextResponse.json(
        { error: "That time slot was just booked by someone else. Please choose another time." },
        { status: 409 }
      );
    }
    if (err instanceof RoomNotFoundError) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }
    if (err instanceof InvalidBookingWindowError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("createHold failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Something went wrong saving your booking. Your card has not been charged. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * SECURITY-RELEVANT: fixes a typo in the details on the caller's own live hold.
 * The booking id is the capability (an unguessable UUID only the holder's browser
 * has, the same token create-payment-intent accepts). Only contact fields change,
 * and only while the hold is pending and unexpired.
 */
export async function PATCH(req: NextRequest) {
  const rl = checkRateLimit(`hold:${clientKey(req)}`, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }
  const parsed = updateHoldSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fieldErrors = fieldErrorsOf(parsed.error.issues);
    return NextResponse.json(
      Object.keys(fieldErrors).length ? { error: "Check the highlighted fields.", fieldErrors } : { error: "Invalid request." },
      { status: 400 }
    );
  }
  const { bookingId, ...customer } = parsed.data;
  const booking = updateHoldCustomer(bookingId, customer);
  if (!booking) {
    return NextResponse.json({ error: "Your hold on this time has ended. Pick a time again." }, { status: 409 });
  }
  return NextResponse.json({ booking: publicBooking(booking) });
}
