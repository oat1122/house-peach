/**
 * Estimate reading time in whole minutes for mixed TH/EN content. Pass plain
 * text (e.g. `tiptapToText(body)`). Counts CJK/Thai characters as words
 * alongside whitespace-delimited tokens. Targets ~220 wpm; minimum 1 minute.
 */
const WPM = 220;

export function readingTime(source: string): number {
  if (!source) return 1;
  const stripped = source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  const asciiWords = stripped.match(/[A-Za-z0-9]+/g)?.length ?? 0;
  const thaiChars = stripped.match(/[฀-๿]/g)?.length ?? 0;
  const totalWords = asciiWords + Math.ceil(thaiChars / 3);
  return Math.max(1, Math.ceil(totalWords / WPM));
}
