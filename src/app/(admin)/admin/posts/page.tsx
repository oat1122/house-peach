import Image from 'next/image';
import Link from 'next/link';

import { PostRowActions } from '@/components/admin/posts/PostRowActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { requireRole } from '@/lib/auth-guard';
import { listPostsForAdmin } from '@/lib/services/post';
import type { ContentStatus } from '@/lib/validation/post';

export const dynamic = 'force-dynamic';

const STATUS_VARIANT: Record<ContentStatus, 'default' | 'secondary' | 'destructive'> = {
  draft: 'secondary',
  published: 'default',
  archived: 'destructive',
};

const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
};

const STATUS_FILTERS: { value: ContentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'draft', label: 'draft' },
  { value: 'published', label: 'published' },
  { value: 'archived', label: 'archived' },
];

export default async function AdminPostsPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireRole();
  const sp = await props.searchParams;
  const statusParam = STATUS_FILTERS.find((f) => f.value === sp.status)?.value;
  const status = (statusParam ?? 'all') as ContentStatus | 'all';
  const q = sp.q?.trim() || undefined;

  const posts = await listPostsForAdmin({ status, q });

  return (
    <section className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">บทความ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            จัดการ blog posts · {posts.length} รายการ
          </p>
        </div>
        <Button render={<Link href="/admin/posts/new" />} nativeButton={false}>
          + สร้างบทความใหม่
        </Button>
      </header>

      <form
        method="GET"
        className="flex flex-wrap items-center gap-2"
        role="search"
        aria-label="กรอง + ค้นหาบทความ"
      >
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Badge
                key={f.value}
                variant={active ? 'default' : 'outline'}
                className="px-3 py-0.5"
                render={
                  <Link
                    href={{
                      pathname: '/admin/posts',
                      query: {
                        ...(f.value !== 'all' ? { status: f.value } : {}),
                        ...(q ? { q } : {}),
                      },
                    }}
                    aria-current={active ? 'page' : undefined}
                  >
                    {f.label}
                  </Link>
                }
              />
            );
          })}
        </div>
        <label htmlFor="post-search" className="sr-only">
          ค้นหาบทความ
        </label>
        <input
          id="post-search"
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="ค้นหา title หรือ slug…"
          className="h-8 flex-1 rounded-md border border-border bg-background px-3 text-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        {status !== 'all' && (
          <input type="hidden" name="status" value={status} />
        )}
        <Button type="submit" size="sm" variant="outline">
          ค้นหา
        </Button>
      </form>

      <Separator className="sr-only" />

      {posts.length === 0 ? (
        <EmptyState filtered={status !== 'all' || !!q} />
      ) : (
        <Card size="sm" className="overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="grid grid-cols-[64px_1fr_100px_140px_60px_44px] gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>ปก</span>
              <span>ชื่อ / slug</span>
              <span>สถานะ</span>
              <span>เผยแพร่</span>
              <span>แท็ก</span>
              <span className="sr-only">action</span>
            </div>
            {posts.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[64px_1fr_100px_140px_60px_44px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  {p.coverPath ? (
                    <Image
                      src={p.coverPath}
                      alt={p.coverAlt ?? p.title}
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
                    href={`/admin/posts/${p.id}/edit`}
                    className="block truncate text-sm font-medium text-foreground hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    /blog/{p.slug}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[p.status]}>
                  {STATUS_LABEL[p.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {p.publishedAt ? formatDate(p.publishedAt) : '—'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {p.tagCount > 0 ? `${p.tagCount}` : '—'}
                </span>
                <PostRowActions id={p.id} slug={p.slug} status={p.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-3 py-12 text-center">
        <p className="text-sm font-medium text-foreground">
          {filtered ? 'ไม่พบบทความที่ตรงเงื่อนไข' : 'ยังไม่มีบทความ'}
        </p>
        <p className="text-sm text-muted-foreground">
          {filtered
            ? 'ลองเปลี่ยนตัวกรอง หรือลบคำค้นหา'
            : 'คลิก "สร้างบทความใหม่" เพื่อเริ่ม'}
        </p>
        {!filtered && (
          <Button
            className="mt-2"
            render={<Link href="/admin/posts/new" />}
            nativeButton={false}
          >
            + สร้างบทความใหม่
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
  }).format(date);
}
