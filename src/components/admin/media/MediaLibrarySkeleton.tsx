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
      className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8"
      aria-busy="true"
      aria-label="กำลังโหลด media library"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </header>

      {/* Search bar shape — input + submit */}
      <Skeleton className="h-8 w-full max-w-xl rounded-lg" />

      {/* Tabs */}
      <div className="flex gap-3 border-b border-line pb-2">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-5 w-24 rounded" />
      </div>

      {/* Grid */}
      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: cardCount }).map((_, i) => (
          <MediaAssetCardSkeleton key={i} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Matches `MediaAssetCard` — 4:3 thumb + title + alt + meta row + delete bar.
 */
export function MediaAssetCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-brand-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-7 w-full rounded-md" />
      </div>
    </li>
  );
}

/**
 * Matches `MediaPairCard` — two 4:3 thumbs side by side + label + delete.
 */
export function MediaPairCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-brand-card">
      <div className="grid grid-cols-2 gap-px bg-line">
        <Skeleton className="aspect-[4/3] rounded-none" />
        <Skeleton className="aspect-[4/3] rounded-none" />
      </div>
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-7 w-full rounded-md" />
      </div>
    </li>
  );
}
