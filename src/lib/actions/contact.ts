'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { requireRole } from '@/lib/auth-guard';
import {
  checkSubmissionTiming,
  countUrls,
  isDisposableEmail,
  isEffectivelyEmpty,
  MAX_URLS_IN_DESCRIPTION,
} from '@/lib/contact/antiSpam';
import { checkAdminWriteRateLimit } from './_adminRateLimit';
import {
  inquiryStatusValues,
  type InquiryStatus,
} from '@/lib/db/schema/contactInquiries';
import { log } from '@/lib/log';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import {
  createContactInquiry as createContactInquirySvc,
  deleteInquiry as deleteInquirySvc,
  setInquiryStatus as setInquiryStatusSvc,
} from '@/lib/services/contact';
import { ContactInquiryInsert } from '@/lib/validation/contact';

const Id = z.coerce.number().int().positive();
const StatusEnum = z.enum(inquiryStatusValues);

export type ActionResult<T = undefined> =
  | { ok: true; value?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function flattenZodError(err: z.ZodError) {
  return Object.fromEntries(
    Object.entries(err.flatten().fieldErrors).filter(
      ([, v]) => Array.isArray(v) && v.length > 0,
    ),
  ) as Record<string, string[]>;
}

/**
 * Public form submission for the /contact page.
 *
 * Anti-spam defense-in-depth stack (defenses cascade; any single one trips
 * silently — bots receive `{ ok: true }` so they learn nothing about which
 * filter caught them):
 *
 *   1. IP rate limit               — 5 / 10 min / IP   (counted first)
 *   2. Text honeypot `_hp_extra`   — sr-only field; bots fill, users don't
 *   3. Timing honeypot `_hp_started_at` — < 2 s or > 24 h ⇒ bot / replay
 *   4. URL count in description    — ≤ 2 (typical spam carries 3+ links)
 *   5. Disposable email blacklist  — Mailinator etc. throwaway domains
 *   6. Per-email rate limit        — 3 / 24 h / contactEmail
 *
 * Note on field naming: the honeypot is `_hp_extra` (not `website`) so trained
 * bots that recognise "website" as a common field name don't auto-skip it.
 * The leading underscore + `_hp_` prefix is uncommon in real forms.
 */
const HONEYPOT_FIELD = '_hp_extra' as const;
const TIMING_FIELD = '_hp_started_at' as const;

const PublicSubmitSchema = ContactInquiryInsert.extend({
  // Honeypot — accept ANY string at the schema level so a bot that fills it
  // does NOT get a `fieldErrors` response (which would tip the bot off that
  // it tripped a filter). The non-empty check happens after parse.
  [HONEYPOT_FIELD]: z.string().optional().nullable(),
  // Timing honeypot — client sets `Date.now()` on form mount, server checks
  // delta. Accept string or number so RHF's stringified state still parses.
  [TIMING_FIELD]: z.union([z.string(), z.number()]).optional().nullable(),
});

/** Identical-shape silent-success — used when any honeypot trips so the bot
 *  can't distinguish "accepted" from "filtered". Returns id=0 so consumers
 *  can detect the synthetic case if needed, but the public UI just shows the
 *  success screen. */
const HONEYPOT_OK: ActionResult<{ id: number }> = {
  ok: true,
  value: { id: 0 },
};

export async function createContactInquiryAction(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  // ── Defense 1: IP rate limit ────────────────────────────────────────────
  // Counted first so honeypot-tripped requests still increment — a bot that
  // fills the honeypot can't probe the endpoint at unlimited rate. clientIp
  // takes the rightmost (proxy-appended) entry per security.md.
  const h = await headers();
  const ip = clientIp(h);
  const ipRl = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  if (!ipRl.allowed) {
    return {
      ok: false,
      error: 'คุณส่งคำขอบ่อยเกินไป กรุณาลองใหม่ภายหลัง',
    };
  }

  const parsed = PublicSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ข้อมูลไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }

  // ── Defense 2: text honeypot ────────────────────────────────────────────
  if (parsed.data[HONEYPOT_FIELD]) {
    log.warn({ ip }, 'contact form text honeypot triggered');
    return HONEYPOT_OK;
  }

  // ── Defense 3: timing honeypot ──────────────────────────────────────────
  const timing = checkSubmissionTiming(parsed.data[TIMING_FIELD]);
  if (timing !== 'ok') {
    log.warn({ ip, timing }, 'contact form timing honeypot triggered');
    return HONEYPOT_OK;
  }

  // ── Defense 4: whitespace-only description ─────────────────────────────
  // zod's `min(20)` counts whitespace — `" ".repeat(20)` passes schema but is
  // a real spam pattern (and useless for us). Silent drop, same as honeypot.
  if (isEffectivelyEmpty(parsed.data.projectDescription)) {
    log.warn({ ip }, 'contact form whitespace-only description triggered');
    return HONEYPOT_OK;
  }

  // ── Defense 5: URL count in description ─────────────────────────────────
  const urlCount = countUrls(parsed.data.projectDescription);
  if (urlCount > MAX_URLS_IN_DESCRIPTION) {
    log.warn({ ip, urlCount }, 'contact form url-flood triggered');
    return HONEYPOT_OK;
  }

  // ── Defense 6: disposable email blacklist ───────────────────────────────
  if (isDisposableEmail(parsed.data.contactEmail)) {
    log.warn(
      { ip, emailDomain: parsed.data.contactEmail.split('@').pop() },
      'contact form disposable email blocked',
    );
    return HONEYPOT_OK;
  }

  // ── Defense 7: per-email rate limit ─────────────────────────────────────
  // Catches the rotating-IP/same-target-email pattern. Keyed on lowercased
  // email so casing variants don't bypass it.
  const emailKey = parsed.data.contactEmail.trim().toLowerCase();
  const emailRl = rateLimit(`contact:email:${emailKey}`, 3, 24 * 60 * 60 * 1000);
  if (!emailRl.allowed) {
    log.warn({ ip, emailKey }, 'contact form email rate limit hit');
    // Surface real error here (not silent) — a legitimate user retrying
    // after a real error deserves to know they've maxed out for the day.
    return {
      ok: false,
      error: 'อีเมลนี้ส่งคำขอครบจำนวนสำหรับวันนี้แล้ว กรุณาติดต่อทางช่องอื่น',
    };
  }

  try {
    // Drop honeypot fields before passing to the service.
    const {
      [HONEYPOT_FIELD]: _hp,
      [TIMING_FIELD]: _ts,
      ...payload
    } = parsed.data;
    const id = await createContactInquirySvc(payload);
    return { ok: true, value: { id } };
  } catch (err) {
    // Never forward raw error text to the public — leaks DB schema details.
    log.error({ err }, 'createContactInquiry failed');
    return {
      ok: false,
      error: 'ส่งข้อความไม่สำเร็จ กรุณาลองใหม่ภายหลัง',
    };
  }
}

const SetStatusInput = z.object({ id: Id, status: StatusEnum });

export async function setInquiryStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const parsed = SetStatusInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'พารามิเตอร์ไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  try {
    await setInquiryStatusSvc(parsed.data.id, parsed.data.status as InquiryStatus);
    return { ok: true };
  } catch (err) {
    log.error({ err, id: parsed.data.id }, 'setInquiryStatus failed');
    return { ok: false, error: 'อัปเดตสถานะไม่สำเร็จ' };
  }
}

export async function deleteInquiryAction(
  input: unknown,
): Promise<ActionResult> {
  const { session } = await requireRole(['admin']);
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const parsed = z.object({ id: Id }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'พารามิเตอร์ไม่ถูกต้อง' };
  }
  try {
    await deleteInquirySvc(parsed.data.id);
    return { ok: true };
  } catch (err) {
    log.error({ err, id: parsed.data.id }, 'deleteInquiry failed');
    return { ok: false, error: 'ลบไม่สำเร็จ' };
  }
}
