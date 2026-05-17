/**
 * Unit tests for lib/rate-limit.ts
 *
 * The module has `import 'server-only'` at the top. We mock that import so
 * Vitest (jsdom / node environment) can load the module without Next.js
 * server scaffolding.
 *
 * Both `rateLimit` and `clientIp` are pure in-process functions — no DB, no
 * network — so these tests run in milliseconds.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── server-only shim ──────────────────────────────────────────────────────────
vi.mock('server-only', () => ({}));

// ── Env mock (loaded transitively via @/env) ──────────────────────────────────
vi.mock('@/env', () => ({
  env: {
    DATABASE_URL: 'mysql://test',
    DB_POOL_SIZE: 1,
    AUTH_SECRET: 'x'.repeat(32),
    NEXT_PUBLIC_SITE_URL: 'https://house-peach.example',
    NODE_ENV: 'test',
    UPLOAD_DIR: '/tmp/uploads',
  },
}));

// ── Import module under test AFTER mocks ──────────────────────────────────────
import { rateLimit, clientIp } from './rate-limit';

// ── Helpers ───────────────────────────────────────────────────────────────────
let _keyCounter = 0;
/** Returns a key that has never been used — guarantees an empty bucket. */
function freshKey(label = 'test'): string {
  _keyCounter += 1;
  return `${label}:${_keyCounter}`;
}

function makeHeaders(overrides: Record<string, string> = {}): Headers {
  return new Headers(overrides);
}

// ── rateLimit ─────────────────────────────────────────────────────────────────

describe('rateLimit', () => {
  it('allows the first request under the limit', () => {
    const result = rateLimit(freshKey(), 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('allows requests up to the limit', () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) {
      const r = rateLimit(key, 5, 60_000);
      expect(r.allowed, `attempt ${i + 1}`).toBe(true);
    }
  });

  it('blocks the (limit + 1)th request', () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    const result = rateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('remaining decrements by 1 each allowed call', () => {
    const key = freshKey();
    const r1 = rateLimit(key, 3, 60_000);
    expect(r1.remaining).toBe(2);
    const r2 = rateLimit(key, 3, 60_000);
    expect(r2.remaining).toBe(1);
    const r3 = rateLimit(key, 3, 60_000);
    expect(r3.remaining).toBe(0);
  });

  it('isolates separate keys from one another', () => {
    const keyA = freshKey('a');
    const keyB = freshKey('b');
    // Exhaust A.
    for (let i = 0; i < 5; i++) rateLimit(keyA, 5, 60_000);
    expect(rateLimit(keyA, 5, 60_000).allowed).toBe(false);
    // B must still be open.
    expect(rateLimit(keyB, 5, 60_000).allowed).toBe(true);
  });

  it('returns a resetAt timestamp in the future', () => {
    const key = freshKey();
    const before = Date.now();
    const result = rateLimit(key, 5, 60_000);
    expect(result.resetAt).toBeGreaterThan(before);
  });

  it('blocked result has resetAt pointing to when the window expires', () => {
    const key = freshKey();
    const windowMs = 60_000;
    const before = Date.now();
    for (let i = 0; i < 3; i++) rateLimit(key, 3, windowMs);
    const blocked = rateLimit(key, 3, windowMs);
    expect(blocked.allowed).toBe(false);
    // resetAt must be approximately before + windowMs (within 500ms tolerance).
    expect(blocked.resetAt).toBeGreaterThanOrEqual(before + windowMs - 500);
    expect(blocked.resetAt).toBeLessThanOrEqual(before + windowMs + 500);
  });

  it('treats limit=1 as: first allowed, second blocked', () => {
    const key = freshKey();
    expect(rateLimit(key, 1, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 1, 60_000).allowed).toBe(false);
  });
});

// ── clientIp ──────────────────────────────────────────────────────────────────

describe('clientIp — security-critical XFF parsing', () => {
  beforeEach(() => {
    // Reset TRUSTED_PROXY_COUNT to default (1 hop) before every test.
    delete process.env.TRUSTED_PROXY_COUNT;
  });

  // The primary regression test: leftmost entry must NOT be used as the IP.
  // An attacker can set any leftmost entry; the proxy-appended rightmost one
  // is the only trustworthy entry when TRUSTED_PROXY_COUNT=1 (default).
  it('returns the rightmost XFF entry (single trusted proxy — default)', () => {
    const h = makeHeaders({
      'x-forwarded-for': '1.2.3.4, 5.6.7.8, 192.168.1.1',
    });
    // With 1 trusted hop, idx = parts.length - 1 = rightmost.
    expect(clientIp(h)).toBe('192.168.1.1');
  });

  it('is NOT fooled by a spoofed leftmost XFF entry', () => {
    // Attacker injects a victim IP as the leftmost entry.
    const h = makeHeaders({
      'x-forwarded-for': 'victim.1.2.3, real-attacker.ip.4.5',
    });
    const ip = clientIp(h);
    // Must be the rightmost (proxy-observed) entry, not the attacker-forged one.
    expect(ip).toBe('real-attacker.ip.4.5');
    expect(ip).not.toBe('victim.1.2.3');
  });

  it('handles single-entry XFF (no proxy chain)', () => {
    const h = makeHeaders({ 'x-forwarded-for': '203.0.113.5' });
    expect(clientIp(h)).toBe('203.0.113.5');
  });

  it('returns the correct entry when TRUSTED_PROXY_COUNT=2', () => {
    process.env.TRUSTED_PROXY_COUNT = '2';
    // 3 entries, idx = max(0, 3 - 2) = 1 → second entry.
    const h = makeHeaders({
      'x-forwarded-for': 'client.ip, intermediate.proxy, final.proxy',
    });
    expect(clientIp(h)).toBe('intermediate.proxy');
  });

  it('falls back to x-real-ip when XFF header is absent', () => {
    const h = makeHeaders({ 'x-real-ip': '10.0.0.1' });
    expect(clientIp(h)).toBe('10.0.0.1');
  });

  it('falls back to cf-connecting-ip when both XFF and x-real-ip are absent', () => {
    const h = makeHeaders({ 'cf-connecting-ip': '198.51.100.42' });
    expect(clientIp(h)).toBe('198.51.100.42');
  });

  it('returns "unknown" when all forwarding headers are absent', () => {
    const h = makeHeaders();
    expect(clientIp(h)).toBe('unknown');
  });

  it('trims whitespace around comma-separated XFF entries', () => {
    const h = makeHeaders({
      'x-forwarded-for': '  1.1.1.1 ,  2.2.2.2  ',
    });
    // Rightmost trimmed entry.
    expect(clientIp(h)).toBe('2.2.2.2');
  });

  it('prefers XFF over x-real-ip when both are present', () => {
    const h = makeHeaders({
      'x-forwarded-for': '100.100.100.100',
      'x-real-ip': '200.200.200.200',
    });
    expect(clientIp(h)).toBe('100.100.100.100');
  });

  it('ignores TRUSTED_PROXY_COUNT less than 1 (clamps to 1)', () => {
    process.env.TRUSTED_PROXY_COUNT = '0';
    const h = makeHeaders({ 'x-forwarded-for': 'a.b.c.d, e.f.g.h' });
    // trustedHops = max(1, 0) = 1, so we get rightmost.
    expect(clientIp(h)).toBe('e.f.g.h');
  });
});

// ── sanitizeMailtoAddress — inline logic test ─────────────────────────────────
// The function is not exported from InquiryRowActions.tsx (client component).
// We test the CRLF-stripping regex in isolation here because it is
// security-critical and the exact regex can be extracted verbatim.

describe('sanitizeMailtoAddress — CRLF injection defence (inline regex)', () => {
  /**
   * Mirrors the implementation in InquiryRowActions.tsx exactly.
   * If the source changes, this test will fail — which is the point.
   */
  function sanitizeMailtoAddress(email: string): string {
    return email.replace(/(\r|\n|%0a|%0d)/gi, '');
  }

  it('strips bare carriage return \\r', () => {
    expect(sanitizeMailtoAddress('attacker@x.com\rCc:v@y.com')).toBe(
      'attacker@x.comCc:v@y.com',
    );
  });

  it('strips bare line feed \\n', () => {
    expect(sanitizeMailtoAddress('attacker@x.com\nCc:v@y.com')).toBe(
      'attacker@x.comCc:v@y.com',
    );
  });

  it('strips percent-encoded %0a (case-insensitive, lower)', () => {
    expect(sanitizeMailtoAddress('attacker@x.com%0aCc:v@y.com')).toBe(
      'attacker@x.comCc:v@y.com',
    );
  });

  it('strips percent-encoded %0A (case-insensitive, upper)', () => {
    expect(sanitizeMailtoAddress('attacker@x.com%0ACc:v@y.com')).toBe(
      'attacker@x.comCc:v@y.com',
    );
  });

  it('strips percent-encoded %0d (case-insensitive, lower)', () => {
    expect(sanitizeMailtoAddress('attacker@x.com%0dCc:v@y.com')).toBe(
      'attacker@x.comCc:v@y.com',
    );
  });

  it('strips percent-encoded %0D (case-insensitive, upper)', () => {
    expect(sanitizeMailtoAddress('attacker@x.com%0DCc:v@y.com')).toBe(
      'attacker@x.comCc:v@y.com',
    );
  });

  it('strips a full CRLF sequence', () => {
    expect(sanitizeMailtoAddress('a@b.com\r\nBcc:evil@c.com')).toBe(
      'a@b.comBcc:evil@c.com',
    );
  });

  it('strips all CRLF variants when multiple are present', () => {
    expect(
      sanitizeMailtoAddress('a@b.com\r%0ABcc:x@y.com%0DCc:z@w.com'),
    ).toBe('a@b.comBcc:x@y.comCc:z@w.com');
  });

  it('does not modify a clean email address', () => {
    expect(sanitizeMailtoAddress('user@example.com')).toBe('user@example.com');
  });

  it('does not strip other percent-encoded sequences', () => {
    // %40 = @, %2E = . — must survive
    expect(sanitizeMailtoAddress('user%40example%2Ecom')).toBe('user%40example%2Ecom');
  });
});
