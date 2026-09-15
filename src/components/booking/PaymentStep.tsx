"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { getClientStripe, isStripeClientConfigured } from "@/lib/stripe-client";
import { Button } from "@/components/Button";
import { formatUsd } from "@/lib/format";
import { SITE } from "@/lib/site-config";
import type { PublicBooking } from "@/lib/public-booking";

function InnerPaymentForm({ booking, amountCents }: { booking: PublicBooking; amountCents: number }) {
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
      // Card and field errors carry Stripe's specific message; anything else gets
      // a neutral line, because we cannot know whether a charge happened.
      setError(
        submitError.type === "card_error" || submitError.type === "validation_error"
          ? submitError.message ?? "Your bank declined this card. Try another card or contact your bank."
          : `Payment didn't go through. Check your details and try again. If you see a charge without a confirmation, email ${SITE.contactEmail}.`
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
      <Button type="submit" size="lg" disabled={!stripe || submitting} className="w-full">
        {submitting ? "Processing…" : `Pay ${formatUsd(amountCents)}`}
      </Button>
      {submitting && <p className="text-center text-sm text-text-secondary">Keep this page open.</p>}
    </form>
  );
}

export function PaymentStep({
  booking,
  clientSecret,
  amountCents,
}: {
  booking: PublicBooking;
  clientSecret: string;
  amountCents: number;
}) {
  if (!isStripeClientConfigured()) {
    // Public copy only; the missing env var names are listed in /admin.
    return (
      <div className="flex flex-col gap-1 rounded-token-md border border-border-default bg-surface-raised p-4 text-sm text-text-secondary">
        <p className="font-medium text-text-primary">Online payment isn&rsquo;t switched on yet.</p>
        <p>
          Please contact us to book:{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-text-accent underline underline-offset-4">
            {SITE.contactEmail}
          </a>
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
          // Values mirror globals.css tokens (teal accent, warm-paper
          // neutrals). Stripe Elements renders in a CROSS-ORIGIN
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
      <InnerPaymentForm booking={booking} amountCents={amountCents} />
    </Elements>
  );
}
