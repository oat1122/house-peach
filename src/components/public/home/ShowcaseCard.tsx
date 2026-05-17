import Image from 'next/image';
import Link from 'next/link';

import type { WorkCardWork } from '@/components/public/work/WorkCard';
import { resolveRoomTypeLabel } from '@/lib/utils/workLabels';

type Props = {
  work: WorkCardWork;
};

/**
 * Showcase card for the RecentWorksStrip section.
 * Full-cover image with a "label overlay" near the bottom — h4 title + 3-cell
 * spec strip (area · room type · year). Housify-style.
 *
 * RSC — no `'use client'` needed.
 */
export function ShowcaseCard({ work }: Props) {
  const { slug, title, roomType, style, yearCompleted, areaSqm, coverPath, coverAlt } = work;

  const resolvedAlt =
    coverAlt ||
    `${title} — ${resolveRoomTypeLabel(roomType)}${style ? `, สไตล์ ${style}` : ''}`;

  const areaSqmNum = areaSqm != null ? parseFloat(String(areaSqm)) : null;
  const roomLabel = resolveRoomTypeLabel(roomType);

  return (
    <article className="relative rounded-xl overflow-hidden h-[280px] group block">
      <Link
        href={`/works/${encodeURIComponent(slug)}`}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xl"
      >
        {/* Cover image */}
        {coverPath ? (
          <Image
            src={coverPath}
            alt={resolvedAlt}
            fill
            sizes="(max-width: 640px) calc(50vw - 24px), (max-width: 1024px) calc(25vw - 20px), 280px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-bg2" />
        )}

        {/* Label overlay */}
        <div className="absolute bottom-2 left-2 right-2 bg-brand-card/95 backdrop-blur-md rounded-lg p-3">
          {/* Title */}
          <h4 className="text-sm font-bold text-ink text-center mb-1.5 line-clamp-1">
            {title}
          </h4>

          {/* 3-cell spec strip */}
          <div className="flex gap-1.5">
            {/* Area */}
            <div className="flex-1 bg-bg2 rounded-md py-1.5 px-1 text-center text-[10px] leading-tight text-muted-brand">
              <b className="block text-ink text-xs">
                {areaSqmNum != null ? areaSqmNum.toFixed(0) : '—'}
              </b>
              ตร.ม.
            </div>

            {/* Room type */}
            <div className="flex-1 bg-bg2 rounded-md py-1.5 px-1 text-center text-[10px] leading-tight text-muted-brand">
              <b className="block text-ink text-xs truncate">{roomLabel}</b>
              ห้อง
            </div>

            {/* Year */}
            <div className="flex-1 bg-bg2 rounded-md py-1.5 px-1 text-center text-[10px] leading-tight text-muted-brand">
              <b className="block text-ink text-xs">
                {yearCompleted ?? '—'}
              </b>
              ปี
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
