import 'server-only';

/**
 * Tiny in-memory rate limiter — sliding window. Suitable for V1 single-node
 * deployment. Swap for `@upstash/ratelimit` + Redis when going serverless.
 *
 * Keys are app-specific identifiers (typically `${endpoint}:${ip}`).
 */
const buckets = new Map<string, number[]>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    const earliest = hits[0]!;
    return { allowed: false, remaining: 0, resetAt: earliest + windowMs };
  }
  hits.push(now);
  buckets.set(key, hits);

  // GC: drop the oldest keys occasionally to keep the map small.
  if (buckets.size > 5000 && Math.random() < 0.01) {
    for (const [k, v] of buckets) {
      if (v[v.length - 1]! < windowStart) buckets.delete(k);
    }
  }

  return {
    allowed: true,
    remaining: limit - hits.length,
    resetAt: hits[0]! + windowMs,
  };
}

/** Extract a best-effort client IP from forwarded headers. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return (
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    'unknown'
  );
}
