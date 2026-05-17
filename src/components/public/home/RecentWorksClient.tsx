'use client';

import { useState } from 'react';

import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { ShowcaseCard } from '@/components/public/home/ShowcaseCard';
import type { WorkCardWork } from '@/components/public/work/WorkCard';
import type { RoomType } from '@/lib/db/schema/works';
import { labels } from '@/lib/i18n/labels';

type ChipFilter = RoomType | 'all';

type Chip = {
  key:
    | 'homeRoomChipAll'
    | 'homeRoomChipLiving'
    | 'homeRoomChipBedroom'
    | 'homeRoomChipKitchen'
    | 'homeRoomChipHouse';
  filter: ChipFilter;
};

const CHIPS: readonly Chip[] = [
  { key: 'homeRoomChipAll', filter: 'all' },
  { key: 'homeRoomChipLiving', filter: 'living' },
  { key: 'homeRoomChipBedroom', filter: 'bedroom' },
  { key: 'homeRoomChipKitchen', filter: 'kitchen' },
  { key: 'homeRoomChipHouse', filter: 'full_house' },
];

const VISIBLE_COUNT = 4;

type Props = {
  /** Pool of recent works to filter from. Client picks first 4 matching active chip. */
  pool: WorkCardWork[];
};

export function RecentWorksClient({ pool }: Props) {
  const [active, setActive] = useState<ChipFilter>('all');

  const filtered =
    active === 'all' ? pool : pool.filter((w) => w.roomType === active);
  const visible = filtered.slice(0, VISIBLE_COUNT);

  return (
    <>
      {/* Room-type chips — client-side filter, no navigation */}
      <nav
        aria-label="กรองตามประเภทห้อง"
        className="flex justify-center mb-8 overflow-x-auto"
      >
        <ul className="inline-flex bg-brand-card rounded-full p-1 gap-1 border border-line shadow-sm">
          {CHIPS.map(({ key, filter }) => {
            const isActive = active === filter;
            const label = labels[key];
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setActive(filter)}
                  aria-pressed={isActive}
                  className={
                    isActive
                      ? 'inline-flex items-center min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-accent text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 transition-colors cursor-pointer'
                      : 'inline-flex items-center min-h-[36px] px-4 py-1.5 rounded-full text-xs font-medium text-muted-brand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 transition-colors cursor-pointer'
                  }
                >
                  {label.th}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Grid — keyed by filter so Stagger re-runs on chip change */}
      {visible.length > 0 ? (
        <Stagger
          key={active}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {visible.map((work) => (
            <StaggerItem key={work.slug}>
              <ShowcaseCard work={work} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <p
          role="status"
          className="text-center text-sm text-muted-brand py-12"
        >
          ยังไม่มีผลงานในหมวดนี้
        </p>
      )}
    </>
  );
}
