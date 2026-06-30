import { Skeleton } from '@/components/ui/skeleton';

/**
 * Mirrors `/admin` dashboard layout — greeting + 4 stat cards + recent /
 * quick-create two-column grid. Dimensions track the real page so the swap is
 * CLS-free. Wrap in aria-busy at the caller (route `loading.tsx`).
 */
export function AdminDashboardSkeleton() {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8"
      aria-busy="true"
      aria-label="กำลังโหลดแดชบอร์ด"
    >
      <Skeleton className="h-9 w-64 rounded" />
      <Skeleton className="mt-3 h-4 w-80 rounded" />

      <div className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3.5 rounded-2xl border border-line bg-brand-card p-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="size-4 rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-12 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3 rounded-2xl border border-line bg-brand-card p-4">
          <Skeleton className="h-5 w-32 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-[42px] rounded-[10px]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </section>
  );
}
