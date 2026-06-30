'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
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
    <section className="w-full space-y-5 px-4 py-6 lg:px-6 lg:py-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">มีเดีย library</h1>
          <p className="mt-1 text-sm text-muted-brand">
            อัปโหลดรูปเก็บไว้ก่อน · ค่อยเอาไปใช้ใน post / work ทีหลัง
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
        >
          + อัปโหลดภาพ
        </button>
      </header>

      {/* Tabs + Search row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Pill tab track */}
        <nav
          className="flex gap-1 rounded-xl bg-bg2 p-1"
          aria-label="หมวดหมู่ library"
        >
          <TabButton
            active={tab === 'assets'}
            onClick={() => setQuery({ tab: null })}
          >
            คลังภาพ · {assets.length}
          </TabButton>
          <TabButton
            active={tab === 'pairs'}
            onClick={() => setQuery({ tab: 'pairs' })}
          >
            ก่อน–หลัง · {pairs.length}
          </TabButton>
        </nav>

        {/* Search */}
        <form action="/admin/media" method="get" className="flex-1 min-w-48 max-w-xl">
          {tab === 'pairs' && <input type="hidden" name="tab" value="pairs" />}
          <InputGroup className="rounded-xl border-line bg-brand-card">
            <InputGroupAddon align="inline-start">
              <Search aria-hidden className="size-4 text-muted-brand" />
            </InputGroupAddon>
            <InputGroupInput
              name="q"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ค้นหา title / alt"
              aria-label="ค้นหารูป"
            />
            {searchValue && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setQuery({ q: null })}
                  aria-label="ล้างคำค้น"
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="default">
                ค้นหา
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>

      {tab === 'assets' ? (
        <>
          {/* Pair-mode bar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-ink px-4 py-3">
              <span className="text-sm font-medium text-bg">
                เลือกภาพ ก่อน แล้ว หลัง ({selectedIds.length}/2)
              </span>
              <Input
                value={pairLabel}
                onChange={(e) => setPairLabel(e.target.value)}
                placeholder="ป้าย pair (ไม่จำเป็น)"
                className="h-8 grow border-bg/20 bg-white/10 text-xs text-bg placeholder:text-bg/50 focus-visible:ring-brand-accent/60"
                maxLength={180}
                disabled={pairing}
              />
              <Button
                size="sm"
                onClick={createPair}
                disabled={selectedIds.length !== 2 || pairing}
                aria-busy={pairing}
                className="rounded-lg border-none bg-brand-card text-ink hover:bg-brand-card/90"
              >
                {pairing ? (
                  <>
                    <Spinner className="size-3.5" />
                    <span>กำลังจับคู่…</span>
                  </>
                ) : (
                  'สร้างคู่'
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                disabled={pairing}
                className="text-bg/80 hover:bg-white/10 hover:text-bg"
              >
                ล้าง
              </Button>
              {pairError && (
                <p className="basis-full text-xs text-danger" role="alert">
                  {pairError}
                </p>
              )}
              {selectedIds.length === 2 && (
                <p className="basis-full text-[11px] text-bg/65">
                  ไฟล์แรกที่เลือก = before · ไฟล์สอง = after
                </p>
              )}
            </div>
          )}

          {assets.length === 0 ? (
            <EmptyState message="ยังไม่มีรูปใน library — กดปุ่ม 'อัปโหลดภาพ' เพื่อเริ่ม" />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(186px,1fr))] gap-3.5">
              {assets.map((a, i) => (
                <MediaAssetCard
                  key={a.id}
                  asset={a}
                  selected={selectedIds.includes(a.id)}
                  onToggleSelect={() => toggleSelect(a.id)}
                  priority={i === 0}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          {pairs.length === 0 ? (
            <EmptyState message="ยังไม่มี pair — เลือกรูป 2 ใบในแท็บ 'คลังภาพ' แล้วกด 'สร้างคู่' หรืออัปโหลดในโหมด pair" />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3.5">
              {pairs.map((p, i) => (
                <MediaPairCard key={p.id} pair={p} priority={i === 0} />
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
        'rounded-lg px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
        active
          ? 'bg-brand-card text-ink shadow-sm'
          : 'text-muted-brand hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-bg2/40 px-3 py-12 text-center text-sm text-muted-brand">
      {message}
    </p>
  );
}
