import { NextRequest, NextResponse } from "next/server";
import { listAvailableSlots } from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";
import { availabilityQuerySchema } from "@/lib/validation";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(`availability:${clientKey(req)}`, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const parsed = availabilityQuerySchema.safeParse({
    roomId: req.nextUrl.searchParams.get("roomId"),
    date: req.nextUrl.searchParams.get("date"),
    durationMinutes: req.nextUrl.searchParams.get("durationMinutes") ?? "60",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const room = getRoomById(parsed.data.roomId);
  if (!room || !room.active) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const slots = listAvailableSlots(parsed.data.roomId, parsed.data.date, parsed.data.durationMinutes);
  return NextResponse.json({ slots });
}
