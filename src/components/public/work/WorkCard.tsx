import Image from 'next/image';
import Link from 'next/link';

import { resolveRoomTypeLabel } from '@/lib/utils/workLabels';
import type { RoomType, BudgetRange } from '@/lib/db/schema/works';

export type WorkCardWork = {
  slug: string;
  title: string;
  summary: string;
  roomType: RoomType;
  style: string | null;
  location: string | null;
  yearCompleted: number | null;
  areaSqm: string | null;
  budgetRange: BudgetRange | null;
  durationDays: number | null;
  coverPath: string | null;
  coverAlt: string | null;
};

type Props = {
  work: WorkCardWork;
  variant?: 'regular' | 'hero';
  /** Pass true to the first card rendered to hint LCP image priority. */
  priority?: boolean;
};

/**
 * Public work card — used on /works listing and WorkRelatedSection.
 *
 * - `variant="regular"` (default): uniform 3:2 card for the grid
 * - `variant="hero"`: anchor card — full-bleed on mobile, 2-col on desktop
 *
 * Implements uxui.md §9.3 WorkCard anatomy and spec §5.
 */
export function WorkCard({ work, variant = 'regular', priority = false }: Props) {
  const {
    slug,
    title,
    summary,
    roomType,
    style,
    yearCompleted,
    areaSqm,
    durationDays,
    coverPath,
    coverAlt,
  } = work;

  const roomTypeLabel = resolveRoomTypeLabel(roomType);
  const resolvedAlt =
    coverAlt ||
    `${title} — ${roomTypeLabel}${style ? `, สไตล์ ${style}` : ''}`;

  const eyebrow = [
    roomTypeLabel,
    style || null,
    yearCompleted ? String(yearCompleted) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Stat line: area + year (null parts omitted)
  const areaSqmNum = areaSqm != null ? parseFloat(String(areaSqm)) : null;
  const statParts = [
    areaSqmNum != null ? `${areaSqmNum.toFixed(0)} ตร.ม.` : null,
    durationDays != null ? `${durationDays} วัน` : null,
    yearCompleted ? String(yearCompleted) : null,
  ].filter(Boolean);
  const statLine = statParts.join(' · ');

  if (variant === 'hero') {
    return (
      <article>
        <Link
          href={`/works/${encodeURIComponent(slug)}`}
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md"
          aria-label={`ดูผลงาน: ${title}`}
        >
          {/* Mobile: full-bleed, no radius. Desktop: rounded inside grid column */}
          <div className="md:grid md:grid-cols-[3fr_2fr] md:gap-8 md:items-center">
            {/* Image column */}
            <div className="relative w-full aspect-[3/2] -mx-4 md:mx-0 overflow-hidden md:rounded-md bg-bg2">
              {coverPath ? (
                <Image
                  src={coverPath}
                  alt={resolvedAlt}
                  fill
                  priority={priority}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 60vw, 700px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-bg2" />
              )}
            </div>

            {/* Text column */}
            <div className="px-4 md:px-0 mt-4 md:mt-0 md:py-4">
              <p className="text-[11px] uppercase tracking-widest text-muted">
                {eyebrow}
              </p>
              <h3 className="font-serif text-3xl md:text-4xl font-bold text-ink mt-2 leading-[1.2] group-hover:text-accent transition-colors line-clamp-3">
                {title}
              </h3>
              <p className="text-sm md:text-base text-muted leading-[1.65] mt-2 line-clamp-3">
                {summary}
              </p>

              {/* Stat mini-band — desktop only elaborate version */}
              {statParts.length > 0 && (
                <>
                  {/* Mobile: inline stat line */}
                  <p className="md:hidden text-xs text-ink font-medium mt-3">
                    {statLine}
                  </p>
                  {/* Desktop: structured cells */}
                  <div className="hidden md:flex gap-6 mt-4">
                    {areaSqmNum != null && (
                      <div>
                        <p className="text-2xl font-bold text-ink leading-none">
                          {areaSqmNum.toFixed(0)}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-muted mt-1">
                          ตร.ม.
                        </p>
                      </div>
                    )}
                    {durationDays != null && (
                      <div>
                        <p className="text-2xl font-bold text-ink leading-none">
                          {durationDays}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-muted mt-1">
                          วัน
                        </p>
                      </div>
                    )}
                    {yearCompleted && (
                      <div>
                        <p className="text-2xl font-bold text-ink leading-none">
                          {yearCompleted}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-muted mt-1">
                          ปี
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <p className="hidden md:block text-sm text-accent mt-6">
                ดูผลงานนี้ →
              </p>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // Regular variant
  return (
    <article>
      <Link
        href={`/works/${encodeURIComponent(slug)}`}
        className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label={`ดูผลงาน: ${title}`}
      >
        {/* Cover image — aspect 3:2 */}
        <div className="relative w-full aspect-[3/2] overflow-hidden rounded-md bg-bg2">
          {coverPath ? (
            <Image
              src={coverPath}
              alt={resolvedAlt}
              fill
              priority={priority}
              sizes="(max-width: 768px) calc(50vw - 24px), (max-width: 1024px) calc(33vw - 24px), 380px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-bg2" />
          )}
        </div>

        {/* Meta */}
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">
            {eyebrow}
          </p>
          <p className="text-base font-semibold text-ink mt-1 line-clamp-2 group-hover:text-accent transition-colors">
            {title}
          </p>
          {statLine && (
            <p className="text-xs text-muted mt-1">{statLine}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
