import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

import { ContentListView } from '@/components/admin/ContentListView';
import type { ContentListRow } from '@/components/admin/ContentListView';
import { cn } from '@/lib/utils';
import { requireRole } from '@/lib/auth-guard';
import {
  bulkDeleteWorksAction,
  bulkSetWorkStatusAction,
} from '@/lib/actions/work';
import { listWorks } from '@/lib/services/work';
import type { ContentStatus } from '@/lib/validation/post';

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

const STATUS_FILTERS: { value: ContentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'published', label: 'เผยแพร่' },
  { value: 'draft', label: 'ฉบับร่าง' },
  { value: 'archived', label: 'เก็บแล้ว' },
];

export default async function AdminWorksPage(props: {
  searchParams: Promise<{ status?: string; q?: string; view?: string }>;
}) {
  await requireRole();
  const sp = await props.searchParams;
  const status = (STATUS_FILTERS.find((f) => f.value === sp.status)?.value ??
    'all') as ContentStatus | 'all';
  const q = sp.q?.trim().toLowerCase() || undefined;
  // Works default to the gallery-friendly grid view; admin can switch to table.
  const view = sp.view === 'table' ? 'table' : 'grid';

  const all = await listWorks();
  const works = all.filter((w) => {
    if (status !== 'all' && w.status !== status) return false;
    if (q && !`${w.title} ${w.slug}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const rows: ContentListRow[] = works.map((w) => ({
    id: w.id,
    title: w.title,
    subtitle: `/works/${w.slug}`,
    status: w.status,
    coverPath: w.coverPath,
    coverAlt: w.coverAlt,
    metaCols: [
      ROOM_TYPE_LABELS[w.roomType] ?? w.roomType,
      w.style,
    ],
    gridMeta: `${ROOM_TYPE_LABELS[w.roomType] ?? w.roomType} · ${w.style}`,
  }));

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-normal text-ink">ผลงาน</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-brand">
            จัดการ portfolio works · {works.length} รายการ
          </p>
        </div>
        <Link
          href="/admin/works/new"
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13.5px] font-medium text-bg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          <Plus className="size-4" aria-hidden /> สร้างผลงานใหม่
        </Link>
      </div>

      <form
        method="GET"
        className="mt-5 flex flex-wrap items-center gap-2.5"
        role="search"
        aria-label="กรอง + ค้นหาผลงาน"
      >
        {view === 'table' && <input type="hidden" name="view" value="table" />}
        <div className="relative min-w-[230px] flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-brand"
            aria-hidden
          />
          <label htmlFor="work-search" className="sr-only">
            ค้นหาผลงาน
          </label>
          <input
            id="work-search"
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="ค้นหาชื่อ หรือ slug…"
            className="h-10 w-full rounded-xl border border-line bg-brand-card pl-10 pr-3.5 text-[13.5px] text-ink outline-none focus-visible:border-brand-accent focus-visible:ring-2 focus-visible:ring-brand-accent/30"
          />
        </div>
        <div className="flex gap-1.5 rounded-xl bg-bg2 p-1">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Link
                key={f.value}
                href={{
                  pathname: '/admin/works',
                  query: {
                    ...(f.value !== 'all' ? { status: f.value } : {}),
                    ...(sp.q ? { q: sp.q } : {}),
                    ...(view === 'table' ? { view: 'table' } : {}),
                  },
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition',
                  active
                    ? 'bg-brand-card text-ink shadow-sm'
                    : 'text-muted-brand hover:text-ink',
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState filtered={status !== 'all' || !!q} />
      ) : (
        <ContentListView
          rows={rows}
          metaHeaders={['ห้อง', 'สไตล์']}
          view={view}
          basePath="/admin/works"
          entityLabel="ผลงาน"
          bulkSetStatusAction={bulkSetWorkStatusAction}
          bulkDeleteAction={bulkDeleteWorksAction}
        />
      )}
    </section>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-line bg-brand-card py-14 text-center">
      <p className="text-sm font-medium text-ink">
        {filtered ? 'ไม่พบผลงานที่ตรงเงื่อนไข' : 'ยังไม่มีผลงาน'}
      </p>
      <p className="mt-1.5 text-sm text-muted-brand">
        {filtered ? 'ลองเปลี่ยนตัวกรอง หรือลบคำค้นหา' : 'คลิก “สร้างผลงานใหม่” เพื่อเริ่ม'}
      </p>
    </div>
  );
}
