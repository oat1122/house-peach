import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { requireRole } from '@/lib/auth-guard';
import { listWorks } from '@/lib/services/work';

export const dynamic = 'force-dynamic';

const ROOM_TYPE_LABELS: Record<string, string> = {
  living: 'ห้องนั่งเล่น',
  bedroom: 'ห้องนอน',
  kitchen: 'ห้องครัว',
  bathroom: 'ห้องน้ำ',
  office: 'ห้องทำงาน',
  outdoor: 'พื้นที่ภายนอก',
  full_house: 'ทั้งบ้าน',
  other: 'อื่น ๆ',
};

const STATUS_TONE: Record<string, string> = {
  draft: 'border-border bg-muted text-muted-foreground',
  published: 'border-foreground/30 bg-foreground/10 text-foreground',
  archived: 'border-destructive/30 bg-destructive/10 text-destructive',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
};

export default async function AdminWorksPage() {
  await requireRole();
  const works = await listWorks();

  return (
    <section className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">ผลงาน</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            จัดการ portfolio works · {works.length} รายการ
          </p>
        </div>
        <Button render={<Link href="/admin/works/new" />} nativeButton={false}>
          + สร้างผลงานใหม่
        </Button>
      </header>

      {works.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[64px_1fr_120px_120px_80px_80px] gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>ปก</span>
            <span>ชื่อ / slug</span>
            <span>ประเภท</span>
            <span>สถานะ</span>
            <span>แท็ก</span>
            <span className="text-right">action</span>
          </div>
          {works.map((w) => (
            <div
              key={w.id}
              className="grid grid-cols-[64px_1fr_120px_120px_80px_80px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                {w.coverPath ? (
                  <Image
                    src={w.coverPath}
                    alt={w.coverAlt ?? w.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">
                    no cover
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/admin/works/${w.id}/edit`}
                  className="block truncate text-sm font-medium text-foreground hover:underline"
                >
                  {w.title}
                </Link>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  /works/{w.slug}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {ROOM_TYPE_LABELS[w.roomType] ?? w.roomType}
              </span>
              <span
                className={
                  'inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] ' +
                  (STATUS_TONE[w.status] ?? '')
                }
              >
                {STATUS_LABEL[w.status] ?? w.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {w.tagCount > 0 ? `${w.tagCount} แท็ก` : '—'}
              </span>
              <Button
                size="xs"
                variant="outline"
                render={<Link href={`/admin/works/${w.id}/edit`} />}
                nativeButton={false}
                className="justify-self-end"
              >
                แก้ไข
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">ยังไม่มีผลงาน</p>
      <p className="mt-1 text-sm text-muted-foreground">
        คลิก &ldquo;สร้างผลงานใหม่&rdquo; เพื่อเริ่ม
      </p>
      <Button
        className="mt-4"
        render={<Link href="/admin/works/new" />}
        nativeButton={false}
      >
        + สร้างผลงานใหม่
      </Button>
    </div>
  );
}
