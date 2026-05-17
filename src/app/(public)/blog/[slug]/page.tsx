import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { getPublishedPostBySlug, listRelatedPosts, listRecentPosts } from '@/lib/services/post';
import { compileWorkMdx } from '@/lib/mdx/compile';
import { extractHeadings } from '@/lib/utils/extractHeadings';
import { estimateWordCount } from '@/lib/utils/wordCount';
import { buildPostMetadata } from '@/lib/seo/metadata';
import { buildBlogPostingLd, buildPostBreadcrumbLd } from '@/lib/seo/jsonld';
import { env } from '@/env';
import { ReadingProgress } from '@/components/motion/ReadingProgress';
import { FadeUp } from '@/components/motion/FadeUp';
import { PostHero } from '@/components/public/blog/PostHero';
import { PostContent } from '@/components/public/blog/PostContent';
import { PostFooter } from '@/components/public/blog/PostFooter';
import { TableOfContents } from '@/components/public/blog/TableOfContents';
import { CtaCard } from '@/components/public/blog/CtaCard';
import { RecentPostsCard } from '@/components/public/blog/RecentPostsCard';
import { RelatedPostsSection } from '@/components/public/blog/RelatedPostsSection';
import { BackToTop } from '@/components/public/blog/BackToTop';
import type { PostCardPost } from '@/components/public/blog/PostCard';

export const revalidate = 60;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Decode + NFC-normalize an incoming dynamic-route slug. Mirrors the same
 * pattern used in works/[slug]/page.tsx — idempotent on already-decoded input.
 */
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw).normalize('NFC');
  } catch {
    return raw.normalize('NFC');
  }
}

// ── generateMetadata ──────────────────────────────────────────────────────────

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPublishedPostBySlug(decodeSlug(slug));
  if (!post) {
    return { title: 'ไม่พบบทความ', robots: { index: false } };
  }
  return buildPostMetadata({
    post,
    coverPath: post.coverPath,
    authorName: post.authorName,
    tagNames: post.tagNames,
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = await getPublishedPostBySlug(decodeSlug(slug));
  if (!post) notFound();

  // ── Parallel data fetch ────────────────────────────────────────────────────
  const [compiledMdx, [relatedPosts, recentPosts, tagRows]] = await Promise.all([
    compileWorkMdx(post.bodyMdx),
    Promise.all([
      listRelatedPosts({ id: post.id, tagIds: post.tagIds }, 3),
      listRecentPosts({ excludeId: post.id, limit: 4 }),
      post.tagIds.length > 0
        ? db
            .select({ id: tagsTable.id, slug: tagsTable.slug, name: tagsTable.name })
            .from(tagsTable)
            .where(inArray(tagsTable.id, post.tagIds))
        : Promise.resolve<{ id: number; slug: string; name: string }[]>([]),
    ]),
  ]);

  // Extract headings for TOC (server-side — no DOM traversal on client)
  const headings = extractHeadings(post.bodyMdx);

  // Use tag rows for proper slugs (enables correct filter links in meta row)
  const tags = tagRows.map((t) => ({ name: t.name, slug: t.slug }));

  // Shape data for child components
  const heroPost = {
    title: post.title,
    excerpt: post.excerpt,
    coverPath: post.coverPath,
    coverAlt: post.coverAlt,
    publishedAt: post.publishedAt ?? new Date(),
    readingTimeMin: post.readingTimeMin,
    author: { name: post.authorName ?? 'house-peach' },
    tags,
  };

  // Map service result to PostCardPost shape
  const toCardPost = (p: typeof relatedPosts[number]): PostCardPost => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    publishedAt: p.publishedAt,
    readingTimeMin: p.readingTimeMin,
    authorName: p.authorName,
    tags: [],
    coverPath: p.coverPath,
    coverAlt: p.coverAlt,
  });

  const relatedCards = relatedPosts.map(toCardPost);
  const recentCards = recentPosts.map(toCardPost);

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const postUrl = `${origin}/blog/${encodeURIComponent(post.slug)}`;
  const coverUrl = post.coverPath ? `${origin}${post.coverPath}` : null;

  const blogPostingLd = buildBlogPostingLd({
    post,
    coverUrl,
    authorName: post.authorName,
    url: postUrl,
    wordCount: estimateWordCount(post.bodyMdx),
  });
  const breadcrumbLd = buildPostBreadcrumbLd(post);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Reading progress bar — fixed top */}
      <ReadingProgress />

      {/* Hero */}
      <PostHero post={heroPost} />

      {/* Body grid: article + sidebar */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-12 pb-24">
        {/* Mobile: TOC inline above article */}
        {headings.length > 0 && (
          <div className="lg:hidden mb-8">
            <TableOfContents headings={headings} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-16 items-start">
          {/* Main content — `div`, not `main`. The layout already wraps the
              page in <main>; nesting <main> would emit two main landmarks. */}
          <div>
            <PostContent compiledMdx={compiledMdx} />
            <PostFooter url={postUrl} title={post.title} />

            {/* Mobile: sidebar cards reflow below footer */}
            <div className="lg:hidden mt-8 space-y-4">
              <CtaCard />
              {recentCards.length > 0 && (
                <RecentPostsCard posts={recentCards} />
              )}
            </div>
          </div>

          {/* Sidebar — desktop only */}
          <aside
            className="hidden lg:flex flex-col gap-4 sticky top-[6.5rem] max-h-[calc(100vh-7rem)] min-h-0"
            aria-label="แถบข้างข้อมูล"
          >
            {headings.length > 0 && (
              <TableOfContents headings={headings} />
            )}
            <FadeUp>
              <CtaCard />
            </FadeUp>
            {recentCards.length > 0 && (
              <FadeUp delay={0.05}>
                <RecentPostsCard posts={recentCards} />
              </FadeUp>
            )}
          </aside>
        </div>
      </div>

      {/* Related posts section */}
      <RelatedPostsSection posts={relatedCards} />

      {/* Back-to-top FAB */}
      <BackToTop />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
