import { Skeleton } from '@/components/ui/skeleton';

export function PostListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <section
      className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8"
      aria-busy="true"
      aria-label="กำลังโหลดบทความ"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </header>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[64px_1fr_100px_140px_60px_80px] gap-3 border-b border-border bg-muted/40 px-4 py-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[64px_1fr_100px_140px_60px_80px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <Skeleton className="aspect-square h-12 rounded" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-8 rounded" />
            <Skeleton className="h-7 w-14 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}
