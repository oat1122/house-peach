'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPairAction } from '@/lib/actions/media';

type Row = {
  key: string;
  file: File;
  title: string;
  alt: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
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
  const [globalError, setGlobalError] = useState<string | null>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const additions: Row[] = [];
    for (const file of Array.from(files)) {
      additions.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        title: file.name.replace(/\.[^.]+$/, '').slice(0, 180),
        alt: '',
        status: 'pending',
      });
    }
    setRows((prev) => [...prev, ...additions]);
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const pairAllowed = pairMode && rows.length === 2;
  const submitDisabled =
    submitting ||
    rows.length === 0 ||
    rows.every((r) => r.status === 'done') ||
    (pairMode && rows.length !== 2);

  const upload = (row: Row): Promise<number | null> => {
    const fd = new FormData();
    fd.append('file', row.file);
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
    setGlobalError(null);
    startTransition(async () => {
      const queue = rows.filter((r) => r.status !== 'done');
      const ids: number[] = [];
      for (const row of queue) {
        updateRow(row.key, { status: 'uploading', error: undefined });
        const id = await upload(row);
        if (id) ids.push(id);
      }
      // Collect all done ids (including ones uploaded earlier in a previous click).
      const doneIds = rows
        .map((r) => (r.status === 'done' ? r.assetId : undefined))
        .filter((v): v is number => typeof v === 'number');
      const allIds = [...doneIds, ...ids];

      if (pairMode) {
        if (allIds.length !== 2) {
          setGlobalError('ต้องอัปโหลดสำเร็จครบ 2 ไฟล์ก่อนถึงจะสร้าง pair ได้');
        } else {
          const pairResult = await createPairAction({
            beforeAssetId: allIds[0],
            afterAssetId: allIds[1],
            label: pairLabel,
          });
          if (!pairResult.ok) {
            setGlobalError('สร้าง pair ไม่สำเร็จ');
          }
        }
      }

      router.refresh();
    });
  };

  return (
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
            accept="image/jpeg,image/png,image/webp"
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
                {!pairAllowed && rows.length > 0 && (
                  <p className="text-xs text-destructive">
                    pair mode ต้องการ 2 ไฟล์พอดี (ตอนนี้มี {rows.length})
                  </p>
                )}
              </div>
            )}
          </div>

          {rows.length > 0 && (
            <ul className="space-y-2">
              {rows.map((row, index) => (
                <li
                  key={row.key}
                  className="rounded-lg border border-line bg-bg/30 p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-ink/85 text-[11px] text-bg">
                      {pairMode ? (index === 0 ? 'B' : 'A') : index + 1}
                    </span>
                    <div className="grow space-y-1.5">
                      <p className="truncate text-sm text-ink">{row.file.name}</p>
                      <Input
                        value={row.title}
                        maxLength={180}
                        onChange={(e) =>
                          updateRow(row.key, { title: e.target.value })
                        }
                        placeholder="ชื่อรูป"
                        className="h-7 text-xs"
                      />
                      <Input
                        value={row.alt}
                        maxLength={255}
                        onChange={(e) => updateRow(row.key, { alt: e.target.value })}
                        placeholder="alt (สำหรับ SEO + screen reader)"
                        className="h-7 text-xs"
                      />
                      <p className="text-[11px]">
                        <StatusBadge status={row.status} error={row.error} />
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      disabled={row.status === 'uploading'}
                      className="text-xs text-muted-brand hover:text-destructive"
                      aria-label="ลบจากรายการ"
                    >
                      ลบ
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {globalError && (
            <p
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {globalError}
            </p>
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
  );
}

function StatusBadge({
  status,
  error,
}: {
  status: Row['status'];
  error?: string;
}) {
  if (status === 'done') return <span className="text-brand-accent">✓ เสร็จ</span>;
  if (status === 'uploading') return <span className="text-muted-brand">⟳ กำลังอัปโหลด…</span>;
  if (status === 'error')
    return (
      <span className="text-destructive">✗ {error ?? 'อัปโหลดล้มเหลว'}</span>
    );
  return <span className="text-muted-brand">รอ</span>;
}
