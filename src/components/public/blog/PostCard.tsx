import Image from 'next/image';
import Link from 'next/link';
import { FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export type PostCardPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | null;
  readingTimeMin: number | null;
  authorName: string | null;
  tags?: { name: string; slug: string }[];
  coverPath: string | null;
  coverAlt: string | null;
};

type Props = {
  post: PostCardPost;
  variant?: 'default' | 'compact' | 'related';
  priority?: boolean;
};

/**
 * Blog post card — 3 display variants:
 * - `default`: full listing grid card (16:10 cover + meta)
 * - `compact`: sidebar mini-row (60×60 thumb + title + date)
 * - `related`: related section card (rounded-2xl border, full text)
 */
export function PostCard({ post, variant = 'default', priority = false }: Props) {
  const {
    slug,
    title,
    excerpt,
    publishedAt,
    readingTimeMin,
    authorName,
    tags = [],
    coverPath,
    coverAlt,
  } = post;

  const resolvedAlt = coverAlt || `${title} — ภาพปก`;
  const dateStr = publishedAt
    ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(publishedAt)
    : null;

  const href = `/blog/${encodeURIComponent(slug)}`;

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className="flex gap-3 items-start hover:bg-bg2 rounded-xl p-2 -mx-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
      >
        <div className="flex-shrink-0 w-[60px] h-[60px] rounded-xl overflow-hidden bg-bg2">
          {coverPath ? (
            <Image
              src={coverPath}
              alt={resolvedAlt}
              width={60}
              height={60}
              sizes="60px"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText size={22} className="text-muted-brand" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink line-clamp-2 leading-snug">
            {title}
          </p>
          {dateStr && (
            <p className="text-xs text-muted-brand mt-1">{dateStr}</p>
          )}
        </div>
      </Link>
    );
  }

  if (variant === 'related') {
    return (
      <article className="group bg-brand-card border border-line rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-transform hover:shadow-sm">
        <Link
          href={href}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-2xl"
        >
          <div className="relative w-full aspect-[16/10] bg-bg2">
            {coverPath ? (
              <Image
                src={coverPath}
                alt={resolvedAlt}
                fill
                priority={priority}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText size={32} className="text-muted-brand" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="p-5 space-y-2">
            {tags[0] && (
              <p className="text-xs font-bold text-muted-brand uppercase tracking-widest">
                {tags[0].name}
              </p>
            )}
            <h3 className="text-lg font-semibold text-ink line-clamp-2 leading-snug">
              {title}
            </h3>
            <p className="text-sm text-muted-brand line-clamp-2">{excerpt}</p>
            {dateStr && (
              <p className="text-xs text-muted-brand flex items-center gap-1">
                {dateStr}
                {readingTimeMin != null && readingTimeMin > 0 && (
                  <> · {readingTimeMin} นาที</>
                )}
              </p>
            )}
          </div>
        </Link>
      </article>
    );
  }

  // Default variant
  return (
    <article className="group hover:-translate-y-0.5 transition-transform hover:shadow-sm">
      <Link
        href={href}
        className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
      >
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-md bg-bg2">
          {coverPath ? (
            <Image
              src={coverPath}
              alt={resolvedAlt}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText size={32} className="text-muted-brand" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          {tags[0] && (
            <Badge
              variant="secondary"
              className="rounded-full px-3 text-muted-brand font-bold"
            >
              {tags[0].name}
            </Badge>
          )}
          <p className="text-xl font-semibold text-ink line-clamp-2 leading-snug">
            {title}
          </p>
          <p className="text-sm text-muted-brand line-clamp-2">{excerpt}</p>
          <p className="text-xs text-muted-brand">
            {dateStr}
            {readingTimeMin != null && readingTimeMin > 0 && (
              <> · {readingTimeMin} นาที</>
            )}
            {authorName && <> · {authorName}</>}
          </p>
        </div>
      </Link>
    </article>
  );
}
