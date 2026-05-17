import Link from 'next/link';
import type { Metadata } from 'next';
import { z } from 'zod';
import { eq, or } from 'drizzle-orm';

import { db } from '@/lib/db';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { listPublishedPosts } from '@/lib/services/post';
import { env } from '@/env';
import { FadeUp } from '@/components/motion/FadeUp';
import { PostCard } from '@/components/public/blog/PostCard';
import type { PostCardPost } from '@/components/public/blog/PostCard';

export const revalidate = 60;

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

  return (
    <>
      {/* Page header */}
      <div className="bg-bg pt-12 pb-6">
        <FadeUp className="max-w-6xl mx-auto px-4 md:px-6">
          <h1 className="font-serif text-4xl font-bold text-ink">
            บทความ · Journal
          </h1>
          <p className="text-lg text-muted-brand mt-2">
            แรงบันดาลใจ เทคนิค และเรื่องราวเบื้องหลัง house-peach
          </p>
        </FadeUp>
      </div>

      {/* Tag filter bar */}
      {postTags.length > 0 && (
        <div className="sticky top-[var(--header-h,64px)] z-10 bg-bg/80 backdrop-blur-sm border-b border-line">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
            <div
              className="flex gap-2 overflow-x-auto scrollbar-none"
              role="group"
              aria-label="กรองตามหมวดหมู่"
            >
              <Link
                href="/blog"
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
      )}

      {/* Post grid — `div`, not `main`. Layout already provides the <main>
          landmark; nesting would emit two main elements. */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {cards.length === 0 ? (
          <div className="text-center py-20 text-muted-brand">
            <p className="text-lg font-semibold">ยังไม่มีบทความในหมวดนี้</p>
            <p className="text-sm mt-2">
              ลองเปลี่ยนตัวกรอง หรือ{' '}
              <Link href="/blog" className="text-brand-accent underline">
                ดูทั้งหมด
              </Link>
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            aria-label={`บทความ ${total} รายการ`}
          >
            {cards.map((post, i) => (
              <PostCard key={post.slug} post={post} priority={i === 0} />
            ))}
          </div>
        )}

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
