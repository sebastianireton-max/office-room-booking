import { NextResponse } from "next/server";
import { ROOMS } from "@/lib/rooms-data";

export async function GET() {
  return NextResponse.json({ rooms: ROOMS.filter((r) => r.active) });
}
