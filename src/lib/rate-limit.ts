import "server-only";

/**
 * Minimal in-memory rate limiter for booking/checkout endpoints (design
 * package Section 10.6). Fixed-window per IP + route key.
 *
 * PRODUCTION NOTE: in-memory state means this only works correctly on a
 * single long-running instance. Behind multiple serverless instances, swap
 * this for a shared store (e.g. Upstash Redis) — the call sites don't need
 * to change, only this file's internals.
 */

const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function clientKey(req: Request): string {
  // The LEFTMOST entry in X-Forwarded-For is client-supplied and trivially
  // spoofable (anyone can send `X-Forwarded-For: 1.2.3.4`). The RIGHTMOST
  // entry is the address your own edge/reverse proxy observed on the actual
  // TCP connection, which a client cannot inject past — trust that one.
  const fwd = req.headers.get("x-forwarded-for");
  const parts = fwd?.split(",").map((p) => p.trim()).filter(Boolean);
  return (parts && parts[parts.length - 1]) || "unknown";
}

// Periodic cleanup so the map doesn't grow unbounded over a long-lived process.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, WINDOW_MS).unref?.();
