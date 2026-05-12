import type { ReactNode } from 'react';

/**
 * RSC — Wraps the compiled MDX body with prose typography and provides the
 * negative-margin full-bleed escape hatch for inline `<BeforeAfter>` embeds.
 *
 * The `.prose-full-bleed` scoped class makes any child with the class
 * `full-bleed` break out of the constrained prose column to span the full
 * viewport width. `BeforeAfterEmbed` wraps the card in `<div class="my-8">`;
 * the escape hatch is applied at this wrapper level, not inside the embed.
 *
 * Returns null when body renders no content (empty MDX) so there is no
 * empty `<div class="prose">` consuming space.
 *
 * Per spec § WorkProseSection.
 */
type Props = {
  body: ReactNode;
  className?: string;
};

export function WorkProseSection({ body, className }: Props) {
  if (!body) return null;

  return (
    <div
      className={
        'prose-full-bleed prose prose-stone mt-10 max-w-prose dark:prose-invert ' +
        (className ?? '')
      }
    >
      {body}
    </div>
  );
}
