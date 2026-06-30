import { Skeleton } from '@/components/ui/skeleton';

export default function CategoriesLoading() {
  return (
    <section
      className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 lg:px-8"
      aria-busy="true"
      aria-label="กำลังโหลดหมวดหมู่"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 rounded" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="overflow-hidden rounded-2xl border border-line bg-brand-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0"
          >
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
