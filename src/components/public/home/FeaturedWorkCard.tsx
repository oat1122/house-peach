import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import type { WorkCardWork } from '@/components/public/work/WorkCard';
import { resolveRoomTypeLabel } from '@/lib/utils/workLabels';

type Props = {
  work: WorkCardWork;
};

/**
 * Featured work card for the DiscoverSection left slot.
 * Fills the full grid area (lg:row-span-2) with a full-cover image and an
 * info overlay at the bottom — Housify-style "price overlay" adapted to show
 * title + location/area/year instead of price.
 *
 * This is RSC — no `'use client'` needed.
 */
export function FeaturedWorkCard({ work }: Props) {
  const { slug, title, location, areaSqm, yearCompleted, coverPath, coverAlt, roomType, style } = work;

  const resolvedAlt =
    coverAlt ||
    `${title} — ${resolveRoomTypeLabel(roomType)}${style ? `, สไตล์ ${style}` : ''}`;

  const areaSqmNum = areaSqm != null ? parseFloat(String(areaSqm)) : null;

  const metaLine = [
    location ?? null,
    areaSqmNum != null ? `${areaSqmNum.toFixed(0)} ตร.ม.` : null,
    yearCompleted ? String(yearCompleted) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="relative rounded-xl overflow-hidden h-full min-h-[220px] group">
      <Link
        href={`/works/${encodeURIComponent(slug)}`}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xl"
      >
        {/* Cover image — fills entire card area */}
        <div className="absolute inset-0">
          {coverPath ? (
            <Image
              src={coverPath}
              alt={resolvedAlt}
              fill
              sizes="(max-width: 1024px) calc(100vw - 32px), 560px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-bg2" />
          )}
        </div>

        {/* Info overlay — absolute bottom, Housify-style */}
        <div className="absolute bottom-3 left-3 right-3 bg-ink/80 backdrop-blur-md rounded-xl p-3 text-bg grid grid-cols-[1fr_auto] gap-3 items-center">
          {/* Left: title + meta */}
          <div className="min-w-0">
            <h3 className="text-base font-bold leading-tight truncate">
              {title}
            </h3>
            {metaLine && (
              <p className="text-[11px] opacity-85 leading-tight mt-1 truncate">
                {metaLine}
              </p>
            )}
          </div>

          {/* Right: accent arrow button */}
          <div
            aria-hidden="true"
            className="w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center text-bg flex-shrink-0"
          >
            <ArrowUpRight size={16} />
          </div>
        </div>
      </Link>
    </article>
  );
}
