/**
 * Slugify a title into URL-safe lowercase ASCII with dash separators.
 * Strips diacritics, collapses whitespace, drops anything outside [a-z0-9-].
 * Falls back to 'untitled' on empty input.
 */
export function slugify(input: string, maxLen = 140): string {
  const ascii = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const truncated = ascii.slice(0, maxLen).replace(/-+$/g, '');
  return truncated.length > 0 ? truncated : 'untitled';
}
