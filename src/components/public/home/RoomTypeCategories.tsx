import Link from 'next/link';
import { Sofa, Bed, Utensils, Bath, Trees, Home } from 'lucide-react';
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
    <section className="mx-auto max-w-6xl px-4 md:px-6 py-16" aria-labelledby="categories-title">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-muted-brand font-semibold block mb-2">
            Browse by Room Type
          </span>
          <h2 id="categories-title" className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink">
            เลือกชมตามประเภทห้อง
          </h2>
        </div>
        <Link
          href="/works"
          className="text-sm font-semibold text-brand-accent hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
        >
          ดูผลงานทั้งหมด →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {CATEGORIES.map(({ type, icon: Icon }) => {
          const count = counts[type] ?? 0;
          const label = ROOM_TYPE_LABELS_TH[type] ?? type;

          return (
            <Link
              key={type}
              href={`/works?room=${type}`}
              className="group relative flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-brand-card border border-line hover:border-brand-accent hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:border-brand-accent min-h-[140px] select-none"
            >
              {/* Dynamic hover background overlay for warm minimalist effect */}
              <div className="absolute inset-0 bg-brand-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="p-3 rounded-full bg-bg2 text-muted-brand group-hover:text-brand-accent group-hover:bg-bg2/50 transition-all duration-300 mb-3 group-hover:scale-110">
                <Icon className="size-6 shrink-0" />
              </div>

              <span className="text-sm font-semibold text-ink mb-1 group-hover:text-brand-accent transition-colors">
                {label}
              </span>
              
              <span className="text-xs text-muted-brand">
                {count} {count === 1 ? 'project' : 'projects'}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
