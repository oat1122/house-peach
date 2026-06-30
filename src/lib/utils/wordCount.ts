/**
 * Rough word-count estimate for body text. Pass the plain text extracted from
 * a Tiptap doc via `tiptapToText()`. Used to size the BlogPosting JSON-LD
 * `wordCount` and WorkConceptSection layout (spec §S13c: threshold = 250 words).
 *
 * Thai word boundary detection is linguistically complex. We approximate:
 *   - Thai characters (U+0E00–U+0E7F) / 5  ≈ word count
 *   - Latin words counted by whitespace tokenisation
 *
 * Residual markdown/markup is stripped defensively so stray tokens don't
 * inflate the estimate.
 */
export function estimateWordCount(text: string): number {
  // 1. Remove fenced code blocks (```...```)
  text = text.replace(/```[\s\S]*?```/g, ' ');

  // 2. Remove inline code (`...`)
  text = text.replace(/`[^`]*`/g, ' ');

  // 3. Remove JSX/HTML tags (<Component ... /> or <tag>)
  text = text.replace(/<[^>]+>/g, ' ');

  // 4. Remove markdown heading markers and link syntax [text](url)
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 5. Remove remaining markdown punctuation (*, _, >, -)
  text = text.replace(/[*_>~\-#]/g, ' ');

  // 6. Count Thai characters (U+0E00–U+0E7F) — divide by 5 as word proxy
  const thaiChars = (text.match(/[฀-๿]/g) ?? []).length;
  const thaiWordEstimate = Math.ceil(thaiChars / 5);

  // 7. Strip Thai chars then count remaining Latin words by whitespace
  const latinText = text.replace(/[฀-๿]/g, ' ');
  const latinWords = latinText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return latinWords + thaiWordEstimate;
}
