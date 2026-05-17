import type { BeforeAfterImage } from './BeforeAfterSlider';
import { BeforeAfterCard } from './BeforeAfterCard';

type CholusPair = {
  before: BeforeAfterImage;
  after: BeforeAfterImage;
  caption: string | null;
};

type Props = {
  pair: CholusPair;
};

/**
 * RSC wrapper — Renders the first before/after pair as the editorial "chorus"
 * (spec §S10, §5 desktop mockup).
 *
 * Visual distinction from v1:
 * - No `rounded-2xl` — full-bleed to the container edge (no border radius)
 * - Caption centered below, italic sans
 *
 * The `BeforeAfterCard` inner component is `'use client'` for drag interaction.
 * This wrapper itself remains RSC — it passes static props down.
 *
 * Red-line §21 #5: NO rounded corners on the chorus pair (rounded-none).
 */
export function WorkChorusBeforeAfter({ pair }: Props) {
  return (
    <div className="-mx-4 md:-mx-6">
      {/* rounded-none overrides BeforeAfterCard's default figure className —
          the chorus pair is full-bleed, no radius (spec §S10 + red-line #5) */}
      <BeforeAfterCard
        before={pair.before}
        after={pair.after}
        caption={null}
        className="rounded-none"
      />
      {pair.caption && (
        <p className="mt-2 px-4 text-xs md:text-sm text-muted-brand text-center font-sans italic">
          {pair.caption}
        </p>
      )}
    </div>
  );
}
