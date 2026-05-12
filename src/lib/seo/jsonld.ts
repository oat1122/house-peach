import 'server-only';

import { env } from '@/env';
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
