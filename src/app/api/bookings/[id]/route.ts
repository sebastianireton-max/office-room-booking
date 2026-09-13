import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";
import { publicBooking } from "@/lib/public-booking";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  if (!checkRateLimit(`booking-read:${clientKey(req)}`, 60).allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }
  const { id } = await ctx.params;
  const booking = getBookingById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  return NextResponse.json({ booking: publicBooking(booking), room: getRoomById(booking.roomId) ?? null });
}
