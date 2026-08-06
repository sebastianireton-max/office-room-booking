import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";
import { generateIcs } from "@/lib/calendar";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/bookings/[id]/calendar">) {
  const { id } = await ctx.params;
  const booking = getBookingById(id);
  if (!booking || booking.status !== "confirmed") {
    return NextResponse.json({ error: "Booking not found or not confirmed." }, { status: 404 });
  }
  const room = getRoomById(booking.roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const ics = generateIcs(booking, room);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${booking.id}.ics"`,
    },
  });
}
