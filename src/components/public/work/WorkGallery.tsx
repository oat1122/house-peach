import Image from 'next/image';

import type { WorkImageListItem } from '@/lib/services/workImage';

import { BeforeAfterCard } from './BeforeAfterCard';
import type { BeforeAfterImage } from './BeforeAfterSlider';
import { WorkGallerySection } from './WorkGallerySection';

/**
 * Groups gallery rows by `pair_id` → renders pairs as `<BeforeAfterCard>`,
 * everything else as individual figures grouped by `kind` (after / before /
 * process / detail). The cover image is rendered above by the page hero,
 * so it's excluded here.
 *
 * RSC — no client JS until BeforeAfterCard mounts.
 *
 * `variant`:
 *  - `'legacy'` (default) — flat list, original behaviour. No regression.
 *  - `'sectioned'` — partitions images by kind and renders named
 *    `<WorkGallerySection>` sub-components per the redesign spec.
 */
export type Cluster =
  | { kind: 'pair'; pairId: number; before: WorkImageListItem; after: WorkImageListItem }
  | { kind: 'single'; row: WorkImageListItem };

export function buildClusters(rows: WorkImageListItem[]): Cluster[] {
  const seenPair = new Set<number>();
  const clusters: Cluster[] = [];
  for (const row of rows) {
    if (row.pairId == null) {
      clusters.push({ kind: 'single', row });
      continue;
    }
    if (seenPair.has(row.pairId)) continue;
    const partner = rows.find(
      (r) => r.pairId === row.pairId && r.mediaAssetId !== row.mediaAssetId,
    );
    if (!partner) {
      clusters.push({ kind: 'single', row });
      continue;
    }
    seenPair.add(row.pairId);
    const before = row.kind === 'before' ? row : partner;
    const after = row.kind === 'before' ? partner : row;
    clusters.push({ kind: 'pair', pairId: row.pairId, before, after });
  }
  return clusters;
}

function toBA(row: WorkImageListItem): BeforeAfterImage {
  // Legacy fallback — kept for the (currently unused) flat-list variant. The
  // sectioned variant in WorkGallerySection has per-side semantic fallbacks
  // ("ก่อนแต่ง — title" / "หลังแต่ง — title").
  const kindTh = row.kind === 'before' ? 'ก่อนแต่ง' : 'หลังแต่ง';
  return {
    src: row.asset.path,
    alt: row.asset.alt || row.asset.title || `ภาพผลงาน — ${kindTh}`,
    width: row.asset.width || 1600,
    height: row.asset.height || 1000,
  };
}

type Props = {
  images: WorkImageListItem[];
  /** Asset id to omit (rendered separately as hero). */
  coverAssetId: number | null;
  /**
   * Rendering variant.
   * - `'legacy'` — original flat list (default, no regression).
   * - `'sectioned'` — story-driven section layout per the redesign spec.
   */
  variant?: 'legacy' | 'sectioned';
  /** Required when `variant="sectioned"` for alt-text fallbacks. */
  workTitle?: string;
};

export function WorkGallery({
  images,
  coverAssetId,
  variant = 'legacy',
  workTitle = '',
}: Props) {
  const items = coverAssetId
    ? images.filter((r) => r.mediaAssetId !== coverAssetId)
    : images;
  if (items.length === 0) return null;

  if (variant === 'sectioned') {
    return (
      <SectionedGallery items={items} workTitle={workTitle} />
    );
  }

  // ── Legacy flat list (unchanged) ─────────────────────────────────────────
  const clusters = buildClusters(items);

  return (
    <section
      aria-label="แกลเลอรีผลงาน"
      className="mx-auto mt-12 max-w-4xl space-y-10 px-4"
    >
      {clusters.map((c) =>
        c.kind === 'pair' ? (
          <BeforeAfterCard
            key={`pair-${c.pairId}`}
            before={toBA(c.before)}
            after={toBA(c.after)}
            caption={c.after.caption ?? c.before.caption ?? null}
          />
        ) : (
          <SingleFigure key={`single-${c.row.mediaAssetId}`} row={c.row} />
        ),
      )}
    </section>
  );
}

// ── Sectioned rendering ───────────────────────────────────────────────────────

/**
 * Partitions images by `kind` and renders each group as a named
 * `WorkGallerySection`. Empty groups return null — no orphan headings.
 */
function SectionedGallery({
  items,
  workTitle,
}: {
  items: WorkImageListItem[];
  workTitle: string;
}) {
  // Before/after: group by pair first; unpaired singles become orphans
  const beforeAfterRows = items.filter(
    (r) => r.kind === 'before' || r.kind === 'after',
  );
  const beforeAfterClusters = buildClusters(beforeAfterRows);

  // Process: all singles (no pairs expected but safe to handle)
  const processRows = items.filter((r) => r.kind === 'process');
  const processClusters = buildClusters(processRows);

  // Detail: all singles
  const detailRows = items.filter((r) => r.kind === 'detail');
  const detailClusters = buildClusters(detailRows);

  return (
    <>
      <WorkGallerySection
        label={{ th: 'ก่อน/หลัง', en: 'Before & After' }}
        clusters={beforeAfterClusters}
        displayMode="before-after"
        workTitle={workTitle}
      />
      <WorkGallerySection
        label={{ th: 'กระบวนการ', en: 'Process' }}
        clusters={processClusters}
        displayMode="process-grid"
        workTitle={workTitle}
      />
      <WorkGallerySection
        label={{ th: 'รายละเอียด', en: 'Details' }}
        clusters={detailClusters}
        displayMode="detail-editorial"
        workTitle={workTitle}
      />
    </>
  );
}

// ── Legacy helpers (unchanged) ───────────────────────────────────────────────

function SingleFigure({ row }: { row: WorkImageListItem }) {
  const { asset } = row;
  return (
    <figure className="space-y-2">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-muted"
        style={{ aspectRatio: `${asset.width || 1600} / ${asset.height || 1000}` }}
      >
        <Image
          src={asset.path}
          alt={asset.alt || asset.title || 'ภาพผลงาน'}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          unoptimized
        />
      </div>
      {row.caption && (
        <figcaption className="text-center text-xs text-muted-foreground">
          {row.caption}
        </figcaption>
      )}
    </figure>
  );
}
