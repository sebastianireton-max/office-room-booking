"use client";
// Import from the "/pure" subpath, NOT the package root. The root entry
// point has a side effect on module load: it injects Stripe.js's fraud-
// detection <script> tag on a timer regardless of whether loadStripe() is
// ever called (see @stripe/stripe-js/dist/index.mjs — the "Execute our own
// script injection" block). Because PaymentStep.tsx is statically imported
// by BookingFlow.tsx (even though it's only rendered at step 3), that side
// effect fired on every room page view, not just at checkout. "/pure" only
// loads Stripe.js when loadStripe() is actually invoked.
import { loadStripe } from "@stripe/stripe-js/pure";
// Type-only import — erased at compile time, no module evaluation, so this
// doesn't reintroduce the side effect the comment above avoids.
import type { Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/** Client-side Stripe.js singleton. Uses the PUBLISHABLE key only — safe for
 * the browser. The secret key never reaches client code. Design package
 * Section 10.3. */
export function getClientStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

export function isStripeClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
