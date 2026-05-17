import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton fallback for /blog/[slug] detail page.
 * Dimensions match the live layout to prevent CLS (loading-states.md §1).
 * 2-column layout on desktop (lg:), single column on mobile.
 */
export default function BlogDetailLoading() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดบทความ">
      {/* Hero skeleton */}
      <div className="bg-bg pt-16 pb-8 md:pt-20 md:pb-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-5 w-full max-w-xl" />
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-16 items-start">
          {/* Main */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={`h-5 ${i % 4 === 3 ? 'w-3/4' : 'w-full'}`} />
            ))}
            <Skeleton className="h-32 w-full mt-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`b${i}`} className={`h-5 ${i % 4 === 3 ? 'w-2/3' : 'w-full'}`} />
            ))}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[180px] w-full rounded-xl" />
            <Skeleton className="h-[220px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
