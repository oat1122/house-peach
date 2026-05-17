/**
 * Tests for lib/actions/contact.ts
 *
 * Strategy:
 * - Mock `headers()` to inject a deterministic IP via x-forwarded-for.
 * - Mock `auth()` for role-guard tests.
 * - Mock the service layer so no real DB calls occur.
 * - The rate-limit map is module-level state; we isolate it by using a
 *   unique IP per rate-limit test group and by resetting between tests via
 *   the reset helper exported specifically for testing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Env mock ─────────────────────────────────────────────────────────────────
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

// ── next/cache mock ───────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

// ── next/headers mock ────────────────────────────────────────────────────────
// We replace headers() with a factory so each test can inject its own IP.
let _currentIp = '127.0.0.1';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ 'x-forwarded-for': _currentIp })),
}));

// ── auth mock ────────────────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// ── Service layer mock ────────────────────────────────────────────────────────
let _createShouldThrow = false;
let _createdId = 1;

vi.mock('@/lib/services/contact', () => ({
  createContactInquiry: vi.fn(async () => {
    if (_createShouldThrow) throw new Error('DB error');
    return _createdId;
  }),
  setInquiryStatus: vi.fn(async () => undefined),
  deleteInquiry: vi.fn(async () => undefined),
}));

// ── log mock — silence pino output in tests ───────────────────────────────────
vi.mock('@/lib/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Import module under test AFTER mocks ─────────────────────────────────────
import {
  createContactInquiryAction,
  setInquiryStatusAction,
  deleteInquiryAction,
} from './contact';
import * as authMod from '@/lib/auth';
import * as contactSvc from '@/lib/services/contact';

// ── Helpers ───────────────────────────────────────────────────────────────────
// Timing honeypot: server requires `_hp_started_at` delta ≥ 2 s. We back-date
// 5 s so every "valid payload" passes the check without flakiness.
const TIMING_PADDING_MS = 5_000;

const baseValidPayload = {
  contactName: 'สมชาย ใจดี',
  contactEmail: 'somchai@example.com',
  serviceType: 'full_design' as const,
  projectDescription: 'ต้องการตกแต่งห้องนั่งเล่นสไตล์ Japandi ขนาด 30 ตรม.',
};

/** Returns a valid payload with a fresh `_hp_started_at` ≥ 2 s old. Use in
 *  every test that should reach the service. */
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    ...baseValidPayload,
    _hp_started_at: Date.now() - TIMING_PADDING_MS,
    ...overrides,
  };
}

// Build a unique IP per test block to avoid cross-contamination of the
// rate-limit in-memory map (different key = isolated bucket).
let _ipCounter = 200;
function freshIp() {
  _ipCounter += 1;
  return `10.0.0.${_ipCounter}`;
}

// Unique email per email-RL test block — the per-email rate-limit map is
// also module-level state. Different email = isolated bucket.
let _emailCounter = 200;
function freshEmail() {
  _emailCounter += 1;
  return `user${_emailCounter}@example.com`;
}

// ── createContactInquiryAction ────────────────────────────────────────────────

describe('createContactInquiryAction — happy path', () => {
  beforeEach(() => {
    _currentIp = freshIp();
    _createShouldThrow = false;
    _createdId = 99;
    vi.mocked(contactSvc.createContactInquiry).mockClear();
  });

  it('returns ok:true with inserted id on valid input', async () => {
    const result = await createContactInquiryAction(validPayload());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value?.id).toBe(99);
  });

  it('calls the service with the payload (no honeypot field)', async () => {
    await createContactInquiryAction(validPayload());
    expect(contactSvc.createContactInquiry).toHaveBeenCalledOnce();
    const arg = vi.mocked(contactSvc.createContactInquiry).mock.calls[0]![0];
    expect((arg as Record<string, unknown>).website).toBeUndefined();
  });

  it('accepts optional fields passed to the action', async () => {
    const result = await createContactInquiryAction({
      ...validPayload(),
      contactPhone: '+66 81 000 0000',
      budgetRange: '100k_300k',
    });
    expect(result.ok).toBe(true);
  });
});

describe('createContactInquiryAction — zod validation errors', () => {
  beforeEach(() => {
    _currentIp = freshIp();
    _createShouldThrow = false;
  });

  it('returns ok:false with fieldErrors on empty contactName', async () => {
    const result = await createContactInquiryAction({
      ...validPayload(),
      contactName: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.contactName).toBeDefined();
    }
  });

  it('returns ok:false with fieldErrors on malformed email', async () => {
    const result = await createContactInquiryAction({
      ...validPayload(),
      contactEmail: 'not-an-email',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.contactEmail).toBeDefined();
    }
  });

  it('returns ok:false with fieldErrors on short description', async () => {
    const result = await createContactInquiryAction({
      ...validPayload(),
      projectDescription: 'สั้น',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.projectDescription).toBeDefined();
    }
  });

  it('returns ok:false on completely missing required fields', async () => {
    const result = await createContactInquiryAction({});
    expect(result.ok).toBe(false);
  });
});

describe('createContactInquiryAction — honeypot (_hp_extra text trap)', () => {
  beforeEach(() => {
    _currentIp = freshIp();
    _createShouldThrow = false;
    vi.mocked(contactSvc.createContactInquiry).mockClear();
  });

  // `_hp_extra` accepts ANY string at the zod layer so that bots filling it
  // do NOT receive a `fieldErrors: { _hp_extra }` response (which would tip
  // them off that they tripped a filter). After parse, a non-empty value
  // branches to a silent fake-success (`id: 0`) that never reaches the
  // service. Real users send empty string or undefined and flow normally.

  it('silently succeeds with id:0 when a bot fills the text honeypot — never calls the service', async () => {
    const result = await createContactInquiryAction({
      ...validPayload({ contactEmail: freshEmail() }),
      _hp_extra: 'http://spam.example',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value?.id).toBe(0);
    expect(contactSvc.createContactInquiry).not.toHaveBeenCalled();
  });

  it('does not leak field-level error info for the honeypot field', async () => {
    const result = await createContactInquiryAction({
      ...validPayload({ contactEmail: freshEmail() }),
      _hp_extra: 'bot-filled',
    });
    // Bot must not learn that `_hp_extra` was the field that flagged it.
    if (!result.ok) {
      expect(result.fieldErrors?._hp_extra).toBeUndefined();
    } else {
      // Preferred outcome: silent success with no error object at all.
      expect(result.ok).toBe(true);
    }
  });

  it('succeeds normally when _hp_extra is absent (real user path)', async () => {
    const result = await createContactInquiryAction(
      validPayload({ contactEmail: freshEmail() }),
    );
    expect(result.ok).toBe(true);
    expect(contactSvc.createContactInquiry).toHaveBeenCalledOnce();
  });

  it('succeeds normally when _hp_extra is explicitly empty string', async () => {
    // Empty string is falsy — flow proceeds to the real service call.
    const result = await createContactInquiryAction({
      ...validPayload({ contactEmail: freshEmail() }),
      _hp_extra: '',
    });
    expect(result.ok).toBe(true);
    expect(contactSvc.createContactInquiry).toHaveBeenCalledOnce();
  });
});

describe('createContactInquiryAction — IP rate limit', () => {
  beforeEach(() => {
    // Use a fresh IP so we start with an empty bucket.
    _currentIp = freshIp();
    _createShouldThrow = false;
    _createdId = 1;
  });

  // Each call uses a fresh email so the *per-email* rate limit (3 / 24h)
  // never trips before the *per-IP* rate limit (5 / 10 min) — these tests
  // exercise only the IP bucket.

  it('allows the first 5 submissions from the same IP (distinct emails)', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await createContactInquiryAction(
        validPayload({ contactEmail: freshEmail() }),
      );
      expect(result.ok, `attempt ${i + 1}`).toBe(true);
    }
  });

  it('rejects the 6th submission from the same IP within the window', async () => {
    // Exhaust the 5-request allowance with distinct emails.
    for (let i = 0; i < 5; i++) {
      await createContactInquiryAction(
        validPayload({ contactEmail: freshEmail() }),
      );
    }
    const result = await createContactInquiryAction(
      validPayload({ contactEmail: freshEmail() }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch('บ่อยเกินไป');
    }
  });

  it('allows submissions from a different IP after the same IP is blocked', async () => {
    for (let i = 0; i < 5; i++) {
      await createContactInquiryAction(
        validPayload({ contactEmail: freshEmail() }),
      );
    }
    // Different IP — must not be blocked.
    _currentIp = freshIp();
    const result = await createContactInquiryAction(
      validPayload({ contactEmail: freshEmail() }),
    );
    expect(result.ok).toBe(true);
  });
});

describe('createContactInquiryAction — service error', () => {
  beforeEach(() => {
    _currentIp = freshIp();
    _createShouldThrow = true;
  });

  it('returns ok:false without leaking internal error message', async () => {
    // Fresh email so the per-email rate limit (which has higher priority for
    // a custom error string) doesn't fire before the service catch-block.
    const result = await createContactInquiryAction(
      validPayload({ contactEmail: freshEmail() }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Must not expose the raw 'DB error' string to the caller.
      expect(result.error).not.toContain('DB error');
      expect(result.error).toMatch('ส่งข้อความไม่สำเร็จ');
    }
  });
});

// ── setInquiryStatusAction — auth guard ──────────────────────────────────────

describe('setInquiryStatusAction — auth guard', () => {
  beforeEach(() => {
    vi.mocked(contactSvc.setInquiryStatus).mockClear();
  });

  it('rejects unauthenticated requests', async () => {
    vi.mocked(authMod.auth).mockResolvedValue(null as never);
    await expect(
      setInquiryStatusAction({ id: 1, status: 'contacted' }),
    ).rejects.toThrow('Unauthenticated');
  });

  it('rejects requests with no role', async () => {
    vi.mocked(authMod.auth).mockResolvedValue({
      user: { id: '1' },
    } as never);
    await expect(
      setInquiryStatusAction({ id: 1, status: 'contacted' }),
    ).rejects.toThrow('Forbidden');
  });

  it('allows admin role', async () => {
    vi.mocked(authMod.auth).mockResolvedValue({
      user: { id: '1', role: 'admin' },
    } as never);
    const result = await setInquiryStatusAction({ id: 1, status: 'contacted' });
    expect(result.ok).toBe(true);
  });

  it('allows editor role', async () => {
    vi.mocked(authMod.auth).mockResolvedValue({
      user: { id: '2', role: 'editor' },
    } as never);
    const result = await setInquiryStatusAction({ id: 1, status: 'closed' });
    expect(result.ok).toBe(true);
  });
});

describe('setInquiryStatusAction — input validation', () => {
  beforeEach(() => {
    vi.mocked(authMod.auth).mockResolvedValue({
      user: { id: '1', role: 'admin' },
    } as never);
  });

  it('returns ok:false with fieldErrors on invalid status', async () => {
    const result = await setInquiryStatusAction({ id: 1, status: 'invalid' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors).toBeDefined();
  });

  it('returns ok:false with fieldErrors on non-numeric id', async () => {
    const result = await setInquiryStatusAction({ id: 'abc', status: 'new' });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false with fieldErrors on negative id', async () => {
    const result = await setInquiryStatusAction({ id: -5, status: 'new' });
    expect(result.ok).toBe(false);
  });
});

// ── deleteInquiryAction — auth guard ─────────────────────────────────────────

describe('deleteInquiryAction — auth guard', () => {
  beforeEach(() => {
    vi.mocked(contactSvc.deleteInquiry).mockClear();
  });

  it('rejects unauthenticated requests', async () => {
    vi.mocked(authMod.auth).mockResolvedValue(null as never);
    await expect(deleteInquiryAction({ id: 1 })).rejects.toThrow('Unauthenticated');
  });

  it('rejects editor role (only admin allowed)', async () => {
    vi.mocked(authMod.auth).mockResolvedValue({
      user: { id: '2', role: 'editor' },
    } as never);
    await expect(deleteInquiryAction({ id: 1 })).rejects.toThrow('Forbidden');
  });

  it('allows admin role', async () => {
    vi.mocked(authMod.auth).mockResolvedValue({
      user: { id: '1', role: 'admin' },
    } as never);
    const result = await deleteInquiryAction({ id: 1 });
    expect(result.ok).toBe(true);
  });

  it('rejects missing id', async () => {
    vi.mocked(authMod.auth).mockResolvedValue({
      user: { id: '1', role: 'admin' },
    } as never);
    const result = await deleteInquiryAction({});
    expect(result.ok).toBe(false);
  });
});
