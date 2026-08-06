import "server-only";
import Stripe from "stripe";

/**
 * Server-side Stripe client. STRIPE_SECRET_KEY is read from the environment
 * only — never hardcoded, never sent to the client. See .env.example and the
 * design package Section 10.1/10.3.
 *
 * This throws at first use (not at import time) if the key is missing, so
 * the rest of the app can still build/run without Stripe configured yet.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your own Stripe secret key to .env.local — see .env.example. " +
        "This app never ships with a real key baked in."
    );
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
