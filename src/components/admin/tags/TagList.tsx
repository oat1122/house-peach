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
import { deleteTagAction } from '@/lib/actions/tag';
import { toast } from '@/lib/toast';
import type { AdminTagItem } from '@/lib/services/tag';
import type { TagKind } from '@/lib/db/schema/tags';

import { TagFormDialog } from './TagFormDialog';

type Props = {
  tags: AdminTagItem[];
};

const KIND_VARIANT: Record<TagKind, 'default' | 'secondary' | 'outline'> = {
  post: 'secondary',
  work: 'secondary',
  both: 'default',
};

const KIND_LABEL: Record<TagKind, string> = {
  post: 'post',
  work: 'work',
  both: 'both',
};

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; tag: AdminTagItem };

/**
 * Client wrapper for the admin tag list. Owns:
 *  - the create/edit dialog state (one dialog instance, two modes)
 *  - delete confirmation (uses the shared ConfirmProvider — same a11y +
 *    keyboard handling as work/post deletes)
 *
 * The table data itself is rendered server-side via the parent RSC page;
 * we just hydrate this wrapper around it. After a mutation we call
 * `router.refresh()` to let the RSC re-fetch the list.
 */
export function TagList({ tags }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [, startDeleting] = useTransition();

  const openCreate = () => setDialog({ mode: 'create' });
  const openEdit = (tag: AdminTagItem) => setDialog({ mode: 'edit', tag });
  const closeDialog = () => setDialog({ mode: 'closed' });

  const handleDelete = async (tag: AdminTagItem) => {
    const usage = formatUsage(tag);
    const ok = await confirm({
      title: `ลบแท็ก "${tag.name}"?`,
      description: usage
        ? `${usage} — links จะถูกตัดทิ้ง (ข้อมูล post/work ที่ใช้แท็กนี้จะไม่เปลี่ยน)`
        : 'แท็กนี้ยังไม่ถูกใช้ที่ไหน — ลบได้ปลอดภัย',
      confirmLabel: 'ลบ',
      tone: 'destructive',
    });
    if (!ok) return;
    setDeletingId(tag.id);
    startDeleting(async () => {
      const result = await deleteTagAction({ id: tag.id });
      setDeletingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('ลบแท็กแล้ว');
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          สร้างแท็กใหม่
        </Button>
      </div>

      {tags.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <Card size="sm" className="overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="grid grid-cols-[1fr_140px_100px_60px_140px_44px] gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>ชื่อ</span>
              <span>slug</span>
              <span>ประเภท</span>
              <span>ลำดับ</span>
              <span>การใช้งาน</span>
              <span className="sr-only">action</span>
            </div>
            {tags.map((t) => {
              const isDeleting = deletingId === t.id;
              return (
                <div
                  key={t.id}
                  aria-busy={isDeleting}
                  className="grid grid-cols-[1fr_140px_100px_60px_140px_44px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="truncate text-left text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  >
                    {t.name}
                  </button>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {t.slug}
                  </span>
                  <Badge variant={KIND_VARIANT[t.kind]}>{KIND_LABEL[t.kind]}</Badge>
                  <span className="text-xs text-muted-foreground">{t.sort}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatUsage(t) ?? '—'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="xs"
                          aria-label={`เมนูจัดการแท็ก ${t.name}`}
                          className="size-7 p-0 justify-self-end"
                          disabled={isDeleting}
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <Pencil aria-hidden /> แก้ไข
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(t)}
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

      <TagFormDialog
        open={dialog.mode !== 'closed'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        defaults={
          dialog.mode === 'edit'
            ? {
                id: dialog.tag.id,
                slug: dialog.tag.slug,
                name: dialog.tag.name,
                kind: dialog.tag.kind,
                sort: dialog.tag.sort,
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
        <p className="text-sm font-medium text-foreground">ยังไม่มีแท็ก</p>
        <p className="text-sm text-muted-foreground">
          แท็กช่วยจัดหมวดบทความและผลงาน — สร้างอันแรกเพื่อเริ่มใช้
        </p>
        <Button className="mt-2" onClick={onCreate}>
          <Plus className="size-4" aria-hidden />
          สร้างแท็กแรก
        </Button>
      </CardContent>
    </Card>
  );
}

function formatUsage(t: AdminTagItem): string | null {
  const parts: string[] = [];
  if (t.postCount > 0) parts.push(`${t.postCount} post`);
  if (t.workCount > 0) parts.push(`${t.workCount} work`);
  return parts.length > 0 ? parts.join(' · ') : null;
}
