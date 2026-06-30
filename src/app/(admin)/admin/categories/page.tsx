import Link from 'next/link';
import { Search } from 'lucide-react';

import { CategoryList } from '@/components/admin/categories/CategoryList';
import { cn } from '@/lib/utils';
import { requireRole } from '@/lib/auth-guard';
import { listCategoriesForAdmin } from '@/lib/services/category';
import {
  categoryKindValues,
  type CategoryKind,
} from '@/lib/db/schema/categories';

export const dynamic = 'force-dynamic';

const KIND_FILTERS: { value: CategoryKind | 'all'; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'post', label: 'บทความ' },
  { value: 'work', label: 'ผลงาน' },
  { value: 'both', label: 'ทั้งสอง' },
];

function parseKind(raw: string | undefined): CategoryKind | 'all' {
  if (!raw || raw === 'all') return 'all';
  if (categoryKindValues.includes(raw as CategoryKind)) return raw as CategoryKind;
  return 'all';
}

export default async function AdminCategoriesPage(props: {
  searchParams: Promise<{ kind?: string; q?: string }>;
}) {
  await requireRole();
  const sp = await props.searchParams;
  const kind = parseKind(sp.kind);
  const q = sp.q?.trim() || undefined;

  const categories = await listCategoriesForAdmin({ kind, q });

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <h1 className="font-serif text-2xl font-normal text-ink">หมวดหมู่</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-brand">
          จัดกลุ่มเนื้อหาเป็นหัวข้อหลัก · {categories.length} รายการ
        </p>
      </div>

      <form
        method="GET"
        className="flex flex-wrap items-center gap-2.5"
        role="search"
        aria-label="กรอง + ค้นหาหมวดหมู่"
      >
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-brand"
            aria-hidden
          />
          <label htmlFor="cat-search" className="sr-only">
            ค้นหาหมวดหมู่
          </label>
          <input
            id="cat-search"
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="ค้นหาชื่อ หรือ slug…"
            className="h-10 w-full rounded-xl border border-line bg-brand-card pl-10 pr-3.5 text-[13.5px] text-ink outline-none focus-visible:border-brand-accent focus-visible:ring-2 focus-visible:ring-brand-accent/30"
          />
        </div>
        <div className="flex gap-1.5 rounded-xl bg-bg2 p-1">
          {KIND_FILTERS.map((f) => {
            const active = kind === f.value;
            return (
              <Link
                key={f.value}
                href={{
                  pathname: '/admin/categories',
                  query: {
                    ...(f.value !== 'all' ? { kind: f.value } : {}),
                    ...(q ? { q } : {}),
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

      <CategoryList categories={categories} />
    </section>
  );
}
