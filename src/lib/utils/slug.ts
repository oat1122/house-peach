/**
 * Slugify a title into a URL-safe slug. Keeps lowercase ASCII letters / digits
 * AND Thai characters (Unicode block U+0E00–U+0E7F). Strips Latin diacritics,
 * collapses runs of unsupported chars into a single dash, trims edge dashes.
 *
 * Thai is preserved as-is — modern browsers percent-encode in the URL string
 * but display it natively in the address bar, which is preferred for SEO
 * relevance on Thai content. The DB column is utf8mb4 so storage is safe.
 *
 * The result is **re-composed to NFC** so the bytes stored in DB match what
 * browsers send on the wire (URL-decoded params arrive in NFC by default).
 * Without this, NFKD-decomposed Thai vowel marks would look identical visually
 * but compare unequal to an incoming request → spurious 404 on Thai slugs.
 *
 * Falls back to 'untitled' if the input ends up empty.
 */
export function slugify(input: string, maxLen = 140): string {
  const cleaned = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip Latin combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .normalize('NFC');
  const truncated = cleaned.slice(0, maxLen).replace(/-+$/g, '');
  return truncated.length > 0 ? truncated : 'untitled';
}

/**
 * ASCII-only variant — drops Thai entirely. Useful when an admin wants a
 * shareable, no-percent-encoding URL (e.g., for posting to FB / LINE where
 * raw Thai gets mangled to `%E0%B8%9A...` and looks broken in previews).
 *
 * Falls back to 'untitled' when input has no Latin/digit characters.
 */
export function slugifyAscii(input: string, maxLen = 140): string {
  const cleaned = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const truncated = cleaned.slice(0, maxLen).replace(/-+$/g, '');
  return truncated.length > 0 ? truncated : 'untitled';
}
