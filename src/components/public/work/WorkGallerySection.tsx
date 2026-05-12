import Image from 'next/image';

import { FadeUp } from '@/components/motion/FadeUp';

import { BeforeAfterCard } from './BeforeAfterCard';
import type { BeforeAfterImage } from './BeforeAfterSlider';
import type { Cluster } from './WorkGallery';
import { WorkMasonryGrid, type MasonryItem } from './WorkMasonryGrid';

type DisplayMode = 'before-after' | 'process-grid' | 'detail-editorial';

type Props = {
  label: { th: string; en: string };
  clusters: Cluster[];
  displayMode: DisplayMode;
  /** Work title — used as alt fallback when stored asset.alt is empty. */
  workTitle: string;
  className?: string;
};

/**
 * RSC — Renders one named gallery section (before/after, process, or detail).
 * Returns null when `clusters` is empty so no empty `<section>` with a dangling
 * eyebrow heading appears (spec § red-line list #6).
 *
 * Heading hierarchy: the eyebrow label renders as `<h2>` so gallery sections
 * contribute to the document outline below the single `<h1>` work title.
 *
 * Per spec § WorkGallerySection.
 */
export function WorkGallerySection({
  label,
  clusters,
  displayMode,
  workTitle,
  className,
}: Props) {
  if (clusters.length === 0) return null;

  return (
    <section
      aria-label={`${label.th} — ${label.en}`}
      className={'mt-12 md:mt-16 px-4 md:px-6 ' + (className ?? '')}
    >
      <FadeUp>
        <h2 className="text-xs uppercase tracking-widest font-sans font-normal text-muted-brand">
          {label.th} · {label.en}
        </h2>
      </FadeUp>

      {displayMode === 'before-after' && (
        <BeforeAfterSection clusters={clusters} workTitle={workTitle} />
      )}
      {displayMode === 'process-grid' && (
        <MasonrySection
          clusters={clusters}
          workTitle={workTitle}
          fallbackAltPrefix="ภาพกระบวนการ"
        />
      )}
      {displayMode === 'detail-editorial' && (
        <MasonrySection
          clusters={clusters}
          workTitle={workTitle}
          fallbackAltPrefix="รายละเอียด"
        />
      )}
    </section>
  );
}

// ── Before / After ──────────────────────────────────────────────────────────

function BeforeAfterSection({
  clusters,
  workTitle,
}: {
  clusters: Cluster[];
  workTitle: string;
}) {
  // Only render pair clusters; orphaned singles degrade to detail treatment
  // and are already excluded from the before-after kind group by WorkGallery.
  const pairClusters = clusters.filter((c) => c.kind === 'pair');
  const singleClusters = clusters.filter((c) => c.kind === 'single');

  return (
    <div className="mt-6 space-y-8">
      {pairClusters.map((c) => {
        if (c.kind !== 'pair') return null;
        // Per-side semantic alt fallback when admin didn't set asset.alt —
        // "ก่อนแต่ง / หลังแต่ง — <work title>" is the most useful Google
        // Image Search signal for portfolio before/after comparisons.
        const before: BeforeAfterImage = toBAImage(c.before, `ก่อนแต่ง — ${workTitle}`);
        const after: BeforeAfterImage = toBAImage(c.after, `หลังแต่ง — ${workTitle}`);
        const caption = c.after.caption ?? c.before.caption ?? null;
        return (
          <div key={`pair-${c.pairId}`}>
            <BeforeAfterCard
              before={before}
              after={after}
              caption={caption}
              className="rounded-2xl"
            />
          </div>
        );
      })}
      {/* Orphaned before/after singles (partner was deleted) render as plain images */}
      {singleClusters.map((c) => {
        if (c.kind !== 'single') return null;
        const { asset } = c.row;
        const kindLabelTh = c.row.kind === 'before' ? 'ก่อนแต่ง' : 'หลังแต่ง';
        return (
          <figure key={`single-${c.row.mediaAssetId}`} className="space-y-2">
            <div
              className="relative w-full overflow-hidden rounded-lg bg-bg2"
              style={{ aspectRatio: `${asset.width || 3} / ${asset.height || 2}` }}
            >
              <Image
                src={asset.path}
                alt={asset.alt || asset.title || `${kindLabelTh} — ${workTitle}`}
                fill
                sizes="(max-width: 768px) 100vw, 1280px"
                className="object-cover"
                unoptimized
              />
            </div>
            {c.row.caption && (
              <figcaption className="text-xs text-muted-brand text-center mt-2">
                {c.row.caption}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}

// ── Masonry (process + detail share this layout) ────────────────────────────

/**
 * Single masonry section used for both `process` and `detail` kinds. The grid
 * itself is rendered by `<WorkMasonryGrid>` — this wrapper only converts the
 * cluster shape into masonry items and wraps the result in a FadeUp.
 *
 * Featured items (admin-flagged) anchor the grid as 2×2 tiles. Non-featured
 * tiles pick 1×1 / 2×1 / 1×2 based on stored aspect — see `getTileSpan` in
 * `WorkMasonryGrid` for the rule.
 */
function MasonrySection({
  clusters,
  workTitle,
  fallbackAltPrefix,
}: {
  clusters: Cluster[];
  workTitle: string;
  fallbackAltPrefix: string;
}) {
  const items: MasonryItem[] = clusters
    .filter((c) => c.kind === 'single')
    .map((c) => {
      if (c.kind !== 'single') throw new Error('unreachable');
      const { asset } = c.row;
      return {
        mediaAssetId: c.row.mediaAssetId,
        isFeatured: c.row.isFeatured,
        caption: c.row.caption,
        asset: {
          path: asset.path,
          alt: asset.alt || asset.title || `${fallbackAltPrefix} — ${workTitle}`,
          title: asset.title,
          width: asset.width || 0,
          height: asset.height || 0,
        },
      };
    });

  if (items.length === 0) return null;

  return (
    <FadeUp className="mt-6">
      <WorkMasonryGrid items={items} ariaLabel={`${fallbackAltPrefix} — ${workTitle}`} />
    </FadeUp>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toBAImage(
  row: { asset: { path: string; alt: string; title: string; width: number; height: number } },
  fallbackAlt: string,
): BeforeAfterImage {
  return {
    src: row.asset.path,
    alt: row.asset.alt || row.asset.title || fallbackAlt,
    width: row.asset.width || 1600,
    height: row.asset.height || 1000,
  };
}
