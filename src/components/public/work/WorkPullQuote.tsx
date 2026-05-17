import { FadeUp } from '@/components/motion/FadeUp';

type Props = {
  quote: string | null;
  clientName: string | null;
};

/**
 * RSC — Client pull quote (spec §S11, §10).
 *
 * Returns `null` when `quote` is null — the entire section is skipped.
 * When `clientName` is null but `quote` exists, the blockquote renders
 * without a figcaption.
 *
 * Semantic: `<figure aria-label="คำพูดจากลูกค้า">` >
 *   `<blockquote>` + optional `<figcaption><cite>— {name}</cite></figcaption>`
 *
 * Quote marks are NOT added by the component — admin enters raw text.
 * The `font-serif` class applies DM Serif Display (display use only — not body).
 */
export function WorkPullQuote({ quote, clientName }: Props) {
  if (!quote) return null;

  return (
    <FadeUp>
      {/* bg-bg2 fill distinguishes the blockquote visually; the accent border
           provides the editorial left rule. Together they eliminate any single-
           indicator contrast dependency (WCAG major #2 fix). */}
      <figure
        aria-label="คำพูดจากลูกค้า"
        className="max-w-2xl mx-auto mt-16 bg-bg2 rounded-r-md border-l-2 md:border-l-4 border-brand-accent pl-4 md:pl-8 p-4 md:p-6 my-8"
      >
        <blockquote className="font-serif text-2xl md:text-3xl leading-[1.4] text-ink">
          {quote}
        </blockquote>
        {clientName && (
          <figcaption className="mt-3">
            <cite className="text-xs text-muted-brand not-italic">
              — {clientName}
            </cite>
          </figcaption>
        )}
      </figure>
    </FadeUp>
  );
}
