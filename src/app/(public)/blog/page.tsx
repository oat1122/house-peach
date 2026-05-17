import Link from 'next/link';
import type { Metadata } from 'next';
import { z } from 'zod';
import { eq, or } from 'drizzle-orm';

import { db } from '@/lib/db';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { listPublishedPosts } from '@/lib/services/post';
import { env } from '@/env';
import { FadeUp } from '@/components/motion/FadeUp';
import type { PostCardPost } from '@/components/public/blog/PostCard';
import { PostsListing } from '@/components/public/blog/PostsListing';

/**
 * Force per-request rendering. Why not `revalidate = 60`?
 *   /blog accepts `?tag=<slug>` + `?page=N` searchParams which produce
 *   distinct content per combination. Next 16's router cache keys RSC
 *   payloads primarily by pathname, so with ISR + searchParams the soft
 *   navigation between `/blog?tag=a` ↔ `/blog?tag=b` can serve the stale
 *   payload (cards stay on the previous tag even though the URL + active
 *   filter chip update). force-dynamic re-renders fresh on every request
 *   — correct for a filter-driven listing.
 *
 *   Detail routes (`/blog/[slug]`) keep `revalidate = 60` because their
 *   cache key includes the slug, so each post is cached independently.
 */
export const dynamic = 'force-dynamic';

// ── Search-params schema ───────────────────────────────────────────────────────

const SearchParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  tag: z.string().max(80).optional().catch(undefined),
});

// ── SEO ───────────────────────────────────────────────────────────────────────

// ≥ 80 chars per `seo.md` description floor — extended with concrete topics
// (ห้องนั่งเล่น / ห้องนอน / Japandi) for both length and long-tail keywords.
const META_DESCRIPTION =
  'แรงบันดาลใจ เทคนิค และเรื่องราวเบื้องหลัง house-peach — บทความเกี่ยวกับการตกแต่งบ้านสไตล์อบอุ่น ห้องนั่งเล่น ห้องนอน และมุมโปรดในบ้านของคุณ';

export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const rawParams = await props.searchParams;
  const parsed = SearchParams.safeParse(
    Object.fromEntries(
      Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
    ),
  );
  // Both tag-filtered AND paginated (page > 1) URLs should noindex — they
  // are derivative views of /blog and Google treats them as duplicates.
  const shouldNoindex =
    parsed.success && (!!parsed.data.tag || parsed.data.page > 1);
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

  return {
    title: 'บทความ',
    description: META_DESCRIPTION,
    alternates: { canonical: `${origin}/blog` },
    ...(shouldNoindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PER_PAGE = 9;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BlogPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const flattened = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = SearchParams.safeParse(flattened);
  const params = parsed.success ? parsed.data : { page: 1, tag: undefined };

  const [{ posts, total, hasMore }, postTags] = await Promise.all([
    listPublishedPosts({
      page: params.page,
      perPage: PER_PAGE,
      tagSlug: params.tag,
    }),
    db
      .select({ id: tagsTable.id, slug: tagsTable.slug, name: tagsTable.name })
      .from(tagsTable)
      .where(or(eq(tagsTable.kind, 'post'), eq(tagsTable.kind, 'both')))
      .orderBy(tagsTable.sort, tagsTable.name),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const activeTag = params.tag;
  const isFiltered = !!activeTag;

  // Build PostCardPost shape — tags field not returned by listPublishedPosts,
  // so we pass empty array; tag chips in listing come from meta only
  const cards: PostCardPost[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    publishedAt: p.publishedAt,
    readingTimeMin: p.readingTimeMin,
    authorName: p.authorName,
    tags: [],
    coverPath: p.coverPath,
    coverAlt: p.coverAlt,
  }));

  // Resolve active tag name so the count label can show the human label,
  // not the URL slug (slugs are kebab-case ASCII).
  const activeTagName =
    activeTag != null
      ? (postTags.find((t) => t.slug === activeTag)?.name ?? activeTag)
      : null;

  const countLabel = isFiltered
    ? `บทความ ${total} เรื่อง · ${activeTagName}`
    : `บทความ ${total} เรื่อง`;

  return (
    <>
      {/* Lead block — editorial parity with /works (eyebrow H1 + lead + count) */}
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <FadeUp>
          <div className="pt-10 md:pt-12">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-ink break-words">
              บทความ · Journal
            </h1>
            <p className="text-base md:text-lg text-muted-brand leading-[1.65] max-w-prose mt-3 break-words">
              แรงบันดาลใจ เทคนิค และเรื่องราวเบื้องหลัง house-peach —
              บทความเกี่ยวกับการตกแต่งบ้านสไตล์อบอุ่น ห้องนั่งเล่น ห้องนอน และมุมโปรดในบ้านของคุณ
            </p>
            <p className="text-xs uppercase tracking-widest text-muted-brand mt-4">
              {countLabel}
            </p>
          </div>
        </FadeUp>
      </div>

      {/* Tag filter bar — sticky below sticky header (parity with WorksFilterBar:
           bg-bg/90, --header-h offset, z-10). Blog uses chips (visual filter
           pattern for many tag values) vs. works which uses Select dropdowns. */}
      {postTags.length > 0 && (
        <div className="mt-6">
          <div className="sticky top-[var(--header-h,56px)] z-10 bg-bg/90 backdrop-blur-sm border-b border-line">
            <div className="mx-auto max-w-6xl px-4 md:px-6 py-3">
              <div
                className="flex gap-2 overflow-x-auto scrollbar-none"
                role="group"
                aria-label="กรองตามหมวดหมู่"
              >
                {/* prefetch={false} on each filter link: Next 16's router cache
                    keys prefetched RSC payloads by pathname segment — with
                    `?tag=` searchParams that key collides across filter
                    variants, so a prefetched `/blog?tag=A` payload can serve
                    when the user clicks `?tag=B`. Disabling prefetch forces a
                    fresh server-render on every chip click. */}
                <Link
                  href="/blog"
                  prefetch={false}
                  className={[
                    'flex-shrink-0 inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
                    !activeTag
                      ? 'bg-ink text-bg'
                      : 'bg-bg2 text-ink hover:bg-line',
                  ].join(' ')}
                >
                  ทั้งหมด
                </Link>
                {postTags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/blog?tag=${encodeURIComponent(tag.slug)}`}
                    prefetch={false}
                    className={[
                      'flex-shrink-0 inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
                      activeTag === tag.slug
                        ? 'bg-ink text-bg'
                        : 'bg-bg2 text-ink hover:bg-line',
                    ].join(' ')}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listing — hero (first) + divider + 2/3-col grid for the rest.
          Mirrors WorksListing. The `<main>` landmark comes from layout;
          PostsListing renders into a plain <div>. mt-10 pb-16 mirrors the
          /works listing wrapper. */}
      <div className="mx-auto max-w-6xl px-4 md:px-6 mt-10 pb-16">
        {/* key forces a fresh React tree when the filter changes — kills any
            residual Stagger/FadeUp animation state from the previous filter
            and guarantees the new cards mount from their initial state. */}
        <PostsListing
          key={`tag-${activeTag ?? 'all'}-page-${params.page}`}
          posts={cards}
          total={total}
          isFiltered={isFiltered}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            aria-label="การแบ่งหน้า"
            className="mt-12 flex flex-wrap items-center justify-center gap-3 md:gap-4"
          >
            {params.page > 1 ? (
              <Link
                href={buildPageHref(params.page - 1, activeTag)}
                className="inline-flex items-center min-h-[44px] px-4 text-sm rounded-md border border-line text-ink hover:bg-bg2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                ← ก่อนหน้า
              </Link>
            ) : (
              <span className="inline-flex items-center min-h-[44px] px-4 text-sm rounded-md border border-line text-muted-brand opacity-50 cursor-not-allowed">
                ← ก่อนหน้า
              </span>
            )}

            <span className="text-sm text-muted-brand order-first w-full text-center md:order-none md:w-auto">
              หน้า {params.page} จาก {totalPages}
            </span>

            {hasMore ? (
              <Link
                href={buildPageHref(params.page + 1, activeTag)}
                className="inline-flex items-center min-h-[44px] px-4 text-sm rounded-md border border-line text-ink hover:bg-bg2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                ถัดไป →
              </Link>
            ) : (
              <span className="inline-flex items-center min-h-[44px] px-4 text-sm rounded-md border border-line text-muted-brand opacity-50 cursor-not-allowed">
                ถัดไป →
              </span>
            )}
          </nav>
        )}
      </div>
    </>
  );
}

function buildPageHref(page: number, tag?: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (tag) params.set('tag', tag);
  const qs = params.toString();
  return qs ? `/blog?${qs}` : '/blog';
}
