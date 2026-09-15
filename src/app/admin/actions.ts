"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require";
import { recordAudit } from "@/lib/db/accounts-repository";
import {
  cancelBooking,
  createBlock,
  deleteBlock,
  getBookingById,
  markConfirmationSent,
  resolvePaymentIssue,
  toMinutes,
} from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

/*
 * Admin mutations. SECURITY-RELEVANT: every action re-checks admin rights itself
 * (actions are callable directly, not only from the page), Next's Server Action
 * Origin check covers CSRF, and refunds carry a per-booking idempotency key so a
 * double submit can never refund twice.
 */

const back = (path: string, kind: "notice" | "error", message: string): never =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(message)}`);

async function guard() {
  const admin = await requireAdmin();
  if (!checkRateLimit(`admin:${admin.email}`, 60).allowed) back("/admin", "error", "Too many actions. Wait a minute.");
  return admin;
}

async function refund(paymentIntentId: string, bookingId: string): Promise<string> {
  const r = await getStripe().refunds.create(
    { payment_intent: paymentIntentId, metadata: { bookingId } },
    { idempotencyKey: `refund-${bookingId}` }
  );
  return r.id;
}

export async function cancelBookingAction(formData: FormData) {
  const admin = await guard();
  const id = z.string().uuid().parse(formData.get("id"));
  const withRefund = formData.get("refund") === "on";
  const path = `/admin/bookings/${id}`;

  const booking = getBookingById(id);
  if (!booking) back("/admin/bookings", "error", "Booking not found.");
  if (booking!.status !== "confirmed" && booking!.status !== "pending_payment") {
    back(path, "error", `A ${booking!.status} booking cannot be cancelled.`);
  }

  let refundId: string | null = null;
  if (withRefund) {
    if (!booking!.stripePaymentIntentId || !isStripeConfigured()) back(path, "error", "No Stripe payment to refund.");
    try {
      refundId = await refund(booking!.stripePaymentIntentId!, id);
    } catch (err) {
      // Stripe's message can echo a masked key fragment: log it, keep it out of the URL.
      console.error("Refund failed", (err as Error).message);
      back(path, "error", "Stripe refused the refund. Check the server logs. The booking was NOT cancelled.");
    }
  }

  cancelBooking(id, refundId);
  recordAudit(admin.email, withRefund ? "cancel+refund" : "cancel", id, refundId ?? undefined);
  revalidatePath("/admin", "layout");
  back(path, "notice", withRefund ? "Cancelled and refunded. The slot is open again." : "Cancelled. The slot is open again.");
}

export async function refundIssueAction(formData: FormData) {
  const admin = await guard();
  const id = z.string().uuid().parse(formData.get("id"));
  const path = `/admin/bookings/${id}`;
  const booking = getBookingById(id);
  if (!booking?.paymentIssue || !booking.stripePaymentIntentId) back(path, "error", "Nothing to refund here.");

  try {
    const refundId = await refund(booking!.stripePaymentIntentId!, id);
    resolvePaymentIssue(id, refundId);
    recordAudit(admin.email, "refund-issue", id, refundId);
  } catch (err) {
    console.error("Refund failed", (err as Error).message);
    back(path, "error", "Stripe refused the refund. Check the server logs.");
  }
  revalidatePath("/admin", "layout");
  back(path, "notice", "Refunded. Issue cleared.");
}

export async function dismissIssueAction(formData: FormData) {
  const admin = await guard();
  const id = z.string().uuid().parse(formData.get("id"));
  resolvePaymentIssue(id, null);
  recordAudit(admin.email, "dismiss-issue", id, String(formData.get("note") ?? "").slice(0, 300) || undefined);
  revalidatePath("/admin", "layout");
  back(`/admin/bookings/${id}`, "notice", "Issue marked as handled.");
}

export async function resendConfirmationAction(formData: FormData) {
  const admin = await guard();
  const id = z.string().uuid().parse(formData.get("id"));
  const path = `/admin/bookings/${id}`;
  const booking = getBookingById(id);
  const room = booking && getRoomById(booking.roomId);
  if (!booking || !room || booking.status !== "confirmed") back(path, "error", "Only confirmed bookings get a confirmation.");
  const sent = await sendBookingConfirmation(booking!, room!).catch(() => false);
  if (!sent) back(path, "error", "Email did not send. Check RESEND_API_KEY and EMAIL_FROM.");
  markConfirmationSent(id);
  recordAudit(admin.email, "resend-confirmation", id);
  // No customer email in the redirect: query strings land in history and access logs.
  back(path, "notice", "Confirmation sent.");
}

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const blockSchema = z
  .object({
    roomId: z.string().max(64),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: hhmm,
    endTime: hhmm,
    reason: z.string().trim().min(1, "Give a reason.").max(200),
  })
  .refine((v) => toMinutes(v.endTime) > toMinutes(v.startTime), "End time must be after start time.")
  .refine((v) => v.roomId === "all" || Boolean(getRoomById(v.roomId)), "Unknown room.");

export async function createBlockAction(formData: FormData) {
  const admin = await guard();
  const parsed = blockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) back("/admin/blocks", "error", parsed.error.issues[0].message);
  const v = parsed.data!;
  const { id, clashes } = createBlock({
    roomId: v.roomId === "all" ? null : v.roomId,
    date: v.date,
    startTime: v.startTime,
    endTime: v.endTime,
    reason: v.reason,
    createdBy: admin.email,
  });
  recordAudit(admin.email, "block", id, `${v.roomId} ${v.date} ${v.startTime}-${v.endTime}: ${v.reason}`);
  revalidatePath("/admin", "layout");
  back(
    "/admin/blocks",
    "notice",
    clashes.length
      ? `Blocked. ${clashes.length} confirmed booking${clashes.length === 1 ? " already sits" : "s already sit"} inside this window and ${clashes.length === 1 ? "was" : "were"} NOT cancelled: ${clashes
          .map((b) => b.id.slice(0, 8))
          .join(", ")}.`
      : "Blocked. Those times no longer show as bookable."
  );
}

export async function deleteBlockAction(formData: FormData) {
  const admin = await guard();
  const id = z.string().uuid().parse(formData.get("id"));
  if (deleteBlock(id)) recordAudit(admin.email, "unblock", id);
  revalidatePath("/admin", "layout");
  back("/admin/blocks", "notice", "Block removed.");
}
