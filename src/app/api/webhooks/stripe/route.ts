import { after, NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  cancelBooking,
  confirmBookingByPaymentIntent,
  getBookingByPaymentIntent,
  markConfirmationSent,
  releaseHoldOnPaymentFailure,
} from "@/lib/db/bookings-repository";
import { getRoomById } from "@/lib/rooms-data";
import { sendBookingConfirmation } from "@/lib/email";

/**
 * Stripe webhook: the ONLY place a booking becomes confirmed. Every event is
 * signature-verified before anything is trusted. SECURITY-RELEVANT.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (err) {
    // Message only: the error object carries the raw event payload (customer data).
    console.error("Stripe webhook signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const result = confirmBookingByPaymentIntent(event.data.object.id);
      if (!result) break;
      // Only on the first confirmation, so Stripe's retries do not re-send.
      const room = getRoomById(result.booking.roomId);
      if (result.newlyConfirmed && room) {
        const { booking } = result;
        // After the 200, so a slow mail API never makes Stripe time out and retry.
        after(async () => {
          const sent = await sendBookingConfirmation(booking, room).catch((err: Error) => {
            console.error(`Confirmation email failed for ${booking.id}:`, err.message);
            return false;
          });
          if (sent) markConfirmationSent(booking.id);
        });
      }
      break;
    }
    case "payment_intent.payment_failed":
    case "payment_intent.canceled":
      releaseHoldOnPaymentFailure(event.data.object.id);
      break;
    case "charge.refunded": {
      // A full refund issued from the Stripe dashboard frees the slot too.
      const charge = event.data.object;
      if (charge.refunded && typeof charge.payment_intent === "string") {
        const booking = getBookingByPaymentIntent(charge.payment_intent);
        if (booking) cancelBooking(booking.id, charge.refunds?.data[0]?.id ?? null);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
