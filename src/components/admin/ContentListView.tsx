'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Check,
  Eye,
  LayoutGrid,
  Pencil,
  Rows3,
  Trash2,
} from 'lucide-react';

import { StatusBadge } from '@/components/admin/StatusBadge';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { ContentStatus } from '@/lib/validation/post';
import type { ActionResult } from '@/lib/actions/post';

export type ContentListRow = {
  id: number;
  title: string;
  subtitle: string;
  status: ContentStatus;
  coverPath: string | null;
  coverAlt: string | null;
  metaCols: string[];
  gridMeta: string;
};

type BulkStatusAction = (input: {
  ids: number[];
  status: ContentStatus;
}) => Promise<ActionResult>;
type BulkDeleteAction = (input: { ids: number[] }) => Promise<ActionResult>;

type Props = {
  rows: ContentListRow[];
  metaHeaders: string[];
  view: 'grid' | 'table';
  basePath: string;
  entityLabel: string;
  bulkSetStatusAction: BulkStatusAction;
  bulkDeleteAction: BulkDeleteAction;
};

export function ContentListView({
  rows,
  metaHeaders,
  view,
  basePath,
  entityLabel,
  bulkSetStatusAction,
  bulkDeleteAction,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const ids = [...selected];

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  }
  function clearSelection() {
    setSelected(new Set());
  }

  function runBulk(fn: () => Promise<ActionResult>, successMsg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(successMsg);
        clearSelection();
        router.refresh();
      } else {
        toast.error(res.error || 'ทำรายการไม่สำเร็จ');
      }
    });
  }

  function bulkPublish() {
    runBulk(
      () => bulkSetStatusAction({ ids, status: 'published' }),
      `เผยแพร่ ${ids.length} รายการแล้ว`,
    );
  }

  async function bulkDelete() {
    const ok = await confirm({
      title: `ลบ ${selected.size} ${entityLabel}?`,
      description: 'การลบนี้ย้อนกลับไม่ได้ — เนื้อหาและภาพที่ผูกอยู่จะถูกลบถาวร',
      tone: 'destructive',
      confirmLabel: 'ลบ',
    });
    if (!ok) return;
    runBulk(
      () => bulkDeleteAction({ ids }),
      `ลบ ${ids.length} รายการแล้ว`,
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-end">
        <ViewToggle view={view} basePath={basePath} />
      </div>

      {selected.size > 0 && (
        <div
          className="mt-3.5 flex flex-wrap items-center gap-3.5 rounded-xl bg-ink px-4 py-2.5 text-sm text-bg"
          role="region"
          aria-label="การจัดการแบบหลายรายการ"
          aria-busy={pending}
        >
          <span className="font-medium">เลือก {selected.size} รายการ</span>
          <span className="h-4 w-px bg-bg/25" aria-hidden />
          <button
            type="button"
            onClick={bulkPublish}
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-bg/90 hover:text-bg disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden /> เผยแพร่
          </button>
          <button
            type="button"
            onClick={bulkDelete}
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-danger hover:opacity-80 disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden /> ลบ
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto text-bg/60 hover:text-bg"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {rows.length === 0 ? null : view === 'grid' ? (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-4">
          {rows.map((r) => (
            <GridCard
              key={r.id}
              row={r}
              basePath={basePath}
              selected={selected.has(r.id)}
              onToggle={() => toggle(r.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-brand-card">
          <div className="flex items-center gap-3.5 border-b border-line bg-bg2/50 px-4 py-2.5 text-[11.5px] font-semibold tracking-wide text-muted-brand">
            <CheckButton
              checked={allChecked}
              onClick={toggleAll}
              label="เลือกทั้งหมด"
            />
            <span className="flex-1">ชื่อ / slug</span>
            <span className="w-28 shrink-0 max-md:hidden">สถานะ</span>
            {metaHeaders.map((h) => (
              <span key={h} className="w-28 shrink-0 max-md:hidden">
                {h}
              </span>
            ))}
            <span className="w-20 shrink-0 text-right">จัดการ</span>
          </div>
          {rows.map((r) => (
            <TableRow
              key={r.id}
              row={r}
              basePath={basePath}
              selected={selected.has(r.id)}
              onToggle={() => toggle(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({ view, basePath }: { view: string; basePath: string }) {
  const base =
    'grid size-8 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent';
  return (
    <div className="flex gap-1 rounded-xl bg-bg2 p-1">
      <Link
        href={{ pathname: basePath, query: { view: 'grid' } }}
        aria-label="มุมมองกริด"
        aria-current={view === 'grid' ? 'true' : undefined}
        className={cn(
          base,
          view === 'grid'
            ? 'bg-brand-card text-ink shadow-sm'
            : 'text-muted-brand hover:text-ink',
        )}
      >
        <LayoutGrid className="size-4" aria-hidden />
      </Link>
      <Link
        href={{ pathname: basePath, query: { view: 'table' } }}
        aria-label="มุมมองตาราง"
        aria-current={view === 'table' ? 'true' : undefined}
        className={cn(
          base,
          view === 'table'
            ? 'bg-brand-card text-ink shadow-sm'
            : 'text-muted-brand hover:text-ink',
        )}
      >
        <Rows3 className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

function CheckButton({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        'grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition',
        checked
          ? 'border-ink bg-ink text-bg'
          : 'border-line bg-brand-card text-transparent hover:border-brand-accent',
      )}
    >
      <Check className="size-3" aria-hidden />
    </button>
  );
}

function GridCard({
  row,
  basePath,
  selected,
  onToggle,
}: {
  row: ContentListRow;
  basePath: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-brand-card transition hover:-translate-y-0.5 hover:shadow-sm',
        selected ? 'border-brand-accent' : 'border-line hover:border-brand-accent',
      )}
    >
      <div className="absolute right-2.5 top-2.5 z-10">
        <CheckButton
          checked={selected}
          onClick={onToggle}
          label={`เลือก ${row.title}`}
        />
      </div>
      <Link
        href={`${basePath}/${row.id}`}
        className="relative block h-40 bg-bg2"
        aria-label={row.title}
      >
        {row.coverPath ? (
          <Image
            src={row.coverPath}
            alt={row.coverAlt ?? ''}
            fill
            sizes="248px"
            className="object-cover"
            unoptimized
          />
        ) : null}
        <span className="absolute left-2.5 top-2.5">
          <StatusBadge status={row.status} />
        </span>
      </Link>
      <div className="p-3.5">
        <Link href={`${basePath}/${row.id}`} className="block">
          <div className="truncate text-sm font-semibold text-ink">
            {row.title}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-muted-brand">
            {row.subtitle}
          </div>
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11.5px] text-muted-brand">{row.gridMeta}</span>
          <Link
            href={`${basePath}/${row.id}/edit`}
            aria-label={`แก้ไข ${row.title}`}
            className="grid size-[30px] place-items-center rounded-lg border border-line text-muted-brand transition hover:bg-bg2 hover:text-ink"
          >
            <Pencil className="size-[15px]" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

function TableRow({
  row,
  basePath,
  selected,
  onToggle,
}: {
  row: ContentListRow;
  basePath: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3.5 border-b border-line px-4 py-3 last:border-b-0',
        selected && 'bg-bg2/40',
      )}
    >
      <CheckButton
        checked={selected}
        onClick={onToggle}
        label={`เลือก ${row.title}`}
      />
      <Link
        href={`${basePath}/${row.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-bg2">
          {row.coverPath ? (
            <Image
              src={row.coverPath}
              alt={row.coverAlt ?? ''}
              fill
              sizes="40px"
              className="object-cover"
              unoptimized
            />
          ) : null}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-medium text-ink">
            {row.title}
          </span>
          <span className="block truncate font-mono text-[11px] text-muted-brand">
            {row.subtitle}
          </span>
        </span>
      </Link>
      <span className="w-28 shrink-0 max-md:hidden">
        <StatusBadge status={row.status} />
      </span>
      {row.metaCols.map((m, i) => (
        <span
          key={i}
          className="w-28 shrink-0 truncate text-[12.5px] text-muted-brand max-md:hidden"
        >
          {m}
        </span>
      ))}
      <span className="flex w-20 shrink-0 justify-end gap-1.5">
        <Link
          href={`${basePath}/${row.id}`}
          aria-label={`ดู ${row.title}`}
          className="grid size-[31px] place-items-center rounded-lg border border-line text-muted-brand transition hover:bg-bg2 hover:text-ink"
        >
          <Eye className="size-4" aria-hidden />
        </Link>
        <Link
          href={`${basePath}/${row.id}/edit`}
          aria-label={`แก้ไข ${row.title}`}
          className="grid size-[31px] place-items-center rounded-lg border border-line text-muted-brand transition hover:bg-bg2 hover:text-ink"
        >
          <Pencil className="size-4" aria-hidden />
        </Link>
      </span>
    </div>
  );
}
