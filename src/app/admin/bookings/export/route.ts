import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { listBookings } from "@/lib/db/bookings-repository";
import { recordAudit } from "@/lib/db/accounts-repository";
import { getRoomById } from "@/lib/rooms-data";
import type { BookingStatus } from "@/types/domain";

/** CSV of bookings matching the list filters. Contains customer PII: admin only. */
export async function GET(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!isAdmin(admin)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const p = req.nextUrl.searchParams;
  const date = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const rows = listBookings(
    {
      status: (p.get("status") || undefined) as BookingStatus | "issue" | undefined,
      roomId: p.get("room") || undefined,
      from: date(p.get("from")),
      to: date(p.get("to")),
      q: p.get("q")?.slice(0, 100) || undefined,
    },
    10_000
  );

  // Leading = + - @ would make a spreadsheet evaluate the cell as a formula.
  const cell = (v: unknown) => {
    const s = String(v ?? "");
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const header = ["reference", "date", "start", "end", "room", "customer", "email", "phone", "total_usd", "status", "refund_id", "issue", "created_at"];
  const lines = rows.map((b) =>
    [b.id, b.date, b.startTime, b.endTime, getRoomById(b.roomId)?.name ?? b.roomId, b.customerName, b.customerEmail, b.customerPhone, (b.priceCents / 100).toFixed(2), b.status, b.stripeRefundId, b.paymentIssue, b.createdAt]
      .map(cell)
      .join(",")
  );
  recordAudit(admin.email, "export-csv", `${rows.length} rows`, p.toString() || undefined);

  return new NextResponse([header.join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
