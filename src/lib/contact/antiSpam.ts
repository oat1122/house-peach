import 'server-only';

/**
 * Anti-spam heuristics for the public contact form. Pure functions — no DB,
 * no I/O. Each function returns a boolean or count so the caller can decide
 * whether to drop the submission silently (preferred — bots learn nothing
 * about the filter) or surface a field error (for legitimate user mistakes).
 *
 * The defenses stack:
 *   • honeypot field        (action layer) — bots that fill any field win
 *   • timing honeypot       (action layer) — submission < 2s = bot
 *   • URL count             (here)         — > 2 links in description = spam
 *   • whitespace-only       (here)         — `" ".repeat(20)` defeats min(20)
 *   • disposable email      (here)         — Mailinator etc. throwaway floods
 *   • IP rate limit         (action layer) — 5 / 10 min / IP
 *   • email rate limit      (action layer) — 3 / 24 h / email
 *
 * No single defense is sufficient; together they raise the cost of automated
 * spam beyond what's worth doing for a low-traffic Thai studio site.
 */

/**
 * Count the number of explicit URLs in `text`. We look for `http://` or
 * `https://` only — bare-domain spam ("www.example.com no slashes") still
 * passes here, which is intentional: aggressive matching produces too many
 * false positives (e.g. someone listing their portfolio link).
 *
 * Returns 0 for empty/null input.
 */
export function countUrls(text: string | null | undefined): number {
  if (!text) return 0;
  const matches = text.match(/https?:\/\//gi);
  return matches ? matches.length : 0;
}

/** Max URLs allowed in a single contact submission's description field. */
export const MAX_URLS_IN_DESCRIPTION = 2;

/**
 * Reject inputs that are visually empty after Unicode whitespace trim.
 * The schema's `min(20)` is satisfied by `" ".repeat(20)` because zod's
 * string length counts whitespace — this is the guard against that trick.
 *
 * Uses Unicode-aware whitespace stripping (\s in JS includes ZWSP-style
 * characters once the ` ` non-breaking space is added explicitly).
 */
export function isEffectivelyEmpty(text: string): boolean {
  return text.replace(/[\s ​-‍﻿]+/g, '').length === 0;
}

/**
 * Disposable / throwaway email domains. Curated for the high-traffic ones —
 * a comprehensive list is impossible to maintain, but blocking the top ~30
 * stops the bulk of automated form floods. Lowercase comparison.
 *
 * Sources: well-known throwaway providers; deliberately small + maintainable.
 * Extend as new domains appear in production logs (search `log.warn`
 * "disposable email" events).
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.com',
  'anonbox.net',
  'discard.email',
  'dispostable.com',
  'fake-mail.net',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'inboxbear.com',
  'mailcatch.com',
  'maildrop.cc',
  'mailinator.com',
  'mailinator.net',
  'mailnesia.com',
  'mintemail.com',
  'mohmal.com',
  'mytemp.email',
  'spamgourmet.com',
  'sharklasers.com',
  'tempinbox.com',
  'tempmail.com',
  'tempmail.net',
  'tempmailo.com',
  'temp-mail.org',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
]);

/**
 * Returns true when the email's domain matches a known throwaway provider.
 * Comparison is case-insensitive on the domain part only — the local part
 * (before `@`) is irrelevant.
 *
 * Robust against the trick `foo+tag@mailinator.com` because we split on the
 * last `@` and compare the bare domain.
 */
export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Validate the client-supplied `_hp_started_at` timestamp. A real user has the
 * form open long enough to fill it (≥ 2s). A clock-skewed or replayed
 * submission can carry a wildly future timestamp; cap the upper bound at
 * 24 hours so a stored form payload can't be replayed indefinitely later.
 *
 *   • returns `'ok'`         — within plausible bounds
 *   • returns `'too_fast'`   — < 2 s (bot autofill)
 *   • returns `'too_old'`    — > 24 h (stale/replay)
 *   • returns `'missing'`    — empty / NaN
 *
 * Callers should treat any non-'ok' value as a silent honeypot trip
 * (`return { ok: true, value: { id: 0 } }`) so bots learn nothing about the
 * filter, matching the existing `website` honeypot pattern.
 */
export type TimingCheckResult = 'ok' | 'too_fast' | 'too_old' | 'missing';

export const MIN_SUBMIT_DELAY_MS = 2_000;
export const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000;

export function checkSubmissionTiming(
  startedAt: number | string | null | undefined,
  now: number = Date.now(),
): TimingCheckResult {
  if (startedAt == null || startedAt === '') return 'missing';
  const ts =
    typeof startedAt === 'number' ? startedAt : Number(startedAt);
  if (!Number.isFinite(ts) || ts <= 0) return 'missing';
  const delta = now - ts;
  if (delta < MIN_SUBMIT_DELAY_MS) return 'too_fast';
  if (delta > MAX_FORM_AGE_MS) return 'too_old';
  return 'ok';
}
