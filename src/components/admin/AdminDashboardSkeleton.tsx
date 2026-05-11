import { Skeleton } from '@/components/ui/skeleton';

/**
 * Mirrors `/admin` dashboard layout — greeting line + 3 card grid + tip box.
 * Wrap in aria-busy at the caller (route `loading.tsx`).
 */
export function AdminDashboardSkeleton() {
  return (
    <section
      className="w-full px-4 py-6 lg:px-6 lg:py-8"
      aria-busy="true"
      aria-label="กำลังโหลดแดชบอร์ด"
    >
      <Skeleton className="h-8 w-64 rounded" />
      <Skeleton className="mt-3 h-4 w-80 rounded" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>

      <Skeleton className="mt-10 h-14 w-full rounded-md" />
    </section>
  );
}

function DashboardCardSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-line bg-brand-card p-5">
      <Skeleton className="h-5 w-24 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-3/4 rounded" />
    </div>
  );
}
