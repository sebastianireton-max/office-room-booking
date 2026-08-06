import { NextRequest, NextResponse } from "next/server";
import { getBookingById, attachPaymentIntent, expireStaleHolds } from "@/lib/db/bookings-repository";
import { createPaymentIntentSchema } from "@/lib/validation";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`payment-intent:${clientKey(req)}`, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe isn't connected yet. Add STRIPE_SECRET_KEY to .env.local (see .env.example) to enable real payments.",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createPaymentIntentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Release any holds that expired since they were created, then check this one.
  expireStaleHolds();
  const booking = getBookingById(parsed.data.bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.status !== "pending_payment") {
    // Covers the expired-hold case identically to the slot-taken case —
    // design package Section 9.7: "treat identically to the race-condition case".
    return NextResponse.json(
      { error: "That time slot was just booked by someone else. Please choose another time." },
      { status: 409 }
    );
  }

  try {
    const stripe = getStripe();
    // Price is never taken from the client — it's the server-computed value
    // snapshotted onto the booking when the hold was created (Section 10.4).
    const intent = await stripe.paymentIntents.create({
      amount: booking.priceCents,
      currency: "usd",
      metadata: { bookingId: booking.id },
      automatic_payment_methods: { enabled: true },
    });

    attachPaymentIntent(booking.id, intent.id);

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("create-payment-intent failed", err);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
