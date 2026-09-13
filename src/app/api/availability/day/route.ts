import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listAvailableSlots } from "@/lib/db/bookings-repository";
import { ROOMS } from "@/lib/rooms-data";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.coerce.number().int().min(60).max(480),
});

/** Open start times for every active room on one day, for the homepage finder. */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(`availability-day:${clientKey(req)}`, 30).allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }
  const parsed = schema.safeParse({
    date: req.nextUrl.searchParams.get("date"),
    durationMinutes: req.nextUrl.searchParams.get("durationMinutes") ?? "60",
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { date, durationMinutes } = parsed.data;
  const rooms = ROOMS.filter((r) => r.active).map((r) => ({
    roomId: r.id,
    open: listAvailableSlots(r.id, date, durationMinutes)
      .filter((s) => s.available)
      .map((s) => s.startTime),
  }));
  return NextResponse.json({ rooms });
}
