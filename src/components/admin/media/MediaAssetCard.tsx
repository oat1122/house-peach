'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useConfirm } from '@/components/common/ConfirmProvider';
import {
  deleteAssetAction,
  updateAssetMetaAction,
} from '@/lib/actions/media';
import { toast } from '@/lib/toast';

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
  priority = false,
}: {
  asset: MediaAssetCardData;
  selected: boolean;
  onToggleSelect: () => void;
  priority?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
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
      toast.success('บันทึกแล้ว', { duration: 1500 });
      setEditing(false);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    const description = inPair
      ? `รูปนี้อยู่ใน pair · ลบจะลบ pair ด้วย${
          usageCount > 0 ? ` และใช้อยู่ใน ${usageCount} ที่` : ''
        }`
      : usageCount > 0
        ? `รูปนี้ใช้อยู่ใน ${usageCount} ที่ (${asset.postCount} posts, ${asset.workCount} works)`
        : undefined;
    // `confirm()` is awaited OUTSIDE the transition so the trigger button
    // doesn't stay disabled while the modal is open (the modal can take any
    // amount of time). Only the actual delete call runs inside the transition.
    const ok = await confirm({
      title: 'ลบรูปนี้?',
      description,
      confirmLabel: 'ลบ',
      cancelLabel: 'ยกเลิก',
      tone: 'destructive',
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteAssetAction({ id: asset.id });
        toast.success('ลบรูปแล้ว');
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message || 'ลบไม่สำเร็จ');
      }
    });
  };

  return (
    <li
      className={[
        'group relative overflow-hidden rounded-xl border bg-brand-card transition',
        selected
          ? 'border-brand-accent ring-2 ring-brand-accent/40'
          : 'border-line hover:border-brand-accent/40',
      ].join(' ')}
    >
      {/* Select toggle (pair-select mode checkbox) */}
      <button
        type="button"
        onClick={onToggleSelect}
        aria-pressed={selected}
        aria-label={selected ? 'ยกเลิกเลือกรูป' : 'เลือกรูป'}
        className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-bg/90 text-xs shadow-sm transition hover:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
      >
        {selected ? '✓' : ''}
      </button>

      {pairRole && (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] uppercase tracking-wider text-bg">
          {pairRole === 'before' ? 'ก่อน' : 'หลัง'}
        </span>
      )}

      {/* Thumbnail — links to detail page */}
      <Link href={`/admin/media/${asset.id}`} className="block">
        <div className="relative h-[140px] bg-bg2">
          <Image
            src={asset.path}
            alt={asset.alt || asset.title || 'media asset'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition group-hover:opacity-95"
            priority={priority}
            unoptimized
          />
        </div>
      </Link>

      {/* Info & actions */}
      <div className="space-y-2 p-3">
        {editing ? (
          <div className="space-y-1.5">
            <Input
              value={title}
              maxLength={180}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ชื่อรูป"
              className="h-7 rounded-lg text-xs"
            />
            <Input
              value={alt}
              maxLength={255}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="alt text (สำหรับ SEO + screen reader)"
              className="h-7 rounded-lg text-xs"
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
          <div className="space-y-0.5">
            <p className="truncate text-sm font-medium text-ink">
              {asset.title || <em className="font-normal text-muted-brand">(ตั้งชื่อรูป)</em>}
            </p>
            <p className="text-[10.5px] text-muted-brand">
              {asset.width}×{asset.height} px
            </p>
            <p
              className="truncate text-[10.5px] text-muted-brand"
              title={asset.alt}
            >
              {asset.alt || '— ยังไม่มี alt —'}
            </p>
          </div>
        )}

        {!editing && (
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-muted-brand">
              ใช้ใน {asset.postCount} posts · {asset.workCount} works
            </span>
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="แก้ไขชื่อและ alt"
                className="grid h-7 w-7 place-items-center rounded-md text-muted-brand transition hover:bg-bg2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                <Pencil size={13} aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                aria-label="ลบรูป"
                aria-busy={pending}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-brand transition hover:bg-danger/10 hover:text-danger disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50"
              >
                {pending ? <Spinner className="size-3" /> : <Trash2 size={13} aria-hidden />}
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
