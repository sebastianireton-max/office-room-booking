import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listAvailableSlots } from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";
import { addDaysIso } from "@/lib/format";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  roomId: z.string().min(1).max(64),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.coerce.number().int().min(1).max(14),
  durationMinutes: z.coerce.number().int().min(30).max(480),
});

/** Open start-time counts per day for one room, for the booking panel's week strip. */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(`availability-week:${clientKey(req)}`, 60).allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }
  const q = req.nextUrl.searchParams;
  const parsed = schema.safeParse({
    roomId: q.get("roomId"),
    from: q.get("from"),
    days: q.get("days") ?? "7",
    durationMinutes: q.get("durationMinutes") ?? "60",
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { roomId, from, days, durationMinutes } = parsed.data;
  const room = getRoomById(roomId);
  if (!room || !room.active) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  return NextResponse.json({
    days: Array.from({ length: days }, (_, i) => {
      const date = addDaysIso(from, i);
      return { date, openCount: listAvailableSlots(roomId, date, durationMinutes).filter((s) => s.available).length };
    }),
  });
}
