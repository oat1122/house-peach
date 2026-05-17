import Image from 'next/image';
import Link from 'next/link';

import { resolveRoomTypeLabel } from '@/lib/utils/workLabels';
import type { RoomType } from '@/lib/db/schema/works';

type Props = {
  slug: string;
  title: string;
  coverPath: string;
  roomType: RoomType;
  style: string | null;
  yearCompleted: number | null;
};

/**
 * RSC — Horizontal thumb + title + meta compact card (spec §S13b).
 *
 * Used exclusively inside the desktop sidebar of `WorkConceptSection`.
 * This component is NEVER rendered on mobile (parent `<aside>` is
 * `hidden md:block`).
 *
 * Visual contract differs significantly from `WorkCard`:
 * - 64×64px fixed-size thumbnail (vs 3:2 cover)
 * - No tag chips, no excerpt, no budget
 * - Title color-shifts on hover (no translate/lift — spec §S13b "States")
 *
 * Alt is built in-component from title + roomType + style so the
 * `WorkCompact` service type doesn't need a separate `coverAlt` field.
 */
export function WorkCardCompact({
  slug,
  title,
  coverPath,
  roomType,
  style,
  yearCompleted,
}: Props) {
  const roomTypeLabel = resolveRoomTypeLabel(roomType);
  const coverAlt =
    `${title} — ${roomTypeLabel}` + (style ? `, สไตล์ ${style}` : '');

  const hasMetaLine = style != null || yearCompleted != null;

  return (
    <Link
      href={`/works/${slug}`}
      className="flex items-start gap-3 group rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
    >
      <Image
        src={coverPath}
        alt={coverAlt}
        width={64}
        height={64}
        sizes="80px"
        className="w-16 h-16 object-cover rounded-sm flex-none"
        unoptimized
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink line-clamp-2 group-hover:text-brand-accent transition-colors">
          {title}
        </p>
        {hasMetaLine && (
          <p className="text-xs text-muted-brand mt-0.5">
            {style ?? null}
            {style && yearCompleted ? ' · ' : null}
            {yearCompleted ?? null}
          </p>
        )}
      </div>
    </Link>
  );
}
