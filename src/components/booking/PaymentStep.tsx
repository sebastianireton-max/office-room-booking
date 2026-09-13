"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { getClientStripe, isStripeClientConfigured } from "@/lib/stripe-client";
import { Button } from "@/components/Button";
import type { PublicBooking } from "@/lib/public-booking";

function InnerPaymentForm({ booking }: { booking: PublicBooking }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation/${booking.id}`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      // Matches the design package's card-decline copy, Section 6.6.
      setError(
        submitError.type === "card_error" || submitError.type === "validation_error"
          ? submitError.message ?? "Payment declined. Your card was declined by your bank. Try a different card or contact your bank."
          : "Something went wrong saving your booking. Your card has not been charged. Please try again."
      );
      setSubmitting(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      router.push(`/confirmation/${booking.id}`);
      return;
    }
    // Redirect-based payment methods leave this page entirely via return_url.
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? "Processing your payment, don't close this window…" : "Confirm & Pay"}
      </Button>
    </form>
  );
}

export function PaymentStep({ booking, clientSecret }: { booking: PublicBooking; clientSecret: string }) {
  if (!isStripeClientConfigured()) {
    return (
      <div className="flex flex-col gap-2 rounded-token-md border border-border-default bg-surface-raised p-4 text-sm text-text-secondary">
        <p className="font-medium text-text-primary">Stripe isn&apos;t connected yet.</p>
        <p>
          Add <code className="text-text-accent">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and{" "}
          <code className="text-text-accent">STRIPE_SECRET_KEY</code> to your own <code>.env.local</code> (see
          the README) to enable real payments. This screen will render the Stripe Payment Element automatically
          once both keys are set.
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={getClientStripe()}
      options={{
        clientSecret,
        appearance: {
          // RESTYLE 2026-08-31 — values mirror globals.css tokens (sun accent,
          // warm-paper neutrals). Stripe Elements renders in a CROSS-ORIGIN
          // IFRAME, so these must be literal values: CSS custom properties
          // from this document are not visible inside it, and nothing here
          // updates itself when the token layer changes. This block is the
          // single reason a substrate flip cannot be a pure token swap, and it
          // has to be re-checked by hand on every palette change. Skipping it
          // renders a dark card-entry field on a paper page, which is the same
          // failure the 2026-08-30 pass caught in the opposite direction.
          //
          // PAYMENT SURFACE, flagged per ORCHESTRATION.md guardrail 2. This is
          // the Elements appearance object only. The clientSecret and stripe
          // wiring above, and every server-side amount, are untouched.
          //
          // Verified against the paper substrate:
          //   text    #221E1A on field #FDFAF4 = 15.89:1
          //   error   #B3261E on field #FDFAF4 =  6.27:1
          //   primary #0F766E on field #FDFAF4 =  5.25:1
          theme: "flat",
          variables: {
            colorPrimary: "#0F766E",
            colorBackground: "#FDFAF4",
            colorText: "#221E1A",
            colorDanger: "#B3261E",
            borderRadius: "10px",
          },
        },
      }}
    >
      <InnerPaymentForm booking={booking} />
    </Elements>
  );
}
