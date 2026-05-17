/**
 * Format an integer number of days into a human-readable Thai duration string.
 *
 * Thresholds (per spec §8):
 *   < 30  days  → "{n} วัน"
 *   30–89 days  → "{weeks} สัปดาห์"
 *   ≥ 90  days  → "{months} เดือน"
 *
 * The raw integer is stored in the DB so the display rule can be updated
 * independently without a migration.
 */
export function formatDuration(days: number): string {
  if (days < 30) {
    return `${days} วัน`;
  }
  if (days < 90) {
    return `${Math.round(days / 7)} สัปดาห์`;
  }
  return `${Math.round(days / 30)} เดือน`;
}
