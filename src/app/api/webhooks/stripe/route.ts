import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { confirmBookingByPaymentIntent } from "@/lib/db/bookings-repository";
import Stripe from "stripe";

/**
 * Stripe webhook — the ONLY place a booking is marked confirmed. Every event
 * is signature-verified before anything is trusted; an unverified payload is
 * never acted on. This is what makes "confirmed" mean the money actually
 * arrived, not just that the client redirected to a success page. Design
 * package Section 10.3.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const booking = confirmBookingByPaymentIntent(intent.id);
      if (!booking) {
        console.error("payment_intent.succeeded for unknown booking", intent.id);
      }
      break;
    }
    // payment_intent.payment_failed intentionally left as a no-op: the
    // booking simply stays pending_payment until its hold expires, at which
    // point expireStaleHolds() releases the slot automatically.
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
