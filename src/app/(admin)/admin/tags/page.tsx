import Link from 'next/link';

import { TagList } from '@/components/admin/tags/TagList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireRole } from '@/lib/auth-guard';
import { listTagsForAdmin } from '@/lib/services/tag';
import { tagKindValues, type TagKind } from '@/lib/db/schema/tags';

export const dynamic = 'force-dynamic';

const KIND_FILTERS: { value: TagKind | 'all'; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'post', label: 'post' },
  { value: 'work', label: 'work' },
  { value: 'both', label: 'both' },
];

function parseKind(raw: string | undefined): TagKind | 'all' {
  if (!raw) return 'all';
  if (raw === 'all') return 'all';
  if (tagKindValues.includes(raw as TagKind)) return raw as TagKind;
  return 'all';
}

export default async function AdminTagsPage(props: {
  searchParams: Promise<{ kind?: string; q?: string }>;
}) {
  await requireRole();
  const sp = await props.searchParams;
  const kind = parseKind(sp.kind);
  const q = sp.q?.trim() || undefined;

  const tags = await listTagsForAdmin({ kind, q });

  return (
    <section className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">แท็ก</h1>
        <p className="text-sm text-muted-foreground">
          จัดการแท็กที่ใช้กับบทความและผลงาน · {tags.length} รายการ
        </p>
      </header>

      <form
        method="GET"
        className="flex flex-wrap items-center gap-2"
        role="search"
        aria-label="กรอง + ค้นหาแท็ก"
      >
        <div className="flex flex-wrap gap-1">
          {KIND_FILTERS.map((f) => {
            const active = kind === f.value;
            return (
              <Badge
                key={f.value}
                variant={active ? 'default' : 'outline'}
                className="px-3 py-0.5"
                render={
                  <Link
                    href={{
                      pathname: '/admin/tags',
                      query: {
                        ...(f.value !== 'all' ? { kind: f.value } : {}),
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
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="ค้นหา ชื่อ หรือ slug…"
          className="h-8 flex-1 rounded-md border border-border bg-background px-3 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        {kind !== 'all' && <input type="hidden" name="kind" value={kind} />}
        <Button type="submit" size="sm" variant="outline">
          ค้นหา
        </Button>
      </form>

      <TagList tags={tags} />
    </section>
  );
}
