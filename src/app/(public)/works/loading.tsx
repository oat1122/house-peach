import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton fallback for /works listing page.
 *
 * Mirrors the visual shape of the page to prevent CLS:
 * - H1 placeholder (2 lines)
 * - Lead paragraph (2 lines)
 * - Count eyebrow
 * - Filter bar chips (3)
 * - Hero card (image + 3 text lines)
 * - 6 regular card skeletons (2-col mobile, 3-col desktop)
 *
 * Per loading-states.md: aria-busy + aria-label on wrapper, CLS < 0.1.
 */
export default function WorksLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="กำลังโหลดผลงาน"
      className="mx-auto max-w-6xl px-4 md:px-6"
    >
      {/* H1 + lead + count */}
      <div className="pt-10 md:pt-12">
        <Skeleton className="h-12 w-64 md:h-20 md:w-80" />
        <Skeleton className="h-4 w-full max-w-sm mt-4" />
        <Skeleton className="h-4 w-3/4 max-w-xs mt-2" />
        <Skeleton className="h-3 w-24 mt-4" />
      </div>

      {/* Filter bar */}
      <div className="mt-6 py-3 border-b border-line flex gap-3">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Hero card skeleton */}
      <div className="mt-10">
        <Skeleton className="aspect-[3/2] w-full rounded-none md:rounded-md" />
        <Skeleton className="h-3 w-36 mt-4" />
        <Skeleton className="h-8 w-3/4 mt-2" />
        <Skeleton className="h-4 w-full max-w-prose mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />
        <Skeleton className="h-3 w-28 mt-3" />
      </div>

      {/* Divider */}
      <div className="border-t border-line mt-12" />

      {/* Regular grid skeletons — 6 cards */}
      <ul className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 list-none p-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="aspect-[3/2] w-full rounded-md" />
            <Skeleton className="h-3 w-20 mt-3" />
            <Skeleton className="h-4 w-full mt-1" />
            <Skeleton className="h-3 w-16 mt-1" />
          </li>
        ))}
      </ul>
    </section>
  );
}
