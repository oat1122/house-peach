import Image from 'next/image';

import type { WorkImageListItem } from '@/lib/services/workImage';

import { BeforeAfterCard } from './BeforeAfterCard';
import type { BeforeAfterImage } from './BeforeAfterSlider';

/**
 * Groups gallery rows by `pair_id` → renders pairs as `<BeforeAfterCard>`,
 * everything else as individual figures grouped by `kind` (after / before /
 * process / detail). The cover image is rendered above by the page hero,
 * so it's excluded here.
 *
 * RSC — no client JS until BeforeAfterCard mounts.
 */
type Cluster =
  | { kind: 'pair'; pairId: number; before: WorkImageListItem; after: WorkImageListItem }
  | { kind: 'single'; row: WorkImageListItem };

function buildClusters(rows: WorkImageListItem[]): Cluster[] {
  // Index rows by pair_id; preserve sort order for the cluster's anchor row.
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
      // Orphan pair_id (partner deleted) — render as single.
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
  return {
    src: row.asset.path,
    alt: row.asset.alt || row.asset.title || '',
    width: row.asset.width || 1600,
    height: row.asset.height || 1000,
  };
}

export function WorkGallery({
  images,
  coverAssetId,
}: {
  images: WorkImageListItem[];
  /** Asset id to omit (rendered separately as hero). */
  coverAssetId: number | null;
}) {
  const items = coverAssetId
    ? images.filter((r) => r.mediaAssetId !== coverAssetId)
    : images;
  if (items.length === 0) return null;

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
          alt={asset.alt || asset.title || ''}
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
