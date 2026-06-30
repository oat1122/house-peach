import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Maximize2, Calendar } from 'lucide-react';

import type { WorkCardWork } from '@/components/public/work/WorkCard';
import { resolveRoomTypeLabel } from '@/lib/utils/workLabels';

/**
 * Home works-showcase card (House-Peach design): cover with style badge,
 * title, location, and an area/year stat strip. RSC.
 */
export function ShowcaseWorkCard({ work }: { work: WorkCardWork }) {
  const { slug, title, location, areaSqm, yearCompleted, coverPath, coverAlt, roomType, style } = work;

  const roomTypeLabel = resolveRoomTypeLabel(roomType);
  const resolvedAlt =
    coverAlt || `${title} — ${roomTypeLabel}${style ? `, สไตล์ ${style}` : ''}`;
  const areaSqmNum = areaSqm != null ? parseFloat(String(areaSqm)) : null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-brand-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
      <Link
        href={`/works/${encodeURIComponent(slug)}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-2xl"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {coverPath ? (
            <Image
              src={coverPath}
              alt={resolvedAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-bg2" />
          )}
          {style && (
            <span className="absolute left-3 top-3 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-bold text-bg">
              {style}
            </span>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-ink group-hover:text-brand-accent transition-colors line-clamp-1">
            {title}
          </h3>
          {location && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-brand">
              <MapPin className="size-3.5 text-brand-accent" aria-hidden="true" />
              {location}
            </p>
          )}
          <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs text-muted-brand">
            {areaSqmNum != null && (
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 className="size-3.5" aria-hidden="true" />
                {areaSqmNum.toFixed(0)} ตร.ม.
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">{roomTypeLabel}</span>
            {yearCompleted && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" aria-hidden="true" />
                {yearCompleted}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
