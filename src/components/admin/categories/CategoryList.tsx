'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { deleteCategoryAction } from '@/lib/actions/category';
import { toast } from '@/lib/toast';
import type { AdminCategoryItem } from '@/lib/services/category';
import type { CategoryKind } from '@/lib/db/schema/categories';

import { CategoryFormDialog } from './CategoryFormDialog';

type Props = {
  categories: AdminCategoryItem[];
};

const KIND_VARIANT: Record<CategoryKind, 'default' | 'secondary'> = {
  post: 'secondary',
  work: 'secondary',
  both: 'default',
};

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; category: AdminCategoryItem };

export function CategoryList({ categories }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [, startDeleting] = useTransition();

  const openCreate = () => setDialog({ mode: 'create' });
  const openEdit = (category: AdminCategoryItem) =>
    setDialog({ mode: 'edit', category });
  const closeDialog = () => setDialog({ mode: 'closed' });

  const handleDelete = async (c: AdminCategoryItem) => {
    const usage = formatUsage(c);
    const ok = await confirm({
      title: `ลบหมวดหมู่ "${c.name}"?`,
      description: usage
        ? `${usage} — เนื้อหาที่ใช้หมวดนี้จะกลายเป็นไม่มีหมวด (ไม่ถูกลบ)`
        : 'หมวดนี้ยังไม่ถูกใช้ที่ไหน — ลบได้ปลอดภัย',
      confirmLabel: 'ลบ',
      tone: 'destructive',
    });
    if (!ok) return;
    setDeletingId(c.id);
    startDeleting(async () => {
      const result = await deleteCategoryAction({ id: c.id });
      setDeletingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('ลบหมวดหมู่แล้ว');
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          สร้างหมวดหมู่ใหม่
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <Card size="sm" className="overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="grid grid-cols-[1fr_140px_90px_60px_120px_44px] gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>ชื่อ</span>
              <span>slug</span>
              <span>ประเภท</span>
              <span>ลำดับ</span>
              <span>การใช้งาน</span>
              <span className="sr-only">action</span>
            </div>
            {categories.map((c) => {
              const isDeleting = deletingId === c.id;
              return (
                <div
                  key={c.id}
                  aria-busy={isDeleting}
                  className="grid grid-cols-[1fr_140px_90px_60px_120px_44px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="flex min-w-0 items-center gap-2.5 text-left"
                  >
                    <span
                      aria-hidden
                      className="size-3 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: c.color ?? 'transparent' }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground hover:underline">
                        {c.name}
                      </span>
                      {c.summary && (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {c.summary}
                        </span>
                      )}
                    </span>
                  </button>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {c.slug}
                  </span>
                  <Badge variant={KIND_VARIANT[c.kind]}>{c.kind}</Badge>
                  <span className="text-xs text-muted-foreground">{c.sort}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatUsage(c) ?? '—'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="xs"
                          aria-label={`เมนูจัดการหมวดหมู่ ${c.name}`}
                          className="size-7 justify-self-end p-0"
                          disabled={isDeleting}
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(c)}>
                        <Pencil aria-hidden /> แก้ไข
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 aria-hidden /> ลบ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <CategoryFormDialog
        open={dialog.mode !== 'closed'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        defaults={
          dialog.mode === 'edit'
            ? {
                id: dialog.category.id,
                slug: dialog.category.slug,
                name: dialog.category.name,
                kind: dialog.category.kind,
                color: dialog.category.color ?? undefined,
                summary: dialog.category.summary ?? undefined,
                sort: dialog.category.sort,
              }
            : undefined
        }
      />
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card>
      <CardContent className="space-y-3 py-12 text-center">
        <p className="text-sm font-medium text-foreground">ยังไม่มีหมวดหมู่</p>
        <p className="text-sm text-muted-foreground">
          หมวดหมู่ช่วยจัดกลุ่มเนื้อหาเป็นหัวข้อหลัก — สร้างอันแรกเพื่อเริ่มใช้
        </p>
        <Button className="mt-2" onClick={onCreate}>
          <Plus className="size-4" aria-hidden />
          สร้างหมวดหมู่แรก
        </Button>
      </CardContent>
    </Card>
  );
}

function formatUsage(c: AdminCategoryItem): string | null {
  const parts: string[] = [];
  if (c.postCount > 0) parts.push(`${c.postCount} post`);
  if (c.workCount > 0) parts.push(`${c.workCount} work`);
  return parts.length > 0 ? parts.join(' · ') : null;
}
