'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPairAction } from '@/lib/actions/media';
import { toast } from '@/lib/toast';

import {
  MediaAssetCard,
  type MediaAssetCardData,
} from './MediaAssetCard';
import {
  MediaPairCard,
  type MediaPairCardData,
} from './MediaPairCard';
import { MediaUploadDialog } from './MediaUploadDialog';

type Tab = 'assets' | 'pairs';

export function MediaLibrary({
  assets,
  pairs,
  tab,
  searchValue,
}: {
  assets: MediaAssetCardData[];
  pairs: MediaPairCardData[];
  tab: Tab;
  searchValue: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pairing, startPairing] = useTransition();
  const [pairError, setPairError] = useState<string | null>(null);
  const [pairLabel, setPairLabel] = useState('');
  // Controlled search input — Base UI warns if `defaultValue` changes between
  // renders. Sync with the URL-derived `searchValue` via the official React
  // pattern (compare-and-set during render) so external nav (back/forward,
  // clearing search) keeps the input in step.
  const [searchInput, setSearchInput] = useState(searchValue);
  const [lastSearchProp, setLastSearchProp] = useState(searchValue);
  if (lastSearchProp !== searchValue) {
    setLastSearchProp(searchValue);
    setSearchInput(searchValue);
  }

  const setQuery = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.push(`/admin/media${qs ? `?${qs}` : ''}`);
  };

  const toggleSelect = (id: number) => {
    setPairError(null);
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 2
          ? [prev[1]!, id] // FIFO: keep last 2
          : [...prev, id],
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const createPair = () => {
    if (selectedIds.length !== 2) return;
    const [beforeAssetId, afterAssetId] = selectedIds;
    setPairError(null);
    startPairing(async () => {
      try {
        await createPairAction({
          beforeAssetId,
          afterAssetId,
          label: pairLabel,
        });
        toast.success('จับคู่ before/after แล้ว');
        setSelectedIds([]);
        setPairLabel('');
        router.refresh();
      } catch (err) {
        const msg = (err as Error).message;
        setPairError(msg);
        toast.error(msg || 'จับคู่ไม่สำเร็จ');
      }
    });
  };

  return (
    <section className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">มีเดีย library</h1>
          <p className="mt-1 text-sm text-muted-brand">
            อัปโหลดรูปเก็บไว้ก่อน · ค่อยเอาไปใช้ใน post / work ทีหลัง
          </p>
        </div>
        <Button size="lg" onClick={() => setUploadOpen(true)}>
          + อัปโหลดรูป
        </Button>
      </header>

      <form
        className="flex flex-wrap gap-3"
        action="/admin/media"
        method="get"
      >
        {tab === 'pairs' && <input type="hidden" name="tab" value="pairs" />}
        <Input
          name="q"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ค้นหา title / alt"
          className="grow"
          aria-label="ค้นหารูป"
        />
        <Button type="submit" variant="outline">
          ค้นหา
        </Button>
        {searchValue && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setQuery({ q: null })}
          >
            ล้าง
          </Button>
        )}
      </form>

      <nav className="flex gap-1 border-b border-line" aria-label="หมวดหมู่ library">
        <TabButton
          active={tab === 'assets'}
          onClick={() => setQuery({ tab: null })}
        >
          ภาพทั้งหมด ({assets.length})
        </TabButton>
        <TabButton
          active={tab === 'pairs'}
          onClick={() => setQuery({ tab: 'pairs' })}
        >
          Pairs ({pairs.length})
        </TabButton>
      </nav>

      {tab === 'assets' ? (
        <>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-accent/40 bg-brand-accent/10 px-3 py-2">
              <span className="text-sm text-ink">
                เลือกแล้ว {selectedIds.length}/2
              </span>
              <Input
                value={pairLabel}
                onChange={(e) => setPairLabel(e.target.value)}
                placeholder="ป้าย pair (ไม่จำเป็น)"
                className="h-7 grow text-xs"
                maxLength={180}
                disabled={pairing}
              />
              <Button
                size="sm"
                onClick={createPair}
                disabled={selectedIds.length !== 2 || pairing}
              >
                {pairing ? 'กำลังจับคู่…' : 'จับคู่ before/after'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                disabled={pairing}
              >
                ล้าง
              </Button>
              {pairError && (
                <p className="basis-full text-xs text-destructive" role="alert">
                  {pairError}
                </p>
              )}
              {selectedIds.length === 2 && (
                <p className="basis-full text-[11px] text-muted-brand">
                  ไฟล์แรกที่เลือก = before · ไฟล์สอง = after
                </p>
              )}
            </div>
          )}

          {assets.length === 0 ? (
            <EmptyState message="ยังไม่มีรูปใน library — กดปุ่ม 'อัปโหลดรูป' เพื่อเริ่ม" />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {assets.map((a) => (
                <MediaAssetCard
                  key={a.id}
                  asset={a}
                  selected={selectedIds.includes(a.id)}
                  onToggleSelect={() => toggleSelect(a.id)}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          {pairs.length === 0 ? (
            <EmptyState message="ยังไม่มี pair — เลือกรูป 2 ใบในแท็บ 'ภาพทั้งหมด' แล้วกด 'จับคู่' หรืออัปโหลดในโหมด pair" />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {pairs.map((p) => (
                <MediaPairCard key={p.id} pair={p} />
              ))}
            </ul>
          )}
        </>
      )}

      {uploadOpen && <MediaUploadDialog onClose={() => setUploadOpen(false)} />}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={[
        '-mb-px border-b-2 px-3 py-2 text-sm transition',
        active
          ? 'border-brand-accent text-ink'
          : 'border-transparent text-muted-brand hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-line bg-bg2/40 px-3 py-12 text-center text-sm text-muted-brand">
      {message}
    </p>
  );
}
