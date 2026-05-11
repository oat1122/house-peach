'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  deleteAssetAction,
  updateAssetMetaAction,
} from '@/lib/actions/media';

export type MediaAssetCardData = {
  id: number;
  uuid: string;
  title: string;
  alt: string;
  path: string;
  width: number;
  height: number;
  postCount: number;
  workCount: number;
  isPairBefore: boolean;
  isPairAfter: boolean;
};

export function MediaAssetCard({
  asset,
  selected,
  onToggleSelect,
}: {
  asset: MediaAssetCardData;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(asset.title);
  const [alt, setAlt] = useState(asset.alt);

  const usageCount = asset.postCount + asset.workCount;
  const inPair = asset.isPairBefore || asset.isPairAfter;
  const pairRole = asset.isPairBefore ? 'before' : asset.isPairAfter ? 'after' : null;

  const handleSave = () => {
    startTransition(async () => {
      await updateAssetMetaAction({ id: asset.id, title, alt });
      setEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    const msg = inPair
      ? `รูปนี้อยู่ใน pair · ลบจะลบ pair ด้วย${
          usageCount > 0 ? ` และใช้อยู่ใน ${usageCount} ที่` : ''
        } — ลบจริงไหม?`
      : usageCount > 0
        ? `รูปนี้ใช้อยู่ใน ${usageCount} ที่ (${asset.postCount} posts, ${asset.workCount} works) — ลบจริงไหม?`
        : 'ลบรูปนี้?';
    if (!confirm(msg)) return;
    startTransition(async () => {
      await deleteAssetAction({ id: asset.id });
      router.refresh();
    });
  };

  return (
    <li
      className={[
        'group relative overflow-hidden rounded-xl border bg-brand-card transition',
        selected ? 'border-brand-accent ring-2 ring-brand-accent/40' : 'border-line',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onToggleSelect}
        aria-pressed={selected}
        aria-label={selected ? 'ยกเลิกเลือกรูป' : 'เลือกรูป'}
        className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-bg/90 text-xs shadow-sm"
      >
        {selected ? '✓' : ''}
      </button>

      {pairRole && (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] uppercase tracking-wider text-bg">
          {pairRole}
        </span>
      )}

      <div className="relative aspect-[4/3] bg-bg2">
        <Image
          src={asset.path}
          alt={asset.alt || asset.title || 'media asset'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="space-y-2 p-3">
        {editing ? (
          <div className="space-y-1.5">
            <Input
              value={title}
              maxLength={180}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ชื่อรูป"
              className="h-7 text-xs"
            />
            <Input
              value={alt}
              maxLength={255}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="alt text (สำหรับ SEO + screen reader)"
              className="h-7 text-xs"
            />
            <div className="flex gap-1.5">
              <Button size="xs" onClick={handleSave} disabled={pending}>
                บันทึก
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setTitle(asset.title);
                  setAlt(asset.alt);
                }}
                disabled={pending}
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="block w-full space-y-0.5 text-left"
          >
            <span className="block truncate text-sm text-ink">
              {asset.title || <em className="text-muted-brand">(ตั้งชื่อรูป)</em>}
            </span>
            <span
              className="block truncate text-[11px] text-muted-brand"
              title={asset.alt}
            >
              {asset.alt || '— ยังไม่มี alt —'}
            </span>
          </button>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-brand">
          <span>
            {asset.width}×{asset.height}
          </span>
          <span>
            ใช้ใน {asset.postCount} posts · {asset.workCount} works
          </span>
        </div>

        {!editing && (
          <Button
            size="xs"
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
            className="w-full"
          >
            ลบ
          </Button>
        )}
      </div>
    </li>
  );
}
