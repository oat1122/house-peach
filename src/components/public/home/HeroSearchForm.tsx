'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

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
  styleChoices: string[];
};

/**
 * Overlapping search card under the hero. Light surface (not glass) per the
 * House-Peach design. room + style → /works filter (reuses the listing's
 * existing query params). No free-text field: there is no full-text search
 * service, so we don't ship a control that goes nowhere.
 */
export function HeroSearchForm({ styleChoices }: Props) {
  const router = useRouter();
  const [room, setRoom] = useState<string>('__all__');
  const [style, setStyle] = useState<string>('__all__');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (room && room !== '__all__') params.set('room', room);
    if (style && style !== '__all__') params.set('style', style);
    const qs = params.toString();
    router.push(qs ? `/works?${qs}` : '/works');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      aria-label="ค้นหาผลงาน"
    >
      <div className="flex flex-1 flex-col gap-1.5 rounded-xl bg-bg2 px-4 py-3">
        <label htmlFor="hero-room" className="text-[11px] font-bold uppercase tracking-widest text-muted-brand select-none">
          ประเภทห้อง
        </label>
        <Select value={room} onValueChange={(v) => setRoom(v ?? '__all__')}>
          <SelectTrigger
            id="hero-room"
            className="h-7 border-0 bg-transparent px-0 text-sm text-ink shadow-none focus:ring-0 [&>svg]:text-muted-brand"
            aria-label="เลือกประเภทห้อง"
          >
            <SelectValue placeholder="ทุกห้อง">
              {(v) =>
                !v || v === '__all__'
                  ? 'ทุกห้อง'
                  : (ROOM_TYPE_LABELS_TH[v as string] ?? (v as string))
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-bg border border-line text-ink">
            <SelectItem value="__all__">ทุกห้อง</SelectItem>
            {roomTypeValues.map((rt) => (
              <SelectItem key={rt} value={rt}>
                {ROOM_TYPE_LABELS_TH[rt] ?? rt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 rounded-xl bg-bg2 px-4 py-3">
        <label htmlFor="hero-style" className="text-[11px] font-bold uppercase tracking-widest text-muted-brand select-none">
          สไตล์
        </label>
        <Select value={style} onValueChange={(v) => setStyle(v ?? '__all__')}>
          <SelectTrigger
            id="hero-style"
            className="h-7 border-0 bg-transparent px-0 text-sm text-ink shadow-none focus:ring-0 [&>svg]:text-muted-brand"
            aria-label="เลือกสไตล์"
          >
            <SelectValue placeholder="ทุกสไตล์">
              {(v) => (!v || v === '__all__' ? 'ทุกสไตล์' : (v as string))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-bg border border-line text-ink">
            <SelectItem value="__all__">ทุกสไตล์</SelectItem>
            {styleChoices.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        type="submit"
        className="inline-flex min-h-[54px] shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-accent px-7 font-semibold text-bg transition-colors hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        <Search className="size-4" aria-hidden="true" />
        <span>ค้นหาผลงาน</span>
      </button>
    </form>
  );
}
