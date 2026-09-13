import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

/** The signed-in customer's name and email, for prefilling the booking form. */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    { user: user ? { name: user.name, email: user.email } : null },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
