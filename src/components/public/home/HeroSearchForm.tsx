'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

export function HeroSearchForm({ styleChoices }: Props) {
  const router = useRouter();
  const [room, setRoom] = useState<string>('__all__');
  const [style, setStyle] = useState<string>('__all__');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (room && room !== '__all__') {
      params.set('room', room);
    }
    if (style && style !== '__all__') {
      params.set('style', style);
    }
    const qs = params.toString();
    router.push(qs ? `/works?${qs}` : '/works');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 w-full max-w-[480px] rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-lg flex flex-col sm:flex-row gap-3 items-end sm:items-center focus-within:border-white/45 transition-all duration-200"
    >
      <div className="flex-1 w-full flex flex-col gap-1">
        <label htmlFor="hero-room" className="text-xs font-semibold text-white/80 select-none">
          ประเภทห้อง
        </label>
        <Select value={room} onValueChange={(v) => setRoom(v ?? '__all__')}>
          <SelectTrigger
            id="hero-room"
            className="h-10 w-full text-white bg-white/10 border-white/20 hover:bg-white/20 focus:border-white focus:ring-white/30 text-sm [&>svg]:text-white/60"
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

      <div className="flex-1 w-full flex flex-col gap-1">
        <label htmlFor="hero-style" className="text-xs font-semibold text-white/80 select-none">
          สไตล์
        </label>
        <Select value={style} onValueChange={(v) => setStyle(v ?? '__all__')}>
          <SelectTrigger
            id="hero-style"
            className="h-10 w-full text-white bg-white/10 border-white/20 hover:bg-white/20 focus:border-white focus:ring-white/30 text-sm [&>svg]:text-white/60"
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

      <Button
        type="submit"
        variant="default"
        className="h-10 w-full sm:w-auto bg-white text-ink hover:bg-white/90 focus-visible:ring-white/50 border border-white/20 rounded-lg flex items-center justify-center gap-1.5 px-4 font-semibold shrink-0 cursor-pointer transition-all duration-150 active:scale-[0.98]"
        aria-label="ค้นหาผลงาน"
      >
        <Search className="size-4" />
        <span>ค้นหา</span>
      </Button>
    </form>
  );
}
