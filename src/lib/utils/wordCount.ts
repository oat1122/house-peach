/**
 * Rough word-count estimate for MDX body text. Used by WorkConceptSection to
 * decide whether to render a two-column layout or single-column flow (spec
 * §S13c: threshold = 250 words).
 *
 * Thai word boundary detection is linguistically complex. We approximate:
 *   - Thai characters (U+0E00–U+0E7F) / 5  ≈ word count
 *   - Latin words counted by whitespace tokenisation
 *
 * MDX syntax noise is stripped before counting so JSX tags, heading markers,
 * code fences, and link URLs do not inflate the estimate.
 */
export function estimateWordCount(mdx: string): number {
  // 1. Remove fenced code blocks (```...```)
  let text = mdx.replace(/```[\s\S]*?```/g, ' ');

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
