import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { FadeUp } from '@/components/motion/FadeUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { WorkCard } from '@/components/public/work/WorkCard';
import type { WorkPublicListItem } from '@/lib/services/work';

type Props = {
  items: WorkPublicListItem[];
  total: number;
  hasMore: boolean;
  /** True when any filter is currently active (room or style param set). */
  isFiltered: boolean;
  /** The current page number to compute the next page link. */
  currentPage: number;
  /** Preserved filter params to carry into the load-more URL. */
  filterParams: { room?: string; style?: string };
};

/**
 * RSC — Renders the works grid with hero + regular cards.
 *
 * Layout rules (spec §4, §12):
 * - No filters active: first item is hero (variant="hero"), rest in 3-col grid
 * - Filters active: skip hero — all items in 3-col grid
 * - ≤6 regular cards: Stagger; >6: FadeUp on the grid container
 * - Empty: context-appropriate empty state (per spec §10)
 *
 * Pagination: server-rendered next-page Link (not a client fetch).
 */
export function WorksListing({
  items,
  total,
  hasMore,
  isFiltered,
  currentPage,
  filterParams,
}: Props) {
  // Truly empty portfolio (no filter, no works at all)
  if (!isFiltered && items.length === 0) {
    return (
      <div className="py-20 text-center">
        <SearchX size={48} className="text-muted mx-auto mb-4" aria-hidden />
        <h2 className="text-xl font-semibold text-ink">
          ยังไม่มีผลงาน
        </h2>
        <p className="text-sm text-muted mt-2">
          กลับมาดูใหม่อีกครั้ง —{' '}
          <Link href="/contact" className="text-accent underline">
            ติดต่อเรา
          </Link>
        </p>
      </div>
    );
  }

  // Filter returned zero results
  if (isFiltered && items.length === 0) {
    return (
      <div className="py-20 text-center">
        <SearchX size={48} className="text-muted mx-auto mb-4" aria-hidden />
        <h2 className="text-xl font-semibold text-ink">
          ยังไม่มีผลงานที่ตรงกับตัวกรองนี้
        </h2>
        <p className="text-sm text-muted mt-2">
          ลองเปลี่ยนตัวกรอง หรือ{' '}
          <Link href="/works" className="text-accent underline">
            ดูผลงานทั้งหมด →
          </Link>
        </p>
      </div>
    );
  }

  const heroItem = !isFiltered ? items[0] : null;
  const regularItems = !isFiltered ? items.slice(1) : items;

  // Next page URL (carries current filters)
  function buildNextPageUrl() {
    const params = new URLSearchParams();
    if (filterParams.room) params.set('room', filterParams.room);
    if (filterParams.style) params.set('style', filterParams.style);
    params.set('page', String(currentPage + 1));
    return `/works?${params.toString()}`;
  }

  return (
    <div>
      {/* Hero card (unfiltered view only) */}
      {heroItem && (
        <FadeUp delay={0.1}>
          <div className="mt-8">
            <WorkCard work={heroItem} variant="hero" priority />
          </div>
        </FadeUp>
      )}

      {/* Divider between hero and regular grid */}
      {heroItem && regularItems.length > 0 && (
        <hr className="border-t border-line mx-0 mt-8 md:mt-12" />
      )}

      {/* Regular grid */}
      {regularItems.length > 0 && (
        <div className="mt-8 md:mt-12">
          {regularItems.length <= 6 ? (
            <Stagger
              as="ul"
              className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 list-none p-0"
            >
              {regularItems.map((work, idx) => (
                <StaggerItem as="li" key={work.id}>
                  <WorkCard
                    work={work}
                    variant="regular"
                    // First regular card gets priority only when there's no hero
                    priority={!heroItem && idx === 0}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <FadeUp>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 list-none p-0">
                {regularItems.map((work, idx) => (
                  <li key={work.id}>
                    <WorkCard
                      work={work}
                      variant="regular"
                      priority={!heroItem && idx === 0}
                    />
                  </li>
                ))}
              </ul>
            </FadeUp>
          )}
        </div>
      )}

      {/* Load-more (server-rendered link styled as button) */}
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <Link
            href={buildNextPageUrl()}
            className="inline-flex items-center justify-center px-8 py-3 rounded-md border border-line text-sm text-ink hover:bg-bg2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            โหลดเพิ่มเติม ({total - items.length} เหลืออยู่)
          </Link>
        </div>
      )}
    </div>
  );
}
