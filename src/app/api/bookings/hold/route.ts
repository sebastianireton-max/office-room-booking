import { NextRequest, NextResponse } from "next/server";
import {
  createHold,
  InvalidBookingWindowError,
  RoomNotFoundError,
  SlotUnavailableError,
} from "@/lib/db/bookings-repository";
import { createHoldSchema } from "@/lib/validation";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { BOOKING_CONFIG } from "@/types/domain";

export async function POST(req: NextRequest) {
  // Tighter limit than availability reads — this writes a row.
  const rl = checkRateLimit(`hold:${clientKey(req)}`, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createHoldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const booking = createHold(parsed.data);
    return NextResponse.json({
      booking,
      holdDurationMinutes: BOOKING_CONFIG.holdDurationMinutes,
    });
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      // Copy matches the design package's race-condition microcopy, Section 6.4.
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
    console.error("createHold failed", err);
    return NextResponse.json(
      { error: "Something went wrong saving your booking. Your card has not been charged — please try again." },
      { status: 500 }
    );
  }
}
