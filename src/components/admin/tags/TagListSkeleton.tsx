import { Skeleton } from '@/components/ui/skeleton';

export function TagListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <section
      className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8"
      aria-busy="true"
      aria-label="กำลังโหลดแท็ก"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </header>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1fr_140px_100px_60px_140px_44px] gap-3 border-b border-border bg-muted/40 px-4 py-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-6 rounded" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_140px_100px_60px_140px_44px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-3 w-8 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}
