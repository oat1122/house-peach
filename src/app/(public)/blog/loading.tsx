import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton fallback for /blog listing page.
 * Mirrors exact dimensions of the live page to prevent CLS (loading-states.md §1).
 */
export default function BlogLoading() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดรายการบทความ">
      {/* Page header skeleton */}
      <div className="bg-bg pt-12 pb-6">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-80" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="border-b border-line">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[16/10] w-full rounded-md" />
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
