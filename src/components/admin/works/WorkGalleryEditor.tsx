'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { GripVertical, Sparkles, Star, Trash2 } from 'lucide-react';
import { Reorder, useDragControls } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useConfirm } from '@/components/common/ConfirmProvider';
import {
  MediaPicker,
  type PickResult,
  type PickerAsset,
  type PickerPair,
} from '@/components/admin/media/MediaPicker';
import {
  attachAssetsAction,
  attachPairAction,
  removeWorkImageAction,
  reorderWorkImagesAction,
  setWorkCoverAction,
  setWorkImageFeaturedAction,
  updateWorkImageCaptionAction,
  updateWorkImageKindAction,
} from '@/lib/actions/workImage';
import { toast } from '@/lib/toast';
import { workImageKinds, type WorkImageKind } from '@/lib/validation/work';

const KIND_LABELS: Record<WorkImageKind, string> = {
  after: 'หลังแต่ง',
  before: 'ก่อนแต่ง',
  process: 'ระหว่างทำ',
  detail: 'รายละเอียด',
  plan: 'แปลน',
};

export type GalleryRow = {
  mediaAssetId: number;
  kind: WorkImageKind;
  pairId: number | null;
  caption: string | null;
  sort: number;
  isCover: boolean;
  isFeatured: boolean;
  asset: { path: string; alt: string; title: string; width: number; height: number };
};

export function WorkGalleryEditor({
  workId,
  initialRows,
  libraryAssets,
  libraryPairs,
}: {
  workId: number;
  initialRows: GalleryRow[];
  libraryAssets: PickerAsset[];
  libraryPairs: PickerPair[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  // Local mirror of `initialRows` — we keep it as state so optimistic reorder
  // can flip UI before the server commit. The compare-and-set below re-syncs
  // whenever the server-fetched prop changes (router.refresh() after mutate)
  // so the editor doesn't stale-render until F5.
  const [rows, setRows] = useState(initialRows);
  const [lastInitialRows, setLastInitialRows] = useState(initialRows);
  if (lastInitialRows !== initialRows) {
    setLastInitialRows(initialRows);
    setRows(initialRows);
  }
  const [picker, setPicker] = useState<null | 'assets' | 'pairs'>(null);
  const [busy, startTransition] = useTransition();

  const attachedAssetIds = rows.map((r) => r.mediaAssetId);

  // Pairs whose either side is already linked → grey them out in the picker.
  const usedPairIds = new Set<number>();
  for (const p of libraryPairs) {
    if (
      attachedAssetIds.includes(p.before.id) ||
      attachedAssetIds.includes(p.after.id)
    ) {
      usedPairIds.add(p.id);
    }
  }

  const handlePick = (result: PickResult) => {
    if (result.kind === 'assets') {
      startTransition(async () => {
        const r = await attachAssetsAction({
          workId,
          mediaAssetIds: result.ids,
          defaultKind: 'after',
        });
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success(`เพิ่ม ${result.ids.length} รูปแล้ว`);
        setPicker(null);
        router.refresh();
      });
    } else {
      startTransition(async () => {
        const r = await attachPairAction({ workId, pairId: result.pairId });
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success('เพิ่ม pair before/after แล้ว');
        setPicker(null);
        router.refresh();
      });
    }
  };

  // Optimistically reorder, then commit. Roll back if server rejects.
  const handleReorder = (newRows: GalleryRow[]) => {
    setRows(newRows);
    const prev = rows;
    startTransition(async () => {
      const r = await reorderWorkImagesAction({
        workId,
        mediaAssetIds: newRows.map((row) => row.mediaAssetId),
      });
      if (!r.ok) {
        setRows(prev);
        toast.error(r.error);
        return;
      }
      router.refresh();
    });
  };

  const moveItem = (idx: number, delta: number) => {
    const next = idx + delta;
    if (next < 0 || next >= rows.length) return;
    const updated = [...rows];
    [updated[idx], updated[next]] = [updated[next], updated[idx]];
    handleReorder(updated);
  };

  const handleKindChange = (mediaAssetId: number, kind: WorkImageKind) => {
    setRows((prev) =>
      prev.map((r) => (r.mediaAssetId === mediaAssetId ? { ...r, kind } : r)),
    );
    startTransition(async () => {
      const r = await updateWorkImageKindAction({
        workId,
        mediaAssetId,
        kind,
      });
      if (!r.ok) toast.error(r.error);
    });
  };

  const handleCaptionSave = (mediaAssetId: number, caption: string) => {
    startTransition(async () => {
      const r = await updateWorkImageCaptionAction({
        workId,
        mediaAssetId,
        caption: caption.trim() || null,
      });
      if (!r.ok) toast.error(r.error);
      else toast.success('บันทึก caption', { duration: 1200 });
    });
  };

  const handleToggleCover = (mediaAssetId: number, isCover: boolean) => {
    // Optimistic: flip the star immediately so the admin sees feedback before
    // the server round-trip + router.refresh() lands. Roll back on failure.
    const prev = rows;
    setRows((cur) =>
      cur.map((r) => ({
        ...r,
        isCover: isCover ? false : r.mediaAssetId === mediaAssetId,
      })),
    );
    startTransition(async () => {
      const r = await setWorkCoverAction({
        workId,
        mediaAssetId: isCover ? null : mediaAssetId,
      });
      if (!r.ok) {
        setRows(prev);
        toast.error(r.error);
        return;
      }
      toast.success(isCover ? 'ยกเลิกการเป็นปก' : 'ตั้งเป็นปกแล้ว');
      router.refresh();
    });
  };

  const handleToggleFeatured = (mediaAssetId: number, isFeatured: boolean) => {
    const next = !isFeatured;
    // Optimistic flip — masonry tile size depends on this flag so the admin
    // wants instant visual feedback.
    const prev = rows;
    setRows((cur) =>
      cur.map((r) =>
        r.mediaAssetId === mediaAssetId ? { ...r, isFeatured: next } : r,
      ),
    );
    startTransition(async () => {
      const r = await setWorkImageFeaturedAction({
        workId,
        mediaAssetId,
        isFeatured: next,
      });
      if (!r.ok) {
        setRows(prev);
        toast.error(r.error);
        return;
      }
      toast.success(next ? 'ตั้งเป็นภาพเด่นแล้ว' : 'ยกเลิกภาพเด่น');
      router.refresh();
    });
  };

  const handleRemove = async (mediaAssetId: number) => {
    const ok = await confirm({
      title: 'ลบรูปนี้ออกจาก work?',
      description:
        'รูปยังคงอยู่ใน media library — เพียงลบความสัมพันธ์กับ work นี้',
      confirmLabel: 'ลบ',
      tone: 'destructive',
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await removeWorkImageAction({ workId, mediaAssetId });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success('ลบรูปจาก work แล้ว');
      router.refresh();
    });
  };

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Gallery ({rows.length})
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ลากด้วยมือจับ ⋮⋮ เพื่อจัดลำดับ · หรือใช้ ↑/↓ บนคีย์บอร์ดที่ปุ่มจับ
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPicker('assets')}
            disabled={busy}
          >
            + เพิ่มรูป
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPicker('pairs')}
            disabled={busy}
          >
            + เพิ่ม pair
          </Button>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-12 text-center text-sm text-muted-foreground">
          ยังไม่มีรูปใน gallery — กด &ldquo;+ เพิ่มรูป&rdquo; เพื่อเริ่ม
        </p>
      ) : (
        <Reorder.Group
          axis="y"
          values={rows}
          onReorder={handleReorder}
          className="space-y-2"
          aria-label="รายการรูปใน gallery — ลากเพื่อจัดลำดับ"
        >
          {rows.map((row, idx) => (
            <GalleryRowItem
              key={row.mediaAssetId}
              row={row}
              index={idx}
              total={rows.length}
              busy={busy}
              onMoveUp={() => moveItem(idx, -1)}
              onMoveDown={() => moveItem(idx, +1)}
              onKindChange={(k) => handleKindChange(row.mediaAssetId, k)}
              onCaptionSave={(c) => handleCaptionSave(row.mediaAssetId, c)}
              onToggleCover={() => handleToggleCover(row.mediaAssetId, row.isCover)}
              onToggleFeatured={() =>
                handleToggleFeatured(row.mediaAssetId, row.isFeatured)
              }
              onRemove={() => handleRemove(row.mediaAssetId)}
            />
          ))}
        </Reorder.Group>
      )}

      {picker && (
        <MediaPicker
          open
          mode={picker}
          onClose={() => setPicker(null)}
          onPick={handlePick}
          assets={libraryAssets}
          pairs={libraryPairs}
          excludeAssetIds={attachedAssetIds}
          excludePairIds={Array.from(usedPairIds)}
          selection={picker === 'pairs' ? 'single' : 'multiple'}
        />
      )}
    </section>
  );
}

function GalleryRowItem({
  row,
  index,
  total,
  busy,
  onMoveUp,
  onMoveDown,
  onKindChange,
  onCaptionSave,
  onToggleCover,
  onToggleFeatured,
  onRemove,
}: {
  row: GalleryRow;
  index: number;
  total: number;
  busy: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onKindChange: (kind: WorkImageKind) => void;
  onCaptionSave: (caption: string) => void;
  onToggleCover: () => void;
  onToggleFeatured: () => void;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();
  const [captionDraft, setCaptionDraft] = useState(row.caption ?? '');

  const handleHandleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onMoveUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onMoveDown();
    }
  };

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-stretch gap-3 rounded-lg border border-border bg-background p-3"
    >
      <button
        type="button"
        aria-label={`ลากเพื่อจัดลำดับ — ตอนนี้อันดับที่ ${index + 1} จาก ${total}`}
        aria-keyshortcuts="ArrowUp ArrowDown"
        onPointerDown={(e) => dragControls.start(e)}
        onKeyDown={handleHandleKeyDown}
        disabled={busy}
        className="flex shrink-0 cursor-grab touch-none items-center text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
      >
        <GripVertical aria-hidden className="size-4" />
      </button>

      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={row.asset.path}
          alt={row.asset.alt || row.asset.title}
          fill
          sizes="112px"
          className="object-cover"
          unoptimized
        />
        {row.pairId != null && (
          <span className="absolute left-1 top-1 rounded bg-foreground/85 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-background">
            pair
          </span>
        )}
        {row.isCover && (
          <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-foreground text-background">
            <Star className="size-3" aria-hidden />
          </span>
        )}
        {row.isFeatured && !row.isCover && (
          <span
            className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-accent text-accent-foreground"
            title="ภาพเด่น — masonry tile 2×2"
          >
            <Sparkles className="size-3" aria-hidden />
          </span>
        )}
      </div>

      <div className="grow space-y-1.5">
        <p className="truncate text-xs text-foreground">
          {row.asset.title || row.asset.alt || `asset #${row.mediaAssetId}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            id={`kind-label-${row.mediaAssetId}`}
            className="text-[11px] text-muted-foreground"
          >
            ประเภท
          </span>
          <Select
            value={row.kind}
            onValueChange={(v) => onKindChange(v as WorkImageKind)}
            disabled={busy}
          >
            <SelectTrigger
              size="sm"
              aria-label="ประเภทรูป"
              aria-labelledby={`kind-label-${row.mediaAssetId}`}
              className="h-7 w-auto min-w-28 px-2 text-xs"
            >
              <SelectValue placeholder="เลือกประเภท">
                {(v) =>
                  v && v in KIND_LABELS
                    ? KIND_LABELS[v as WorkImageKind]
                    : 'เลือกประเภท'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {workImageKinds.map((k) => (
                <SelectItem key={k} value={k}>
                  {KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {row.pairId != null && (
            <span className="text-[10px] text-muted-foreground">
              · pair #{row.pairId}
            </span>
          )}
        </div>
        <Input
          value={captionDraft}
          onChange={(e) => setCaptionDraft(e.target.value)}
          onBlur={() => {
            if ((captionDraft || '') !== (row.caption ?? '')) {
              onCaptionSave(captionDraft);
            }
          }}
          placeholder="caption (ไม่จำเป็น)"
          maxLength={280}
          className="h-7 text-xs"
          disabled={busy}
        />
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Button
          type="button"
          size="xs"
          variant={row.isCover ? 'secondary' : 'outline'}
          onClick={onToggleCover}
          disabled={busy}
          aria-pressed={row.isCover}
          title={row.isCover ? 'ยกเลิกการเป็นปก' : 'ตั้งเป็นปก'}
        >
          {busy ? <Spinner className="size-3" /> : <Star className="size-3" aria-hidden />}
          <span>{row.isCover ? 'ปก' : 'ตั้งปก'}</span>
        </Button>
        {/* isFeatured applies only to process/detail kinds.
            'plan' images render as a single floor-plan thumb in chapter 03
            (first by sort order) — featured toggle is not applicable.
            'before'/'after' images are shown by kind grouping, not by
            featured flag, so they also do not need this control. */}
        {(row.kind === 'process' || row.kind === 'detail') && (
          <Button
            type="button"
            size="xs"
            variant={row.isFeatured ? 'secondary' : 'outline'}
            onClick={onToggleFeatured}
            disabled={busy}
            aria-pressed={row.isFeatured}
            title={
              row.isFeatured
                ? 'ยกเลิกภาพเด่น'
                : 'ตั้งเป็นภาพเด่น (masonry 2×2)'
            }
          >
            <Sparkles className="size-3" aria-hidden />
            <span>{row.isFeatured ? 'เด่น' : 'ตั้งเด่น'}</span>
          </Button>
        )}
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={onRemove}
          disabled={busy}
          aria-label="ลบรูปนี้ออกจาก work"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3" aria-hidden />
        </Button>
      </div>
    </Reorder.Item>
  );
}
