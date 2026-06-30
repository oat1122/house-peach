'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useConfirm } from '@/components/common/ConfirmProvider';
import {
  deletePairAction,
  updatePairLabelAction,
} from '@/lib/actions/media';
import { toast } from '@/lib/toast';

export type MediaPairCardData = {
  id: number;
  label: string;
  before: { path: string; alt: string };
  after: { path: string; alt: string };
};

export function MediaPairCard({
  pair,
  priority = false,
}: {
  pair: MediaPairCardData;
  priority?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(pair.label);

  const handleSave = () => {
    startTransition(async () => {
      await updatePairLabelAction({ id: pair.id, label });
      toast.success('บันทึกแล้ว', { duration: 1500 });
      setEditing(false);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'ลบ pair นี้?',
      description: 'รูปทั้ง 2 ใบยังคงอยู่ใน library — เฉพาะการจับคู่ที่หาย',
      confirmLabel: 'ลบ pair',
      cancelLabel: 'ยกเลิก',
      tone: 'destructive',
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deletePairAction({ id: pair.id });
        toast.success('ลบ pair แล้ว');
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message || 'ลบไม่สำเร็จ');
      }
    });
  };

  return (
    <li className="overflow-hidden rounded-xl border border-line bg-brand-card">
      {/* Before/After split with center divider handle */}
      <div className="relative flex">
        <div className="min-w-0 flex-1">
          <PairThumb side="before" path={pair.before.path} alt={pair.before.alt} priority={priority} />
        </div>
        {/* Center divider + handle */}
        <div className="absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
          <div className="w-px flex-1 bg-white/55" />
          <div className="size-5 shrink-0 rounded-full border border-line bg-white/90 shadow-sm" />
          <div className="w-px flex-1 bg-white/55" />
        </div>
        <div className="min-w-0 flex-1">
          <PairThumb side="after" path={pair.after.path} alt={pair.after.alt} priority={priority} />
        </div>
      </div>

      {/* Label + actions */}
      <div className="space-y-2 p-3">
        {editing ? (
          <div className="space-y-1.5">
            <Input
              value={label}
              maxLength={180}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ป้ายกำกับ pair (เช่น: ห้องครัว — ก่อน/หลัง)"
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
                  setLabel(pair.label);
                }}
                disabled={pending}
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex-1 truncate text-left text-sm font-medium text-ink"
            >
              {pair.label || <em className="font-normal text-muted-brand">— ตั้งป้าย —</em>}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              aria-label="ลบ pair"
              aria-busy={pending}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-brand transition hover:bg-danger/10 hover:text-danger disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50"
            >
              {pending ? <Spinner className="size-3" /> : <Trash2 size={13} aria-hidden />}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function PairThumb({
  side,
  path,
  alt,
  priority = false,
}: {
  side: 'before' | 'after';
  path: string;
  alt: string;
  priority?: boolean;
}) {
  const sideLabel = side === 'before' ? 'ก่อน' : 'หลัง';
  return (
    <div className="relative aspect-[4/3] bg-bg2">
      <Image
        src={path}
        alt={alt}
        fill
        sizes="33vw"
        className="object-cover"
        priority={priority}
        unoptimized
      />
      <span className="absolute left-1.5 top-1.5 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-bg">
        {sideLabel}
      </span>
    </div>
  );
}
