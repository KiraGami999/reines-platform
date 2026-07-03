/**
 * In-memory sliding-window rate limiter.
 *
 * Works for single-server / traditional deployments. For multi-instance or
 * serverless (Vercel cold-start) deployments you would swap this for a Redis
 * or Upstash-backed limiter — the API surface (`checkRateLimit`) stays the same.
 *
 * Memory is kept clean by a periodic sweep that removes entries whose
 * last hit is older than 1 hour.
 */

interface Window {
  hits: number[]; // Unix ms timestamps
}

const store = new Map<string, Window>();

// Lazy cleanup — fires every 10 minutes once the store is first written to.
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const cutoff = Date.now() - 60 * 60_000;
    for (const [key, w] of store) {
      w.hits = w.hits.filter((t) => t > cutoff);
      if (w.hits.length === 0) store.delete(key);
    }
  }, 10 * 60_000);
}

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetAt:   number; // Unix ms when the oldest hit falls outside the window
}

/**
 * Checks (and records) a hit against `key`.
 * `limit`    — max hits allowed in the window.
 * `windowMs` — sliding window length in milliseconds.
 */
export function checkRateLimit(
  key:      string,
  limit:    number,
  windowMs: number
): RateLimitResult {
  scheduleCleanup();

  const now   = Date.now();
  const entry = store.get(key) ?? { hits: [] };

  // Drop hits outside the current window.
  entry.hits = entry.hits.filter((t) => now - t < windowMs);

  const allowed = entry.hits.length < limit;
  if (allowed) entry.hits.push(now);

  store.set(key, entry);

  const oldest = entry.hits[0] ?? now;
  return {
    allowed,
    remaining: Math.max(0, limit - entry.hits.length),
    resetAt:   oldest + windowMs,
  };
}

/**
 * Extracts the best available client IP from a Next.js request.
 * Falls back to "unknown" so callers always get a usable rate-limit key.
 */
export function getClientIp(req: Request): string {
  const headers = (req as { headers?: Headers }).headers;
  if (!headers) return "unknown";
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
