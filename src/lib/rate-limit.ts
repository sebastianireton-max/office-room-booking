import "server-only";

// ponytail: fixed-window, in-memory, per process. Correct only on ONE
// long-running instance (which SQLite already requires). Multiple instances
// need a shared store; only this file changes.
// ponytail: clientKey trusts the rightmost X-Forwarded-For entry, i.e. assumes
// exactly one trusted proxy in front of the app. Adjust to the chosen host.

const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number): { allowed: boolean } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  if (bucket.count >= limit) return { allowed: false };
  bucket.count += 1;
  return { allowed: true };
}

export function clientKey(req: Request): string {
  // The leftmost X-Forwarded-For entry is client-supplied and spoofable; the
  // rightmost is what our own proxy saw on the TCP connection.
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
