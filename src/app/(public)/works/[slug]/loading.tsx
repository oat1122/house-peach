import { Skeleton } from '@/components/ui/skeleton';

export default function WorkDetailLoading() {
  return (
    <article
      className="mx-auto max-w-4xl px-4 pt-8 pb-12 lg:px-6"
      aria-busy="true"
      aria-label="กำลังโหลดผลงาน"
    >
      <Skeleton className="h-3 w-48 rounded" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-10 w-3/4 rounded" />
        <Skeleton className="h-10 w-2/3 rounded" />
        <Skeleton className="h-4 w-full max-w-prose rounded" />
        <Skeleton className="h-4 w-5/6 max-w-prose rounded" />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>

      <Skeleton className="mt-8 aspect-[2/1] w-full rounded-2xl" />

      <div className="mt-10 space-y-3 max-w-prose">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="mt-6 h-6 w-1/3 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>
    </article>
  );
}
