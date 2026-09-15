import { NextRequest, NextResponse } from "next/server";
import { getBookingById, attachPaymentIntent, expireStaleHolds } from "@/lib/db/bookings-repository";
import { createPaymentIntentSchema } from "@/lib/validation";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

const HOLD_ENDED = "Your hold on this time ended before payment started. Go back and pick a time; it may still be open.";

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`payment-intent:${clientKey(req)}`, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  if (!isStripeConfigured()) {
    // Setup detail (env var names) lives in /admin, never in a public response.
    return NextResponse.json({ error: "Online payment isn't switched on yet. Please contact us to book." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createPaymentIntentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payment couldn't start. Try again, or go back and pick another time." }, { status: 400 });
  }

  // Release any holds that expired since they were created, then check this one.
  expireStaleHolds();
  const booking = getBookingById(parsed.data.bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ error: HOLD_ENDED }, { status: 409 });
  }

  try {
    const stripe = getStripe();
    // Price is never taken from the client: it is the server-computed value
    // snapshotted onto the booking when the hold was created.
    const intent = await stripe.paymentIntents.create({
      amount: booking.priceCents,
      currency: "usd",
      metadata: { bookingId: booking.id },
      automatic_payment_methods: { enabled: true },
    });

    const attached = attachPaymentIntent(booking.id, intent.id);
    if (!attached) {
      // The hold moved off pending_payment between our check above and now
      // (e.g. expireStaleHolds() firing on a concurrent request). No money
      // has been captured yet — cancel the intent rather than hand the
      // browser a clientSecret for a slot we no longer hold.
      await stripe.paymentIntents.cancel(intent.id).catch((cancelErr: Error) => {
        console.error("Failed to cancel orphaned PaymentIntent", intent.id, cancelErr.message);
      });
      return NextResponse.json({ error: HOLD_ENDED }, { status: 409 });
    }

    // attachPaymentIntent stretched the hold; the client shows this deadline, not the original one.
    const holdExpiresAt = getBookingById(booking.id)?.holdExpiresAt;
    return NextResponse.json({ clientSecret: intent.client_secret, holdExpiresAt });
  } catch (err) {
    console.error("create-payment-intent failed:", (err as Error).message);
    return NextResponse.json({ error: "Payment couldn't start. Try again, or go back and pick another time." }, { status: 502 });
  }
}
