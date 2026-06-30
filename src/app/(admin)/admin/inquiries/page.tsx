import Link from 'next/link';

import { InquiryRowActions } from '@/components/admin/inquiries/InquiryRowActions';
import { InquiryStatusBadge } from '@/components/admin/inquiries/InquiryStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { requireRole } from '@/lib/auth-guard';
import type { InquiryStatus } from '@/lib/db/schema/contactInquiries';
import {
  countInquiriesByStatus,
  listInquiries,
} from '@/lib/services/contact';
import type { ServiceType } from '@/lib/validation/contact';

export const dynamic = 'force-dynamic';

type StatusFilter = InquiryStatus | 'all';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'new', label: 'ใหม่' },
  { value: 'contacted', label: 'ติดต่อแล้ว' },
  { value: 'closed', label: 'ปิดงาน' },
];

const SERVICE_LABEL: Record<ServiceType, string> = {
  full_design: 'ออกแบบทั้งหมด',
  consultation: 'ปรึกษาออกแบบ',
  partial: 'บางส่วน / ห้องเดียว',
  other: 'อื่น ๆ',
};

export default async function AdminInquiriesPage(props: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireRole();
  const sp = await props.searchParams;

  const statusParam = STATUS_FILTERS.find((f) => f.value === sp.status)?.value;
  const status: StatusFilter = statusParam ?? 'all';
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, total, hasMore }, counts] = await Promise.all([
    listInquiries({ status, q, page, perPage: 25 }),
    countInquiriesByStatus(),
  ]);

  const hasPrev = page > 1;

  return (
    <section className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            จัดการคำขอติดต่อ · {counts.all} รายการ
          </p>
        </div>
      </header>

      <form
        method="GET"
        className="flex flex-wrap items-center gap-2"
        role="search"
        aria-label="กรอง + ค้นหาคำขอ"
      >
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            const count =
              f.value === 'all' ? counts.all : counts[f.value as InquiryStatus];
            return (
              <Badge
                key={f.value}
                variant={active ? 'default' : 'outline'}
                className="px-3 py-0.5"
                render={
                  <Link
                    href={{
                      pathname: '/admin/inquiries',
                      query: {
                        ...(f.value !== 'all' ? { status: f.value } : {}),
                        ...(q ? { q } : {}),
                      },
                    }}
                    aria-current={active ? 'page' : undefined}
                  >
                    {f.label}{' '}
                    <span className="opacity-70">({count})</span>
                  </Link>
                }
              />
            );
          })}
        </div>
        <label htmlFor="inquiry-search" className="sr-only">
          ค้นหาคำขอติดต่อตามชื่อหรืออีเมล
        </label>
        <input
          id="inquiry-search"
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="ค้นหาชื่อหรืออีเมล…"
          className="h-8 flex-1 rounded-md border border-border bg-background px-3 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        {status !== 'all' && (
          <input type="hidden" name="status" value={status} />
        )}
        <Button type="submit" size="sm" variant="outline">
          ค้นหา
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState filtered={status !== 'all' || !!q} />
      ) : (
        <>
          <Card size="sm" className="overflow-hidden p-0">
            <CardContent className="p-0">
              <div className="grid grid-cols-[90px_1fr_180px_120px_110px_44px] gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                <span>สถานะ</span>
                <span>ชื่อ</span>
                <span>อีเมล</span>
                <span>บริการ</span>
                <span>วันที่</span>
                <span className="sr-only">action</span>
              </div>
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[90px_1fr_180px_120px_110px_44px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <InquiryStatusBadge status={row.status} />

                  <div className="min-w-0">
                    <Link
                      href={`/admin/inquiries/${row.id}`}
                      className="block truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {row.contactName}
                    </Link>
                  </div>

                  <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                    {row.contactEmail}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {SERVICE_LABEL[row.serviceType] ?? row.serviceType}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </span>

                  <InquiryRowActions
                    id={row.id}
                    email={row.contactEmail}
                    name={row.contactName}
                    status={row.status}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {(hasPrev || hasMore) && (
            <div className="flex items-center justify-between gap-2">
              {hasPrev ? (
                <Link
                  href={{
                    pathname: '/admin/inquiries',
                    query: buildQuery({ status, q, page: page - 1 }),
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  ← ก่อนหน้า
                </Link>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  ← ก่อนหน้า
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                หน้า {page} · {total} รายการ
              </span>
              {hasMore ? (
                <Link
                  href={{
                    pathname: '/admin/inquiries',
                    query: buildQuery({ status, q, page: page + 1 }),
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  ถัดไป →
                </Link>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  ถัดไป →
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-3 py-12 text-center">
        <p className="text-sm font-medium text-foreground">
          {filtered ? 'ไม่พบคำขอที่ตรงเงื่อนไข' : 'ยังไม่มีคำขอติดต่อ'}
        </p>
        <p className="text-sm text-muted-foreground">
          {filtered
            ? 'ลองเปลี่ยนตัวกรอง หรือลบคำค้นหา'
            : 'เมื่อมีคนส่งคำขอผ่านหน้า Contact จะปรากฏที่นี่'}
        </p>
      </CardContent>
    </Card>
  );
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(date);
}

function buildQuery(params: {
  status: StatusFilter;
  q: string | undefined;
  page: number;
}) {
  return {
    ...(params.status !== 'all' ? { status: params.status } : {}),
    ...(params.q ? { q: params.q } : {}),
    ...(params.page > 1 ? { page: String(params.page) } : {}),
  };
}
