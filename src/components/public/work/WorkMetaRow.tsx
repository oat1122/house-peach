import Link from 'next/link';
import { CalendarRange, Clock, MapPin, Ruler } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/utils/formatDuration';

type Props = {
  roomTypeLabel: string;
  style: string | null;
  yearCompleted: number | null;
  location: string | null;
  areaSqm: number | null;
  durationDays: number | null;
  /** Top tags to show as filter chips. Parent decides how many (typically 2). */
  tags?: { name: string; slug: string }[];
};

/**
 * Project metadata row for the work detail hero — parallel to PostMetaRow.
 *
 * Layout: tag chips (linkable) + room type + style + year/location/area/duration
 * inline-spaced. Empty fields silently omitted so short-info works don't render
 * placeholder dashes.
 *
 * Used in the work hero block in place of the legacy single-line eyebrow text.
 * Mirrors the blog meta row treatment for cross-template parity.
 */
export function WorkMetaRow({
  roomTypeLabel,
  style,
  yearCompleted,
  location,
  areaSqm,
  durationDays,
  tags = [],
}: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-brand">
      {tags.slice(0, 2).map((tag) => (
        <Link key={tag.slug} href={`/works?tag=${encodeURIComponent(tag.slug)}`}>
          <Badge
            variant="secondary"
            className="rounded-full px-3 text-muted-brand font-bold cursor-pointer"
          >
            {tag.name}
          </Badge>
        </Link>
      ))}

      <Badge
        variant="outline"
        className="rounded-full px-3 text-muted-brand font-medium"
      >
        {roomTypeLabel}
      </Badge>

      {style && (
        <Badge
          variant="outline"
          className="rounded-full px-3 text-muted-brand font-medium"
        >
          {style}
        </Badge>
      )}

      {yearCompleted != null && (
        <span className="flex items-center gap-1">
          <CalendarRange size={14} aria-hidden="true" />
          <span>{yearCompleted}</span>
        </span>
      )}

      {location && (
        <span className="flex items-center gap-1">
          <MapPin size={14} aria-hidden="true" />
          <span>{location}</span>
        </span>
      )}

      {areaSqm != null && (
        <span className="flex items-center gap-1">
          <Ruler size={14} aria-hidden="true" />
          <span>{areaSqm.toFixed(0)} ตร.ม.</span>
        </span>
      )}

      {durationDays != null && (
        <span className="flex items-center gap-1">
          <Clock size={14} aria-hidden="true" />
          <span>{formatDuration(durationDays)}</span>
        </span>
      )}
    </div>
  );
}
