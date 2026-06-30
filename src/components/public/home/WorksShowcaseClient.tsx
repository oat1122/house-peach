'use client';

import { useMemo, useState } from 'react';

import { ShowcaseWorkCard } from '@/components/public/home/ShowcaseWorkCard';
import type { WorkCardWork } from '@/components/public/work/WorkCard';
import { resolveRoomTypeLabel } from '@/lib/utils/workLabels';
import type { RoomType } from '@/lib/db/schema/works';

const ALL = '__all__';

/**
 * Room-type filter pills + grid. Pills are derived from the room types present
 * in the supplied works, so we never show an empty filter. Filtering is
 * client-side over an already-loaded pool (no refetch).
 */
export function WorksShowcaseClient({ works }: { works: WorkCardWork[] }) {
  const [active, setActive] = useState<RoomType | typeof ALL>(ALL);

  const roomTypes = useMemo(() => {
    const seen: RoomType[] = [];
    for (const w of works) if (!seen.includes(w.roomType)) seen.push(w.roomType);
    return seen;
  }, [works]);

  const filtered = active === ALL ? works : works.filter((w) => w.roomType === active);

  const pills: { key: RoomType | typeof ALL; label: string }[] = [
    { key: ALL, label: 'ทั้งหมด' },
    ...roomTypes.map((rt) => ({ key: rt, label: resolveRoomTypeLabel(rt) })),
  ];

  return (
    <>
      <div className="mb-10 flex flex-wrap justify-center gap-2.5">
        {pills.map((pill) => {
          const isActive = pill.key === active;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setActive(pill.key)}
              aria-pressed={isActive}
              className={
                'min-h-[40px] rounded-full border px-5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ' +
                (isActive
                  ? 'border-brand-accent bg-brand-accent text-bg'
                  : 'border-line bg-brand-card text-muted-brand hover:border-brand-accent hover:text-ink')
              }
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((work) => (
          <ShowcaseWorkCard key={work.slug} work={work} />
        ))}
      </div>
    </>
  );
}
