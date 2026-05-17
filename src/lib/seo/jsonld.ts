import 'server-only';

import { env } from '@/env';
import type { PostRow } from '@/lib/db/schema/posts';
import type { WorkRow } from '@/lib/db/schema/works';

type CreativeWorkLdInput = {
  work: WorkRow;
  coverPath?: string | null;
  galleryPaths?: string[];
  tagNames?: string[];
};

/**
 * Builds a `schema.org/CreativeWork` JSON-LD object for a portfolio work.
 *
 * Rules from [`.claude/rules/seo.md` § Structured data]:
 *   - JSON-LD must reflect content faithfully — Google penalises misleading
 *     markup. We only emit fields we can verify against the DB row.
 *   - Image URLs are absolute (origin from env.NEXT_PUBLIC_SITE_URL).
 *   - `dateCreated` uses `yearCompleted` if present, otherwise omits.
 */
export function buildCreativeWorkLd(input: CreativeWorkLdInput) {
  const { work, coverPath, galleryPaths = [], tagNames = [] } = input;
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const allImages = [coverPath, ...galleryPaths]
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .map((p) => `${origin}${p}`);

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: work.title,
    description: work.summary,
    url: `${origin}/works/${encodeURIComponent(work.slug)}`,
    creator: { '@type': 'Organization', name: 'house-peach' },
    about: work.roomType,
    // dateModified is a freshness signal Google uses for creative content.
    // `works.updated_at` auto-updates on every row write, so this stays
    // accurate without explicit caller work.
    dateModified: work.updatedAt.toISOString(),
  };

  if (allImages.length > 0) ld.image = allImages;
  if (work.yearCompleted) {
    ld.dateCreated = `${work.yearCompleted}-01-01`;
  }
  if (work.publishedAt) {
    ld.datePublished = work.publishedAt.toISOString();
  }
  if (work.location) {
    ld.contentLocation = { '@type': 'Place', name: work.location };
  }
  if (tagNames.length > 0) {
    ld.keywords = tagNames.join(', ');
  }
  if (work.style) {
    ld.genre = work.style;
  }

  return ld;
}

type BlogPostingLdInput = {
  post: PostRow;
  coverUrl?: string | null;
  authorName?: string | null;
  url: string;
  wordCount?: number | null;
};

/**
 * Builds a `schema.org/BlogPosting` JSON-LD object for a blog post.
 *
 * Returns a plain object — NOT a stringified `<script>` tag. The RSC page
 * is responsible for rendering `<script type="application/ld+json">` with
 * `JSON.stringify()`, matching the pattern used by `buildCreativeWorkLd`.
 *
 * `timeRequired` uses ISO 8601 duration format (PT<n>M) derived from
 * `readingTimeMin`. Omitted when null so Google doesn't receive a zero/null
 * value which could produce unexpected rich snippet behaviour.
 */
export function buildBlogPostingLd(input: BlogPostingLdInput) {
  const { post, coverUrl, authorName, url, wordCount } = input;
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    publisher: {
      '@type': 'Organization',
      name: 'house-peach',
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/og/logo.png`,
      },
    },
    dateModified: post.updatedAt.toISOString(),
  };

  // Google Article rich-result requires `image`. Always emit — fall back to
  // the brand logo when a post has no cover so the BlogPosting validates.
  ld.image = coverUrl ? [coverUrl] : [`${origin}/og/logo.png`];
  // `datePublished` is also a Google-required field. Fall back to updatedAt
  // for the edge case of an archived post with publishedAt cleared.
  ld.datePublished = (post.publishedAt ?? post.updatedAt).toISOString();
  if (authorName) {
    ld.author = { '@type': 'Person', name: authorName };
  }
  if (wordCount != null && wordCount > 0) ld.wordCount = wordCount;
  if (post.readingTimeMin != null && post.readingTimeMin > 0) {
    ld.timeRequired = `PT${post.readingTimeMin}M`;
  }

  return ld;
}

/**
 * BreadcrumbList — `/` → `/blog` → `/blog/<slug>` (current post).
 */
export function buildPostBreadcrumbLd(post: Pick<PostRow, 'title' | 'slug'>) {
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'หน้าแรก',
        item: `${origin}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'บทความ',
        item: `${origin}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${origin}/blog/${encodeURIComponent(post.slug)}`,
      },
    ],
  };
}

/**
 * BreadcrumbList — `/` → `/works` → `/works/<slug>` (current).
 */
export function buildWorkBreadcrumbLd(work: WorkRow) {
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'หน้าแรก',
        item: `${origin}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'ผลงาน',
        item: `${origin}/works`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: work.title,
        // Google Rich Results requires `item` on every position. Without it
        // the entire BreadcrumbList is rejected → no sitelinks breadcrumb
        // enrichment in SERP.
        item: `${origin}/works/${encodeURIComponent(work.slug)}`,
      },
    ],
  };
}
