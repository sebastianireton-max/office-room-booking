"use client";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

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
