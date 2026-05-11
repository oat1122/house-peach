'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  deletePairAction,
  updatePairLabelAction,
} from '@/lib/actions/media';

export type MediaPairCardData = {
  id: number;
  label: string;
  before: { path: string; alt: string };
  after: { path: string; alt: string };
};

export function MediaPairCard({ pair }: { pair: MediaPairCardData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(pair.label);

  const handleSave = () => {
    startTransition(async () => {
      await updatePairLabelAction({ id: pair.id, label });
      setEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm('ลบ pair นี้? (รูปทั้ง 2 ใบยังอยู่ใน library)')) return;
    startTransition(async () => {
      await deletePairAction({ id: pair.id });
      router.refresh();
    });
  };

  return (
    <li className="overflow-hidden rounded-xl border border-line bg-brand-card">
      <div className="grid grid-cols-2 gap-px bg-line">
        <PairThumb side="before" path={pair.before.path} alt={pair.before.alt} />
        <PairThumb side="after" path={pair.after.path} alt={pair.after.alt} />
      </div>
      <div className="space-y-2 p-3">
        {editing ? (
          <div className="space-y-1.5">
            <Input
              value={label}
              maxLength={180}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ป้ายกำกับ pair (เช่น: ห้องครัว — ก่อน/หลัง)"
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
                  setLabel(pair.label);
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
            className="block w-full text-left text-sm text-ink"
          >
            {pair.label || <em className="text-muted-brand">— ตั้งป้าย —</em>}
          </button>
        )}
        <Button
          size="xs"
          variant="destructive"
          onClick={handleDelete}
          disabled={pending}
          className="w-full"
        >
          ลบ pair
        </Button>
      </div>
    </li>
  );
}

function PairThumb({
  side,
  path,
  alt,
}: {
  side: 'before' | 'after';
  path: string;
  alt: string;
}) {
  return (
    <div className="relative aspect-[4/3] bg-bg2">
      <Image src={path} alt={alt} fill sizes="33vw" className="object-cover" unoptimized />
      <span className="absolute left-1.5 top-1.5 rounded bg-ink/85 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-bg">
        {side}
      </span>
    </div>
  );
}
