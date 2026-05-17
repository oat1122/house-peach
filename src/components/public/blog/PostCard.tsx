import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, FileText, User } from 'lucide-react';

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
  variant?: 'default' | 'compact' | 'related' | 'hero';
  priority?: boolean;
};

/**
 * Blog post card — 4 display variants:
 * - `hero`:    anchor card on /blog listing — full-bleed cover on mobile,
 *              2-col split on desktop. Mirrors WorkCard hero for editorial parity.
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

  // ── Hero variant ─────────────────────────────────────────────────────────
  // Mirrors WorkCard hero exactly so /blog and /works share the editorial
  // anchor pattern. Mobile: full-bleed cover, no radius, text below.
  // Desktop: 3fr cover + 2fr meta column, centered vertically.
  if (variant === 'hero') {
    const eyebrowParts = [
      tags[0]?.name ?? null,
      dateStr,
    ].filter(Boolean);
    const eyebrow = eyebrowParts.join(' · ');
    const mobileMetaParts = [
      readingTimeMin != null && readingTimeMin > 0
        ? `${readingTimeMin} นาที`
        : null,
      authorName,
    ].filter(Boolean);
    const mobileMeta = mobileMetaParts.join(' · ');

    return (
      <article>
        {/* No aria-label — the visible <h2> inside is the accessible name.
             An aria-label would shadow the eyebrow, excerpt, and meta text. */}
        <Link
          href={href}
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-md"
        >
          <div className="md:grid md:grid-cols-[3fr_2fr] md:gap-8 md:items-center">
            {/* Image column — full-bleed on mobile, rounded inside grid on desktop */}
            <div className="relative w-full aspect-[16/10] -mx-4 md:mx-0 overflow-hidden md:rounded-md bg-bg2">
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText
                    size={48}
                    className="text-muted-brand"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            {/* Text column */}
            <div className="px-4 md:px-0 mt-4 md:mt-0 md:py-4 min-w-0">
              {eyebrow && (
                <p className="text-[11px] uppercase tracking-widest text-muted-brand break-words">
                  {eyebrow}
                </p>
              )}
              {/* h2 — listing page h1 is "บทความ"; hero card is the next heading
                   level. Default cards use <p> (not a section heading). */}
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink mt-2 leading-[1.2] group-hover:text-brand-accent transition-colors line-clamp-3 break-words">
                {title}
              </h2>
              <p className="text-sm md:text-base text-muted-brand leading-[1.65] mt-2 line-clamp-3 break-words">
                {excerpt}
              </p>

              {/* Mobile: inline meta line */}
              {mobileMeta && (
                <p className="md:hidden text-xs text-ink font-medium mt-3 break-words">
                  {mobileMeta}
                </p>
              )}

              {/* Desktop: structured meta cells with icons */}
              <div className="hidden md:flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-brand">
                {readingTimeMin != null && readingTimeMin > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} aria-hidden="true" className="flex-none" />
                    <span>{readingTimeMin} นาที</span>
                  </span>
                )}
                {dateStr && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar
                      size={14}
                      aria-hidden="true"
                      className="flex-none"
                    />
                    <time
                      dateTime={publishedAt?.toISOString()}
                      className="break-words"
                    >
                      {dateStr}
                    </time>
                  </span>
                )}
                {authorName && (
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <User size={14} aria-hidden="true" className="flex-none" />
                    <span className="break-words min-w-0">{authorName}</span>
                  </span>
                )}
              </div>

              <p className="hidden md:block text-sm text-brand-accent mt-6">
                อ่านบทความนี้ →
              </p>
            </div>
          </div>
        </Link>
      </article>
    );
  }

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
          <p className="text-sm font-semibold text-ink line-clamp-2 leading-snug break-words">
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
            <h3 className="text-lg font-semibold text-ink line-clamp-2 leading-snug break-words">
              {title}
            </h3>
            <p className="text-sm text-muted-brand line-clamp-2 break-words">{excerpt}</p>
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

  // Default variant — sized to fit 2-col mobile / 3-col desktop (parity with
  // WorkCard regular). Tag chip is rendered as compact uppercase eyebrow text
  // (not a Badge) so density matches works at narrow widths.
  const eyebrowParts = [
    tags[0]?.name ?? null,
    dateStr,
  ].filter(Boolean);
  const defaultEyebrow = eyebrowParts.join(' · ');
  const metaLineParts = [
    readingTimeMin != null && readingTimeMin > 0
      ? `${readingTimeMin} นาที`
      : null,
    authorName,
  ].filter(Boolean);
  const metaLine = metaLineParts.join(' · ');

  return (
    <article>
      <Link
        href={href}
        className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
      >
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-md bg-bg2">
          {coverPath ? (
            <Image
              src={coverPath}
              alt={resolvedAlt}
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 380px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText size={32} className="text-muted-brand" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="mt-3 min-w-0">
          {defaultEyebrow && (
            <p className="text-[11px] uppercase tracking-widest text-muted-brand break-words">
              {defaultEyebrow}
            </p>
          )}
          <p className="text-base font-semibold text-ink mt-1 line-clamp-2 group-hover:text-brand-accent transition-colors break-words">
            {title}
          </p>
          {metaLine && (
            <p className="text-xs text-muted-brand mt-1 break-words">
              {metaLine}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
