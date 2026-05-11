'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Crop } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPairAction } from '@/lib/actions/media';
import {
  CROP_PRESETS,
  CROPPABLE_IMAGE_MIME,
  type CropPresetId,
} from '@/lib/imageCrop/config';
import { reportUploadOutcome, toast } from '@/lib/toast';

import { ImageCropDialog } from './ImageCropDialog';

const ACCEPTED_INPUT_MIME = CROPPABLE_IMAGE_MIME.join(',');
/** Initial preset when admin opens the crop dialog; can be switched there. */
const DEFAULT_PRESET: CropPresetId = 'post';

type RowStatus =
  | 'pending'
  | 'cropped'
  | 'uploading'
  | 'done'
  | 'error'
  | 'rejected';

type Row = {
  key: string;
  file: File;
  /** Result of crop dialog — non-null means we upload this instead of `file`. */
  croppedFile: File | null;
  /** Blob URL for the cropped thumbnail. */
  croppedPreviewUrl: string | null;
  /** Blob URL for the original file (always set when status !== 'rejected'). */
  sourcePreviewUrl: string | null;
  preset: CropPresetId;
  title: string;
  alt: string;
  status: RowStatus;
  assetId?: number;
  error?: string;
};

export function MediaUploadDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [pairMode, setPairMode] = useState(false);
  const [pairLabel, setPairLabel] = useState('');
  const [submitting, startTransition] = useTransition();
  const [cropTargetKey, setCropTargetKey] = useState<string | null>(null);

  // Revoke all outstanding blob URLs on unmount.
  useEffect(() => {
    return () => {
      setRows((prev) => {
        for (const r of prev) {
          if (r.croppedPreviewUrl) URL.revokeObjectURL(r.croppedPreviewUrl);
          if (r.sourcePreviewUrl) URL.revokeObjectURL(r.sourcePreviewUrl);
        }
        return prev;
      });
    };
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const additions: Row[] = [];
    for (const file of Array.from(files)) {
      const acceptable = (CROPPABLE_IMAGE_MIME as readonly string[]).includes(
        file.type,
      );
      additions.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        croppedFile: null,
        croppedPreviewUrl: null,
        sourcePreviewUrl: acceptable ? URL.createObjectURL(file) : null,
        preset: DEFAULT_PRESET,
        title: file.name.replace(/\.[^.]+$/, '').slice(0, 180),
        alt: '',
        status: acceptable ? 'pending' : 'rejected',
        error: acceptable
          ? undefined
          : `ไม่รองรับ ${file.type || 'ชนิดไฟล์นี้'} — ใช้ jpeg / png / webp เท่านั้น`,
      });
    }
    setRows((prev) => [...prev, ...additions]);
  };

  const removeRow = (key: string) => {
    setRows((prev) => {
      const target = prev.find((r) => r.key === key);
      if (target?.croppedPreviewUrl) URL.revokeObjectURL(target.croppedPreviewUrl);
      if (target?.sourcePreviewUrl) URL.revokeObjectURL(target.sourcePreviewUrl);
      return prev.filter((r) => r.key !== key);
    });
  };

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const resetCrop = (key: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        if (r.croppedPreviewUrl) URL.revokeObjectURL(r.croppedPreviewUrl);
        return {
          ...r,
          croppedFile: null,
          croppedPreviewUrl: null,
          status: r.status === 'cropped' ? 'pending' : r.status,
        };
      }),
    );
  };

  const activeRows = rows.filter((r) => r.status !== 'rejected');
  const pairAllowed = pairMode && activeRows.length === 2;
  const submitDisabled =
    submitting ||
    activeRows.length === 0 ||
    activeRows.every((r) => r.status === 'done') ||
    (pairMode && activeRows.length !== 2);

  const upload = (row: Row): Promise<number | null> => {
    const fileToSend = row.croppedFile ?? row.file;
    const fd = new FormData();
    fd.append('file', fileToSend);
    fd.append('title', row.title);
    fd.append('alt', row.alt);
    return fetch('/api/upload', { method: 'POST', body: fd })
      .then(async (res) => {
        const data = (await res.json()) as
          | { ok: true; asset: { id: number } }
          | { ok: false; error: string };
        if (!res.ok || !data.ok) {
          updateRow(row.key, {
            status: 'error',
            error: 'error' in data ? data.error : 'อัปโหลดล้มเหลว',
          });
          return null;
        }
        updateRow(row.key, { status: 'done', assetId: data.asset.id });
        return data.asset.id;
      })
      .catch((err) => {
        updateRow(row.key, { status: 'error', error: (err as Error).message });
        return null;
      });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const queue = activeRows.filter(
        (r) => r.status !== 'done' && r.status !== 'uploading',
      );
      const ids: number[] = [];
      let failCount = 0;
      for (const row of queue) {
        updateRow(row.key, { status: 'uploading', error: undefined });
        const id = await upload(row);
        if (id) ids.push(id);
        else failCount += 1;
      }
      const doneIds = activeRows
        .map((r) => (r.status === 'done' ? r.assetId : undefined))
        .filter((v): v is number => typeof v === 'number');
      const allIds = [...doneIds, ...ids];
      const okCount = ids.length;

      let pairOk = true;
      if (pairMode) {
        if (allIds.length !== 2) {
          toast.error('ต้องอัปโหลดสำเร็จครบ 2 ไฟล์ก่อนถึงจะสร้าง pair ได้');
          pairOk = false;
        } else {
          try {
            await createPairAction({
              beforeAssetId: allIds[0],
              afterAssetId: allIds[1],
              label: pairLabel,
            });
            toast.success('จับคู่ before/after แล้ว');
          } catch (err) {
            toast.error((err as Error).message || 'สร้าง pair ไม่สำเร็จ');
            pairOk = false;
          }
        }
      }

      router.refresh();

      if (okCount > 0 || failCount > 0) reportUploadOutcome({ ok: okCount, fail: failCount });
      if (failCount === 0 && okCount > 0 && pairOk) onClose();
    });
  };

  const cropTarget = cropTargetKey
    ? rows.find((r) => r.key === cropTargetKey) ?? null
    : null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="อัปโหลดรูป"
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-8"
      >
        <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-brand-card shadow-xl">
          <header className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-base font-medium text-ink">อัปโหลดรูปเข้า library</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-muted-brand hover:text-ink"
              aria-label="ปิด"
            >
              ✕
            </button>
          </header>

          <div className="space-y-4 overflow-y-auto p-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-bg/40 px-6 py-10 text-center text-sm text-muted-brand hover:border-brand-accent hover:text-ink"
            >
              <span className="text-base">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</span>
              <span className="text-xs">jpg / png / webp — สูงสุดไฟล์ละ 5MB</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_INPUT_MIME}
              onChange={(e) => addFiles(e.target.files)}
              className="hidden"
            />

            <div className="space-y-2 rounded-lg border border-line bg-bg/40 p-3">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={pairMode}
                  onChange={(e) => setPairMode(e.target.checked)}
                  className="h-4 w-4"
                />
                จับคู่ before/after (ต้องอัปโหลด 2 ไฟล์: ไฟล์แรก = before, ไฟล์สอง = after)
              </label>
              {pairMode && (
                <div className="space-y-1.5">
                  <Label htmlFor="pair-label" className="text-xs">
                    ป้าย pair (ไม่จำเป็น)
                  </Label>
                  <Input
                    id="pair-label"
                    value={pairLabel}
                    maxLength={180}
                    onChange={(e) => setPairLabel(e.target.value)}
                    placeholder="เช่น: ห้องครัว — ก่อน/หลังแต่ง"
                  />
                  {!pairAllowed && activeRows.length > 0 && (
                    <p className="text-xs text-destructive">
                      pair mode ต้องการ 2 ไฟล์พอดี (ตอนนี้มี {activeRows.length})
                    </p>
                  )}
                </div>
              )}
            </div>

            {rows.length > 0 && (
              <ul className="space-y-2">
                {rows.map((row, index) => (
                  <RowItem
                    key={row.key}
                    row={row}
                    index={index}
                    pairMode={pairMode}
                    onChangeTitle={(v) => updateRow(row.key, { title: v })}
                    onChangeAlt={(v) => updateRow(row.key, { alt: v })}
                    onOpenCrop={() => setCropTargetKey(row.key)}
                    onResetCrop={() => resetCrop(row.key)}
                    onRemove={() => removeRow(row.key)}
                  />
                ))}
              </ul>
            )}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-line bg-bg/30 px-5 py-3">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              ปิด
            </Button>
            <Button onClick={handleSubmit} disabled={submitDisabled}>
              {submitting ? 'กำลังอัปโหลด…' : pairMode ? 'อัปโหลด + จับคู่' : 'อัปโหลด'}
            </Button>
          </footer>
        </div>
      </div>

      {cropTarget && (
        <ImageCropDialog
          open
          file={cropTarget.file}
          preset={cropTarget.preset}
          onCancel={() => setCropTargetKey(null)}
          onConfirm={(croppedFile, usedPreset) => {
            if (cropTarget.croppedPreviewUrl) {
              URL.revokeObjectURL(cropTarget.croppedPreviewUrl);
            }
            const url = URL.createObjectURL(croppedFile);
            updateRow(cropTarget.key, {
              croppedFile,
              croppedPreviewUrl: url,
              preset: usedPreset,
              status: 'cropped',
              error: undefined,
            });
            setCropTargetKey(null);
          }}
        />
      )}
    </>
  );
}

function RowItem({
  row,
  index,
  pairMode,
  onChangeTitle,
  onChangeAlt,
  onOpenCrop,
  onResetCrop,
  onRemove,
}: {
  row: Row;
  index: number;
  pairMode: boolean;
  onChangeTitle: (v: string) => void;
  onChangeAlt: (v: string) => void;
  onOpenCrop: () => void;
  onResetCrop: () => void;
  onRemove: () => void;
}) {
  const isRejected = row.status === 'rejected';
  const isUploading = row.status === 'uploading';
  const isDone = row.status === 'done';
  const isCropped = row.status === 'cropped';
  const cropDisabled = isUploading || isDone || isRejected;

  // Cropped thumbnail (if any) takes precedence over source for the trigger.
  const previewUrl = row.croppedPreviewUrl ?? row.sourcePreviewUrl;

  return (
    <li
      className={
        'rounded-lg border border-line bg-bg/30 p-3 ' +
        (isRejected ? 'opacity-70' : '')
      }
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/85 text-[11px] text-bg">
          {pairMode ? (index === 0 ? 'B' : 'A') : index + 1}
        </span>

        {previewUrl ? (
          <button
            type="button"
            onClick={cropDisabled ? undefined : onOpenCrop}
            disabled={cropDisabled}
            aria-label={isCropped ? 'ครอปอีกครั้ง' : 'ครอปรูป'}
            className={
              'group/thumb relative h-20 w-28 shrink-0 overflow-hidden rounded-md ring-1 ring-line ' +
              (cropDisabled
                ? 'cursor-default'
                : 'cursor-pointer transition hover:ring-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent')
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
            {isCropped && (
              <span className="absolute left-1 top-1 rounded bg-ink/85 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-bg">
                cropped
              </span>
            )}
            {!cropDisabled && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/0 text-bg opacity-0 transition group-hover/thumb:bg-ink/45 group-hover/thumb:opacity-100 group-focus-visible/thumb:bg-ink/45 group-focus-visible/thumb:opacity-100">
                <Crop className="size-4" aria-hidden />
                <span className="ml-1 text-[11px] font-medium">
                  {isCropped ? 'ครอปใหม่' : 'ครอป'}
                </span>
              </span>
            )}
          </button>
        ) : (
          <div className="grid h-20 w-28 shrink-0 place-items-center rounded-md bg-bg2/60 text-[10px] text-muted-brand">
            ไฟล์ไม่รองรับ
          </div>
        )}

        <div className="grow space-y-1.5">
          <p className="truncate text-sm text-ink">{row.file.name}</p>

          {!isRejected && (
            <>
              <Input
                value={row.title}
                maxLength={180}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder="ชื่อรูป"
                className="h-7 text-xs"
                disabled={isUploading || isDone}
              />
              <Input
                value={row.alt}
                maxLength={255}
                onChange={(e) => onChangeAlt(e.target.value)}
                placeholder="alt (สำหรับ SEO + screen reader)"
                className="h-7 text-xs"
                disabled={isUploading || isDone}
              />

              {(isCropped || row.preset) && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-brand">
                  {isCropped ? (
                    <>
                      <span>
                        ครอป {CROP_PRESETS[row.preset].ratioLabel} ·{' '}
                        {CROP_PRESETS[row.preset].label}
                      </span>
                      <button
                        type="button"
                        onClick={onResetCrop}
                        disabled={isUploading || isDone}
                        className="underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
                      >
                        ยกเลิกครอป
                      </button>
                    </>
                  ) : (
                    <span>คลิกรูปด้านซ้ายเพื่อครอป · ไม่ครอป = อัปโหลดรูปเดิม</span>
                  )}
                </div>
              )}
            </>
          )}

          <p className="text-[11px]">
            <StatusBadge status={row.status} error={row.error} />
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={isUploading}
          className="text-xs text-muted-brand hover:text-destructive"
          aria-label="ลบจากรายการ"
        >
          ลบ
        </button>
      </div>
    </li>
  );
}

function StatusBadge({
  status,
  error,
}: {
  status: RowStatus;
  error?: string;
}) {
  if (status === 'done') return <span className="text-brand-accent">✓ เสร็จ</span>;
  if (status === 'uploading')
    return <span className="text-muted-brand">⟳ กำลังอัปโหลด…</span>;
  if (status === 'error')
    return <span className="text-destructive">✗ {error ?? 'อัปโหลดล้มเหลว'}</span>;
  if (status === 'rejected')
    return <span className="text-destructive">✗ {error ?? 'ไฟล์ไม่รองรับ'}</span>;
  if (status === 'cropped')
    return <span className="text-brand-accent">✓ ครอปแล้ว · พร้อมอัปโหลด</span>;
  return <span className="text-muted-brand">รอ</span>;
}
