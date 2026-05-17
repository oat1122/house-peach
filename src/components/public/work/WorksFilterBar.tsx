'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ROOM_TYPE_LABELS_TH } from '@/lib/utils/workLabels';
import { roomTypeValues } from '@/lib/db/schema/works';

type Props = {
  availableStyles: string[];
};

/**
 * Client filter bar for /works listing.
 *
 * Reads current filter values from URL search params (single source of truth).
 * On change: router.push with updated params, always resets page to 1.
 * Uses useTransition to show a pending state on the changed control.
 *
 * Per spec §6 and red-line §4: no React state separate from URL.
 */
export function WorksFilterBar({ availableStyles }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentRoom = searchParams.get('room') ?? '';
  const currentStyle = searchParams.get('style') ?? '';
  const hasActiveFilter = currentRoom !== '' || currentStyle !== '';

  function buildUrl(updates: { room?: string; style?: string }) {
    const params = new URLSearchParams();
    const room = 'room' in updates ? updates.room : currentRoom;
    const style = 'style' in updates ? updates.style : currentStyle;
    if (room) params.set('room', room);
    if (style) params.set('style', style);
    // Always reset to page 1 when filter changes (no stale page offset)
    const qs = params.toString();
    return qs ? `/works?${qs}` : '/works';
  }

  function handleRoomChange(value: string | null) {
    // '__all__' sentinel or null = no filter
    const room = !value || value === '__all__' ? '' : value;
    startTransition(() => {
      router.push(buildUrl({ room }), { scroll: false });
    });
  }

  function handleStyleChange(value: string | null) {
    const style = !value || value === '__all__' ? '' : value;
    startTransition(() => {
      router.push(buildUrl({ style }), { scroll: false });
    });
  }

  function handleClearFilters() {
    startTransition(() => {
      router.push('/works', { scroll: false });
    });
  }

  return (
    <div
      className="sticky top-0 z-10 bg-bg/90 backdrop-blur-sm border-b border-line"
      aria-busy={isPending}
    >
      <form
        aria-label="ตัวกรองผลงาน"
        className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex flex-wrap items-center gap-3"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Room type filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="filter-room"
            className="text-xs text-muted-brand sr-only"
          >
            ประเภทห้อง
          </label>
          <Select
            value={currentRoom || '__all__'}
            onValueChange={handleRoomChange}
          >
            <SelectTrigger
              id="filter-room"
              className="h-11 text-sm min-w-[140px]"
              aria-label="กรองตามประเภทห้อง"
            >
              {/* base-ui SelectValue renders the raw value string by default —
                  we must pass a formatter to translate it back to the Thai
                  label. Without this, the trigger shows "__all__" or "living"
                  literal instead of "ทุกห้อง" / "ห้องนั่งเล่น". */}
              <SelectValue placeholder="ทุกห้อง">
                {(v) =>
                  !v || v === '__all__'
                    ? 'ทุกห้อง'
                    : (ROOM_TYPE_LABELS_TH[v as string] ?? (v as string))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">ทุกห้อง</SelectItem>
              {roomTypeValues.map((rt) => (
                <SelectItem key={rt} value={rt}>
                  {ROOM_TYPE_LABELS_TH[rt] ?? rt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style filter */}
        {availableStyles.length > 0 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-style"
              className="text-xs text-muted-brand sr-only"
            >
              สไตล์
            </label>
            <Select
              value={currentStyle || '__all__'}
              onValueChange={handleStyleChange}
            >
              <SelectTrigger
                id="filter-style"
                className="h-11 text-sm min-w-[140px]"
                aria-label="กรองตามสไตล์"
              >
                <SelectValue placeholder="ทุกสไตล์">
                  {(v) =>
                    !v || v === '__all__' ? 'ทุกสไตล์' : (v as string)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">ทุกสไตล์</SelectItem>
                {availableStyles.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Clear filters — only when any filter is active.
             px-3 py-2 gives ~36px height. WCAG recommends 44px; 36px + clear
             focus ring is acceptable for low-priority tertiary controls. */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleClearFilters}
            aria-label="ล้างตัวกรองทั้งหมด"
            className="text-xs text-muted-brand hover:text-ink transition-colors px-3 min-h-[44px] inline-flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            × ล้างตัวกรอง
          </button>
        )}
      </form>
    </div>
  );
}
