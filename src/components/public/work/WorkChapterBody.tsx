import type { ReactNode } from 'react';

/**
 * RSC — Wraps the compiled MDX prose body with `.chapter-body` so the
 * `::first-letter` drop cap CSS fires on the first paragraph.
 *
 * Thai above-base vowel guard (spec §7, red-line #1):
 * U+0E40–U+0E44 (`เ แ โ ใ ไ`) render incorrectly when floated by
 * `::first-letter` on WebKit — the vowel detaches from its consonant.
 * When `firstChar` falls in this range, we add `no-drop-cap` to suppress
 * the pseudo-element via the `.no-drop-cap` escape rule in themes.css.
 */
type Props = {
  children: ReactNode;
  /**
   * First character of the body text (trimmed). Page RSC computes this before
   * rendering so we can do the U+0E40–U+0E44 check server-side.
   */
  firstChar?: string;
};

/** Above-base Thai vowel codepoints that break float-left ::first-letter */
const ABOVE_BASE_THAI_VOWELS_START = 0x0e40; // เ
const ABOVE_BASE_THAI_VOWELS_END = 0x0e44; // ไ

function isAboveBaseThai(char: string): boolean {
  const cp = char.codePointAt(0) ?? 0;
  return cp >= ABOVE_BASE_THAI_VOWELS_START && cp <= ABOVE_BASE_THAI_VOWELS_END;
}

export function WorkChapterBody({ children, firstChar = '' }: Props) {
  const suppressDropCap = firstChar.length > 0 && isAboveBaseThai(firstChar);
  const className =
    'chapter-body prose max-w-prose mx-auto font-sans text-lg leading-[1.75] text-ink' +
    (suppressDropCap ? ' no-drop-cap' : '');

  return <div className={className}>{children}</div>;
}
