import { Skeleton } from '@/components/ui/skeleton';

/**
 * Route-level loading skeleton for /contact.
 * Dimensions mirror the final layout to prevent CLS per loading-states.md.
 */
export default function ContactLoading() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดหน้าติดต่อ">
      {/* Hero skeleton */}
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="pt-10 md:pt-12">
          {/* Kicker */}
          <Skeleton className="h-3 w-40 rounded mb-3" />
          {/* h1 — two lines mirroring the serif headline */}
          <Skeleton className="h-12 sm:h-14 md:h-20 w-full max-w-2xl rounded mb-2" />
          <Skeleton className="h-10 sm:h-12 md:h-16 w-3/4 max-w-xl rounded mb-4" />
          {/* Lead text */}
          <Skeleton className="h-5 w-full max-w-prose rounded mt-3 mb-1" />
          <Skeleton className="h-5 w-4/5 max-w-prose rounded" />
        </div>
      </div>

      {/* 2-col body skeleton */}
      <div className="mx-auto max-w-6xl px-4 md:px-6 mt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
          {/* Form skeleton — 2 cols */}
          <div className="md:col-span-2 space-y-6">
            {/* Row 1: name */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-[44px] w-full rounded-lg" />
            </div>
            {/* Row 2: email */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-[44px] w-full rounded-lg" />
            </div>
            {/* Row 3: phone */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-[44px] w-full rounded-lg" />
            </div>
            {/* Row 4: service type */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-[44px] w-full rounded-lg" />
            </div>
            {/* Row 5: budget */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-[44px] w-full rounded-lg" />
            </div>
            {/* Row 6: textarea */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-52 rounded" />
              <Skeleton className="h-[132px] w-full rounded-lg" />
              <Skeleton className="h-3 w-full max-w-xs rounded" />
            </div>
            {/* Submit button */}
            <Skeleton className="h-[44px] w-full md:w-36 rounded-lg" />
          </div>

          {/* Info card skeleton — 1 col */}
          <div className="space-y-4 rounded-xl border border-line p-6">
            <div className="flex items-start gap-3">
              <Skeleton className="size-5 rounded shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Skeleton className="size-5 rounded shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>
            <Skeleton className="h-px w-full rounded" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
