import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  const { id } = await ctx.params;
  const booking = getBookingById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  const room = getRoomById(booking.roomId);
  return NextResponse.json({ booking, room });
}
