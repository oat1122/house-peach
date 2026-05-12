import Image from 'next/image';
import { Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Dense quilted grid for the `process` and `detail` sections of the work
 * detail page. Featured images take a 2×2 tile (the visual anchor); the rest
 * pack into 1×1 / 2×1 / 1×2 cells based on the stored aspect ratio of each
 * image — so the layout feels varied without being random per-render
 * (CLS-safe, stable across reloads, no JS measure step needed).
 *
 * Layout grid:
 *   - mobile  → 2 cols
 *   - tablet  → 3 cols
 *   - desktop → 4 cols
 *   - `grid-auto-flow: dense` packs around the 2×2 featured anchors
 *
 * Tile sizing rule (per item, pure):
 *   - isFeatured      → 2×2 (aspect-square, anchors the grid)
 *   - aspect ≥ 1.5    → 2×1 wide   (landscape stretches horizontally)
 *   - aspect ≤ 0.7    → 1×2 tall   (portrait stretches vertically)
 *   - else            → 1×1 square (default)
 */

export type MasonryItem = {
  mediaAssetId: number;
  isFeatured: boolean;
  caption: string | null;
  asset: {
    path: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  };
};

type TileSpan = { col: 1 | 2; row: 1 | 2 };

/** Pure function — easy to unit-test in isolation. */
export function getTileSpan(
  width: number,
  height: number,
  isFeatured: boolean,
): TileSpan {
  if (isFeatured) return { col: 2, row: 2 };
  if (!width || !height) return { col: 1, row: 1 };
  const aspect = width / height;
  if (aspect >= 1.5) return { col: 2, row: 1 };
  if (aspect <= 0.7) return { col: 1, row: 2 };
  return { col: 1, row: 1 };
}

function tileClasses(span: TileSpan): string {
  const col = span.col === 2 ? 'col-span-2' : 'col-span-1';
  const row = span.row === 2 ? 'row-span-2' : 'row-span-1';
  // Aspect derived from the cell's grid footprint so the image fills it
  // without CLS. 2×2 and 1×1 are both square; 2×1 is landscape; 1×2 portrait.
  const aspect =
    span.col === 2 && span.row === 1
      ? 'aspect-[2/1]'
      : span.col === 1 && span.row === 2
        ? 'aspect-[1/2]'
        : 'aspect-square';
  return cn(col, row, aspect);
}

export function WorkMasonryGrid({
  items,
  ariaLabel,
}: {
  items: MasonryItem[];
  ariaLabel?: string;
}) {
  if (items.length === 0) return null;

  return (
    <ul
      aria-label={ariaLabel}
      className="grid grid-cols-2 gap-2 [grid-auto-flow:dense] md:grid-cols-3 md:gap-3 lg:grid-cols-4"
    >
      {items.map((item) => {
        const span = getTileSpan(
          item.asset.width,
          item.asset.height,
          item.isFeatured,
        );
        return (
          <li
            key={item.mediaAssetId}
            className={cn(
              'relative overflow-hidden rounded-md bg-bg2',
              tileClasses(span),
            )}
          >
            <Image
              src={item.asset.path}
              alt={item.asset.alt || item.asset.title || 'ภาพผลงาน'}
              fill
              sizes={
                span.col === 2
                  ? '(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw'
                  : '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
              }
              className="object-cover"
              unoptimized
            />
            {item.isFeatured && (
              <span
                className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/75 px-2 py-0.5 text-[10px] uppercase tracking-wider text-bg backdrop-blur-sm"
                aria-hidden
              >
                <Sparkles className="size-3" />
                featured
              </span>
            )}
            {item.caption && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3 pb-2 pt-8 text-xs text-bg">
                {item.caption}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
