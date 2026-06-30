import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

import { ContentListView } from '@/components/admin/ContentListView';
import type { ContentListRow } from '@/components/admin/ContentListView';
import { cn } from '@/lib/utils';
import { requireRole } from '@/lib/auth-guard';
import {
  bulkDeletePostsAction,
  bulkSetPostStatusAction,
} from '@/lib/actions/post';
import { listPostsForAdmin } from '@/lib/services/post';
import type { ContentStatus } from '@/lib/validation/post';

export const dynamic = 'force-dynamic';

const STATUS_FILTERS: { value: ContentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'published', label: 'เผยแพร่' },
  { value: 'draft', label: 'ฉบับร่าง' },
  { value: 'archived', label: 'เก็บแล้ว' },
];

function formatDate(d: Date | string | null): string {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(date);
}

export default async function AdminPostsPage(props: {
  searchParams: Promise<{ status?: string; q?: string; view?: string }>;
}) {
  await requireRole();
  const sp = await props.searchParams;
  const status = (STATUS_FILTERS.find((f) => f.value === sp.status)?.value ??
    'all') as ContentStatus | 'all';
  const q = sp.q?.trim() || undefined;
  const view = sp.view === 'grid' ? 'grid' : 'table';

  const posts = await listPostsForAdmin({ status, q });
  const rows: ContentListRow[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: `/blog/${p.slug}`,
    status: p.status,
    coverPath: p.coverPath,
    coverAlt: p.coverAlt,
    metaCols: [formatDate(p.publishedAt), p.tagCount > 0 ? `${p.tagCount} แท็ก` : '—'],
    gridMeta: formatDate(p.publishedAt),
  }));

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-normal text-ink">บทความ</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-brand">
            จัดการ blog posts · {posts.length} รายการ
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13.5px] font-medium text-bg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          <Plus className="size-4" aria-hidden /> สร้างบทความใหม่
        </Link>
      </div>

      <form
        method="GET"
        className="mt-5 flex flex-wrap items-center gap-2.5"
        role="search"
        aria-label="กรอง + ค้นหาบทความ"
      >
        {view === 'grid' && <input type="hidden" name="view" value="grid" />}
        <div className="relative min-w-[230px] flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-brand"
            aria-hidden
          />
          <label htmlFor="post-search" className="sr-only">
            ค้นหาบทความ
          </label>
          <input
            id="post-search"
            type="search"
            name="q"
            defaultValue={q ?? ''}
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
                  pathname: '/admin/posts',
                  query: {
                    ...(f.value !== 'all' ? { status: f.value } : {}),
                    ...(q ? { q } : {}),
                    ...(view === 'grid' ? { view: 'grid' } : {}),
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
          metaHeaders={['เผยแพร่', 'แท็ก']}
          view={view}
          basePath="/admin/posts"
          entityLabel="บทความ"
          bulkSetStatusAction={bulkSetPostStatusAction}
          bulkDeleteAction={bulkDeletePostsAction}
        />
      )}
    </section>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-line bg-brand-card py-14 text-center">
      <p className="text-sm font-medium text-ink">
        {filtered ? 'ไม่พบบทความที่ตรงเงื่อนไข' : 'ยังไม่มีบทความ'}
      </p>
      <p className="mt-1.5 text-sm text-muted-brand">
        {filtered ? 'ลองเปลี่ยนตัวกรอง หรือลบคำค้นหา' : 'คลิก “สร้างบทความใหม่” เพื่อเริ่ม'}
      </p>
    </div>
  );
}
