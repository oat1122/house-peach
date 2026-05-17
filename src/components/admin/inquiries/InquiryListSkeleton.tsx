import { Skeleton } from '@/components/ui/skeleton';

export function InquiryListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <section
      className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8"
      aria-busy="true"
      aria-label="กำลังโหลดคำขอติดต่อ"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </header>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1">
        {[80, 100, 110, 90].map((w, i) => (
          <Skeleton key={i} className={`h-5 w-[${w}px] rounded-full`} />
        ))}
        <Skeleton className="ml-2 h-8 flex-1 rounded-md" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {/* Header row */}
        <div className="grid grid-cols-[90px_1fr_180px_120px_110px_44px] gap-3 border-b border-border bg-muted/40 px-4 py-2">
          <Skeleton className="h-3.5 w-14 rounded" />
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3.5 w-16 rounded" />
          <Skeleton className="h-3.5 w-16 rounded" />
          <span className="sr-only">action</span>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[90px_1fr_180px_120px_110px_44px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="h-3 w-36 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}
