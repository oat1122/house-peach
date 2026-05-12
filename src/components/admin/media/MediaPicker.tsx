'use client';

import Image from 'next/image';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

export type PickerAsset = {
  id: number;
  title: string;
  alt: string;
  path: string;
  width: number;
  height: number;
};

export type PickerPair = {
  id: number;
  label: string;
  before: { id: number; path: string; alt: string };
  after: { id: number; path: string; alt: string };
};

export type PickResult =
  | { kind: 'assets'; ids: number[] }
  | { kind: 'pair'; pairId: number };

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (result: PickResult) => void;
  mode: 'assets' | 'pairs';
  assets: PickerAsset[];
  pairs: PickerPair[];
  /** Asset ids to grey-out (already linked to the work). */
  excludeAssetIds?: number[];
  /** Pair ids to grey-out (either side already linked). */
  excludePairIds?: number[];
  /** Asset picker selection — single hides multi-select chrome. */
  selection?: 'single' | 'multiple';
};

export function MediaPicker({
  open,
  onClose,
  onPick,
  mode,
  assets,
  pairs,
  excludeAssetIds = [],
  excludePairIds = [],
  selection = 'multiple',
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);

  if (!open) return null;

  const filteredAssets = filterAssets(assets, query);
  const filteredPairs = filterPairs(pairs, query);

  const excludedAssets = new Set(excludeAssetIds);
  const excludedPairs = new Set(excludePairIds);

  const toggleAsset = (id: number) => {
    setSelectedAssetIds((prev) => {
      if (selection === 'single') return prev.includes(id) ? [] : [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const handleConfirmAssets = () => {
    if (selectedAssetIds.length === 0) return;
    onPick({ kind: 'assets', ids: selectedAssetIds });
    setSelectedAssetIds([]);
    setQuery('');
  };

  const handlePickPair = (pairId: number) => {
    onPick({ kind: 'pair', pairId });
    setQuery('');
  };

  const title = mode === 'pairs' ? 'เลือก pair before/after' : 'เลือกรูปจาก library';
  const subtitle =
    mode === 'pairs'
      ? 'ใช้รูปคู่กัน — ระบบจะ insert ทั้ง before + after ใน work ให้'
      : selection === 'multiple'
        ? 'เลือกได้หลายรูป — กด "เพิ่ม" เพื่อ attach'
        : 'เลือก 1 รูป';

  // Portal to document.body so the dialog escapes any stacking context that a
  // parent might create — the sticky aside in /admin/works/[id]/edit (slotRight)
  // creates one, which was clipping the picker behind AdminTopbar + bottom bar.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4"
    >
      <div className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-card shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
          <div>
            <h2 className="text-base font-medium text-foreground">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </header>

        <div className="border-b border-border p-4">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'pairs'
                  ? 'ค้นหาจาก label / alt'
                  : 'ค้นหา title / alt'
              }
              autoFocus
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="ล้างคำค้น"
                  className="grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>

        <div className="grow overflow-y-auto p-4">
          {mode === 'assets' ? (
            <AssetsGrid
              assets={filteredAssets}
              selectedIds={selectedAssetIds}
              excludedIds={excludedAssets}
              onToggle={toggleAsset}
            />
          ) : (
            <PairsGrid
              pairs={filteredPairs}
              excludedIds={excludedPairs}
              onPick={handlePickPair}
            />
          )}
        </div>

        {mode === 'assets' && (
          <footer className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-5 py-3">
            <span className="text-xs text-muted-foreground">
              เลือกแล้ว {selectedAssetIds.length} รายการ
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleConfirmAssets}
                disabled={selectedAssetIds.length === 0}
              >
                เพิ่ม
              </Button>
            </div>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

function filterAssets(assets: PickerAsset[], q: string): PickerAsset[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return assets;
  return assets.filter(
    (a) =>
      a.title.toLowerCase().includes(needle) ||
      a.alt.toLowerCase().includes(needle),
  );
}

function filterPairs(pairs: PickerPair[], q: string): PickerPair[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return pairs;
  return pairs.filter(
    (p) =>
      p.label.toLowerCase().includes(needle) ||
      p.before.alt.toLowerCase().includes(needle) ||
      p.after.alt.toLowerCase().includes(needle),
  );
}

function AssetsGrid({
  assets,
  selectedIds,
  excludedIds,
  onToggle,
}: {
  assets: PickerAsset[];
  selectedIds: number[];
  excludedIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  if (assets.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-12 text-center text-sm text-muted-foreground">
        ไม่พบรูปที่ตรงกับคำค้น
      </p>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {assets.map((a) => {
        const isSelected = selectedIds.includes(a.id);
        const isExcluded = excludedIds.has(a.id);
        return (
          <li key={a.id}>
            <button
              type="button"
              disabled={isExcluded}
              onClick={() => onToggle(a.id)}
              aria-pressed={isSelected}
              aria-label={`${a.title || a.alt || 'รูป'}${isExcluded ? ' (ผูกแล้ว)' : ''}`}
              className={
                'group relative block w-full overflow-hidden rounded-lg border-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 ' +
                (isSelected
                  ? 'border-foreground'
                  : 'border-transparent hover:border-border')
              }
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={a.path}
                  alt={a.alt || a.title || 'asset'}
                  fill
                  sizes="(max-width: 768px) 33vw, 20vw"
                  className="object-cover"
                  unoptimized
                />
                {isSelected && (
                  <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-foreground text-xs text-background">
                    ✓
                  </span>
                )}
                {isExcluded && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-foreground/85 px-1.5 py-0.5 text-[10px] text-background">
                    ผูกแล้ว
                  </span>
                )}
              </div>
              <p className="truncate px-2 pb-1.5 pt-1 text-xs text-foreground">
                {a.title || a.alt || '—'}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PairsGrid({
  pairs,
  excludedIds,
  onPick,
}: {
  pairs: PickerPair[];
  excludedIds: Set<number>;
  onPick: (pairId: number) => void;
}) {
  if (pairs.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-12 text-center text-sm text-muted-foreground">
        ไม่พบ pair — สร้างจาก /admin/media ก่อน
      </p>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pairs.map((p) => {
        const isExcluded = excludedIds.has(p.id);
        return (
          <li key={p.id}>
            <button
              type="button"
              disabled={isExcluded}
              onClick={() => onPick(p.id)}
              aria-label={`เลือก pair ${p.label || `#${p.id}`}${isExcluded ? ' (ผูกแล้ว)' : ''}`}
              className="group block w-full overflow-hidden rounded-lg border border-border bg-card text-left transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="grid grid-cols-2 gap-px bg-border">
                <PairThumb side="before" path={p.before.path} alt={p.before.alt} />
                <PairThumb side="after" path={p.after.path} alt={p.after.alt} />
              </div>
              <p className="truncate px-3 py-2 text-xs text-foreground">
                {p.label || (
                  <em className="text-muted-foreground">— ไม่มีป้าย —</em>
                )}
                {isExcluded && (
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    (ผูกแล้ว)
                  </span>
                )}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
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
    <div className="relative aspect-[4/3] bg-muted">
      <Image src={path} alt={alt} fill sizes="25vw" className="object-cover" unoptimized />
      <span className="absolute left-1 top-1 rounded bg-foreground/85 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-background">
        {side}
      </span>
    </div>
  );
}
