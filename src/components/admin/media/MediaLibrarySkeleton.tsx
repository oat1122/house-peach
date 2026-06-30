import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder for the media library shell while it streams in.
 * Dimensions mirror `MediaLibrary` + `MediaAssetCard` so the swap to real
 * content doesn't shift the layout (CLS < 0.1 target).
 *
 * Wrap the rendered output in `aria-busy="true"` at the caller — Next's
 * route `loading.tsx` should set that on its main wrapper.
 */
export function MediaLibrarySkeleton({
  cardCount = 8,
}: {
  cardCount?: number;
}) {
  return (
    <section
      className="w-full space-y-5 px-4 py-6 lg:px-6 lg:py-8"
      aria-busy="true"
      aria-label="กำลังโหลด media library"
    >
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </header>

      {/* Tabs + Search row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Pill tab track */}
        <Skeleton className="h-9 w-52 rounded-xl" />
        {/* Search */}
        <Skeleton className="h-9 flex-1 min-w-48 max-w-xl rounded-xl" />
      </div>

      {/* Grid */}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(186px,1fr))] gap-3.5">
        {Array.from({ length: cardCount }).map((_, i) => (
          <MediaAssetCardSkeleton key={i} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Matches `MediaAssetCard` — 140px thumb + title + dimensions + icon row.
 */
export function MediaAssetCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-brand-card">
      <Skeleton className="h-[140px] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24 rounded" />
          <div className="flex gap-0.5">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Matches `MediaPairCard` — two 4:3 thumbs side by side + label + delete icon.
 */
export function MediaPairCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-brand-card">
      <div className="relative flex">
        <div className="flex-1">
          <Skeleton className="aspect-[4/3] rounded-none" />
        </div>
        <div className="flex-1">
          <Skeleton className="aspect-[4/3] rounded-none" />
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-2/3 rounded" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
    </li>
  );
}
