import Link from 'next/link';
import { Sofa, Bed, Utensils, Bath, Trees, Home } from 'lucide-react';

import { FadeUp } from '@/components/motion/FadeUp';
import { ROOM_TYPE_LABELS_TH } from '@/lib/utils/workLabels';
import type { RoomType } from '@/lib/db/schema/works';

type Props = {
  counts: Record<RoomType, number>;
};

const CATEGORIES = [
  { type: 'living' as RoomType, icon: Sofa },
  { type: 'bedroom' as RoomType, icon: Bed },
  { type: 'kitchen' as RoomType, icon: Utensils },
  { type: 'bathroom' as RoomType, icon: Bath },
  { type: 'outdoor' as RoomType, icon: Trees },
  { type: 'full_house' as RoomType, icon: Home },
];

export function RoomTypeCategories({ counts }: Props) {
  return (
    <section className="bg-bg2 mt-12 md:mt-16" aria-labelledby="categories-title">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <FadeUp>
          <div className="mx-auto mb-10 max-w-xl text-center md:mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
              เลือกชมตามห้อง
            </span>
            <h2
              id="categories-title"
              className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink md:text-4xl"
            >
              ค้นหาตามประเภทห้อง
            </h2>
          </div>
        </FadeUp>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ type, icon: Icon }) => {
            const count = counts[type] ?? 0;
            const label = ROOM_TYPE_LABELS_TH[type] ?? type;

            return (
              <Link
                key={type}
                href={`/works?room=${type}`}
                className="group flex min-h-[140px] select-none flex-col items-center justify-center rounded-2xl border border-line bg-brand-card p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                <span className="mb-3.5 inline-flex size-14 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent transition-colors duration-300 group-hover:bg-brand-accent group-hover:text-bg">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="text-base font-bold text-ink">{label}</span>
                <span className="mt-1 text-xs text-muted-brand">{count} ผลงาน</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
