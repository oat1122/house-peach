/**
 * Unit tests for lib/validation/contact.ts
 * No DB, no imports that touch server-only modules.
 */
import { describe, it, expect } from 'vitest';

import { ContactInquiryInsert } from './contact';

// A fully valid payload used as the baseline in every edge-case test.
const valid = {
  contactName: 'สมชาย ใจดี',
  contactEmail: 'somchai@example.com',
  contactPhone: '+66 81 234 5678',
  serviceType: 'full_design' as const,
  budgetRange: '100k_300k' as const,
  projectDescription: 'ต้องการตกแต่งห้องนั่งเล่นสไตล์ Japandi ขนาด 30 ตรม.',
};

describe('ContactInquiryInsert', () => {
  // ── happy path ──────────────────────────────────────────────────────────────

  it('parses a fully valid payload', () => {
    const result = ContactInquiryInsert.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts payload without optional phone and budgetRange', () => {
    const { contactPhone: _p, budgetRange: _b, ...minimal } = valid;
    const result = ContactInquiryInsert.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('accepts null for contactPhone', () => {
    const result = ContactInquiryInsert.safeParse({ ...valid, contactPhone: null });
    expect(result.success).toBe(true);
  });

  it('accepts null for budgetRange', () => {
    const result = ContactInquiryInsert.safeParse({ ...valid, budgetRange: null });
    expect(result.success).toBe(true);
  });

  it('accepts all valid serviceType values', () => {
    const types = ['full_design', 'consultation', 'partial', 'other'] as const;
    for (const t of types) {
      const r = ContactInquiryInsert.safeParse({ ...valid, serviceType: t });
      expect(r.success, `serviceType=${t}`).toBe(true);
    }
  });

  it('accepts all valid budgetRange values', () => {
    const ranges = ['under_100k', '100k_300k', '300k_700k', '700k_1.5m', '1.5m_plus'] as const;
    for (const r of ranges) {
      const res = ContactInquiryInsert.safeParse({ ...valid, budgetRange: r });
      expect(res.success, `budgetRange=${r}`).toBe(true);
    }
  });

  // ── contactName ─────────────────────────────────────────────────────────────

  it('rejects contactName shorter than 2 chars', () => {
    const result = ContactInquiryInsert.safeParse({ ...valid, contactName: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.contactName?.[0];
      expect(msg).toMatch('2 ตัวอักษร');
    }
  });

  it('rejects empty contactName', () => {
    const result = ContactInquiryInsert.safeParse({ ...valid, contactName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects contactName exceeding 120 chars', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      contactName: 'a'.repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it('accepts contactName of exactly 2 chars', () => {
    const result = ContactInquiryInsert.safeParse({ ...valid, contactName: 'สม' });
    expect(result.success).toBe(true);
  });

  it('accepts contactName of exactly 120 chars', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      contactName: 'a'.repeat(120),
    });
    expect(result.success).toBe(true);
  });

  // ── contactEmail ─────────────────────────────────────────────────────────────

  it('rejects malformed email — no @', () => {
    const result = ContactInquiryInsert.safeParse({ ...valid, contactEmail: 'notanemail' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.contactEmail?.[0];
      expect(msg).toMatch('อีเมล');
    }
  });

  it('rejects email missing domain', () => {
    const result = ContactInquiryInsert.safeParse({ ...valid, contactEmail: 'user@' });
    expect(result.success).toBe(false);
  });

  it('rejects email exceeding 255 chars', () => {
    const local = 'a'.repeat(244);
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      contactEmail: `${local}@example.com`,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing contactEmail', () => {
    const { contactEmail: _e, ...rest } = valid;
    const result = ContactInquiryInsert.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── contactPhone ─────────────────────────────────────────────────────────────

  it('rejects phone with invalid characters', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      contactPhone: 'abc-xyz',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.contactPhone?.[0];
      expect(msg).toMatch('เบอร์โทร');
    }
  });

  it('rejects phone exceeding 40 chars', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      contactPhone: '0'.repeat(41),
    });
    expect(result.success).toBe(false);
  });

  it('accepts phone with digits, spaces, +, -, (, )', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      contactPhone: '(+66) 81-234 5678',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for phone (all chars match regex)', () => {
    // An empty phone passes the regex (zero-length match). This is valid because
    // the field is optional — callers can also pass null or omit it entirely.
    const result = ContactInquiryInsert.safeParse({ ...valid, contactPhone: '' });
    expect(result.success).toBe(true);
  });

  // ── serviceType ──────────────────────────────────────────────────────────────

  it('rejects unknown serviceType', () => {
    const result = ContactInquiryInsert.safeParse({ ...valid, serviceType: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('rejects missing serviceType', () => {
    const { serviceType: _s, ...rest } = valid;
    const result = ContactInquiryInsert.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── projectDescription ───────────────────────────────────────────────────────

  it('rejects description shorter than 20 chars', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      projectDescription: 'สั้นเกินไป',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.projectDescription?.[0];
      expect(msg).toMatch('20 ตัวอักษร');
    }
  });

  it('rejects empty projectDescription', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      projectDescription: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description exceeding 2000 chars', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      projectDescription: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts description of exactly 20 chars', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      projectDescription: 'a'.repeat(20),
    });
    expect(result.success).toBe(true);
  });

  it('accepts description of exactly 2000 chars', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      projectDescription: 'a'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing projectDescription', () => {
    const { projectDescription: _d, ...rest } = valid;
    const result = ContactInquiryInsert.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── honeypot (PublicSubmitSchema level, tested indirectly) ───────────────────
  // The honeypot fields (`_hp_extra`, `_hp_started_at`) live on the action
  // layer's PublicSubmitSchema extend, not on ContactInquiryInsert. Validate
  // the base schema strips unknown keys silently (zod's default `.strip()`).
  it('strips unknown honeypot keys silently', () => {
    const result = ContactInquiryInsert.safeParse({
      ...valid,
      _hp_extra: 'http://spam.example',
      _hp_started_at: Date.now(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // honeypot fields must not leak into parsed output
      expect((result.data as Record<string, unknown>)._hp_extra).toBeUndefined();
      expect((result.data as Record<string, unknown>)._hp_started_at).toBeUndefined();
    }
  });
});
