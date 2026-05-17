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

/**
 * Extract a best-effort client IP from forwarded headers.
 *
 * Security note: the LEFTMOST entry of `X-Forwarded-For` is supplied by the
 * client and is spoofable — an attacker can send `X-Forwarded-For: 1.2.3.4`
 * to make every rate-limit counter look like it belongs to a different
 * victim. The RIGHTMOST entry is the IP that the immediate upstream proxy
 * observed at its socket, which the proxy appends and the client cannot
 * forge. We default to "1 trusted proxy" (the typical single-Nginx setup),
 * controllable via `TRUSTED_PROXY_COUNT` env if more proxy hops exist.
 *
 * Falls back to `X-Real-IP` (set by Nginx from the real socket) then to
 * `CF-Connecting-IP` (Cloudflare's authoritative client IP, never client-set).
 * Both are safer than trusting the XFF leftmost entry.
 */
export function clientIp(headers: Headers): string {
  const trustedHops = Math.max(
    1,
    Number(process.env.TRUSTED_PROXY_COUNT ?? 1) || 1,
  );

  const fwd = headers.get('x-forwarded-for');
  if (fwd) {
    const parts = fwd
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      const idx = Math.max(0, parts.length - trustedHops);
      return parts[idx]!;
    }
  }
  return (
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    'unknown'
  );
}
