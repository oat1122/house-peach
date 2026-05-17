import 'server-only';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Per-user rate-limit baseline for admin write server actions, per
 * `.claude/rules/security.md` § Rate limiting:
 *   "Server actions that are write: 30 req / นาที / session"
 *
 * Keyed by the admin's user id (not IP) — these are authenticated endpoints
 * and a stolen JWT replayed across IPs is the actual abuse vector.
 */
const ADMIN_WRITE_LIMIT = 30;
const ADMIN_WRITE_WINDOW_MS = 60_000;

/**
 * Returns an `ActionResult`-shaped rejection when the per-user limit is hit,
 * or `null` to indicate the action may proceed. Designed to compose right
 * after `requireRole()`:
 *
 *   const { session } = await requireRole();
 *   const blocked = checkAdminWriteRateLimit(session?.user?.id);
 *   if (blocked) return blocked;
 *
 * Falls back to an `'anon'` bucket when the session has no id — this should
 * never happen in practice (requireRole has already gated), but it keeps the
 * helper total over its input type.
 */
export function checkAdminWriteRateLimit(
  userId: string | number | null | undefined,
): { ok: false; error: string } | null {
  const key = `admin-write:${userId ?? 'anon'}`;
  const result = rateLimit(key, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS);
  if (result.allowed) return null;
  const wait = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return {
    ok: false,
    error: `ส่งคำขอถี่เกินไป — รออีก ${wait} วินาที`,
  };
}
