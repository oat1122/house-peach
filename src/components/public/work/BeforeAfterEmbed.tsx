import { BeforeAfterCard } from './BeforeAfterCard';
import type { BeforeAfterImage } from './BeforeAfterSlider';

/**
 * Pair data the MDX embed needs to render. The work detail page pre-loads
 * every pair attached to the work and threads them into the MDX components
 * map via `composeBeforeAfterEmbed(pairsMap)` so the embed itself never
 * fetches at render time (no N+1 / no client waterfall).
 */
export type EmbedPairData = {
  id: number;
  before: BeforeAfterImage;
  after: BeforeAfterImage;
  caption?: string | null;
};

/**
 * Factory — given a Map of pair data, returns the MDX-callable component.
 * The whitelist binding lives in the work detail page so the closure can
 * see only that work's pairs (defense in depth — admin can't embed a pair
 * from another work even if they guess its id).
 */
export function composeBeforeAfterEmbed(pairs: Map<number, EmbedPairData>) {
  return function BeforeAfter({ pairId }: { pairId: number | string }) {
    const id =
      typeof pairId === 'string'
        ? Number.parseInt(pairId, 10)
        : pairId;
    if (!Number.isFinite(id) || id <= 0) return null;
    const pair = pairs.get(id);
    if (!pair) {
      // Silent in production — admin sees nothing if pairId is invalid.
      // (We avoid throwing because MDX render errors break the whole page.)
      if (process.env.NODE_ENV !== 'production') {
        return (
          <aside className="my-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            BeforeAfter: ไม่พบ pairId={id} ใน work นี้
          </aside>
        );
      }
      return null;
    }
    return (
      <div className="my-8">
        <BeforeAfterCard
          before={pair.before}
          after={pair.after}
          caption={pair.caption}
        />
      </div>
    );
  };
}
