import Link from 'next/link';
import { Calendar, Clock, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

type Props = {
  publishedAt: Date;
  readingTimeMin: number | null;
  author: { name: string };
  tags: { name: string; slug: string }[];
};

/**
 * Post metadata row: tag chip(s), published date (th-TH พ.ศ.), reading time,
 * and author. Used in PostHero and PostCard variants.
 */
export function PostMetaRow({ publishedAt, readingTimeMin, author, tags }: Props) {
  const dateStr = new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(
    publishedAt,
  );

  return (
    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-brand">
      {tags.slice(0, 2).map((tag) => (
        <Link
          key={tag.slug}
          href={`/blog?tag=${encodeURIComponent(tag.slug)}`}
          className="min-w-0 max-w-full"
        >
          <Badge
            variant="secondary"
            className="rounded-full px-3 text-muted-brand font-bold cursor-pointer max-w-full break-words"
          >
            {tag.name}
          </Badge>
        </Link>
      ))}

      <span className="flex items-center gap-1">
        <Calendar size={14} aria-hidden="true" />
        <time dateTime={publishedAt.toISOString()}>{dateStr}</time>
      </span>

      {readingTimeMin != null && readingTimeMin > 0 && (
        <span className="flex items-center gap-1">
          <Clock size={14} aria-hidden="true" />
          <span>{readingTimeMin} นาที</span>
        </span>
      )}

      <span className="flex items-center gap-1 min-w-0">
        <User size={14} aria-hidden="true" className="flex-none" />
        <span className="break-words min-w-0">โดย {author.name}</span>
      </span>
    </div>
  );
}
