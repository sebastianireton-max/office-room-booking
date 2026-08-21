"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { getClientStripe, isStripeClientConfigured } from "@/lib/stripe-client";
import { Button } from "@/components/Button";
import type { Booking } from "@/types/domain";

function InnerPaymentForm({ booking }: { booking: Booking }) {
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

export function PaymentStep({ booking, clientSecret }: { booking: Booking; clientSecret: string }) {
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
          // Light editorial restyle 2026-08-07 — values mirror globals.css
          // tokens (coral-600 accent, warm neutrals). Visual config only;
          // the clientSecret/stripe wiring above is untouched.
          theme: "stripe",
          variables: {
            colorPrimary: "#C93A20",
            colorBackground: "#FFFFFF",
            colorText: "#1C1A18",
            colorDanger: "#D92D20",
            borderRadius: "6px",
          },
        },
      }}
    >
      <InnerPaymentForm booking={booking} />
    </Elements>
  );
}
