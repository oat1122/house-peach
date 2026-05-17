import 'server-only';
import type { Metadata } from 'next';

import { env } from '@/env';
import type { PostRow } from '@/lib/db/schema/posts';
import type { WorkRow } from '@/lib/db/schema/works';

const ROOM_TYPE_LABEL_FOR_SEO: Record<string, string> = {
  living: 'ห้องนั่งเล่น',
  bedroom: 'ห้องนอน',
  kitchen: 'ห้องครัว',
  bathroom: 'ห้องน้ำ',
  office: 'ห้องทำงาน',
  outdoor: 'พื้นที่ภายนอก',
  full_house: 'ทั้งบ้าน',
  other: 'อื่น ๆ',
};

/**
 * Pad a too-short summary into a meta description that meets Google's
 * 80–160 char sweet spot. Short summaries get supplemented with the work's
 * room-type + style so Google has enough text to use the description as-is
 * instead of synthesizing one from body text (which produces unpredictable
 * SERP snippets).
 *
 * Long summaries are returned untouched — zod already caps `work.summary`
 * at 280 chars in `WorkInsert`, so no truncation needed here.
 */
function ensureDescriptionFloor(work: WorkRow, min = 80): string {
  if (work.summary.length >= min) return work.summary;
  const room = ROOM_TYPE_LABEL_FOR_SEO[work.roomType] ?? work.roomType;
  const padding = work.style
    ? ` · ${room} สไตล์ ${work.style} · บริการตกแต่งบ้านโดย house-peach`
    : ` · ${room} · บริการตกแต่งบ้านโดย house-peach`;
  return (work.summary + padding).slice(0, 160);
}

/**
 * Build Next.js `Metadata` for a work detail route. Honors
 * `.claude/rules/seo.md` § Title format ("<page> — house-peach"), description
 * 80-160 chars, OG `type='article'` (portfolio works are CreativeWorks but
 * the closest OG-native type that surfaces publishedTime/modifiedTime is
 * article), and archived works → noindex.
 *
 * Canonical URL uses `encodeURIComponent` on the slug so the byte form
 * matches what HTTP clients send on the wire. Both the canonical link tag
 * and the JSON-LD `url` field use the same encoded form for consistency —
 * see `jsonld.ts`.
 */
export function buildWorkMetadata(params: {
  work: WorkRow;
  coverPath: string | null;
}): Metadata {
  const { work, coverPath } = params;
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const canonical = `${origin}/works/${encodeURIComponent(work.slug)}`;
  const ogImage = coverPath ? `${origin}${coverPath}` : undefined;
  const description = ensureDescriptionFloor(work);
  const robots =
    work.status === 'archived'
      ? { index: false, follow: true }
      : work.status === 'draft'
        ? { index: false, follow: false }
        : undefined;

  return {
    // Page-name only — root layout's `title.template` adds the
    // " — house-peach" suffix. See src/app/layout.tsx.
    title: work.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: work.title,
      description,
      url: canonical,
      type: 'article',
      ...(work.publishedAt
        ? { publishedTime: work.publishedAt.toISOString() }
        : {}),
      modifiedTime: work.updatedAt.toISOString(),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: work.title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(robots ? { robots } : {}),
  };
}

/**
 * Pad a too-short excerpt into a meta description meeting the 80-160 char
 * target. Long excerpts are returned as-is (zod caps at 280 chars in
 * PostInsert, and Google truncates at ~160 anyway).
 */
function ensurePostDescriptionFloor(post: PostRow, min = 80): string {
  if (post.excerpt.length >= min) return post.excerpt;
  const padding = ` · บทความเกี่ยวกับการตกแต่งบ้านโดย house-peach`;
  return (post.excerpt + padding).slice(0, 160);
}

/**
 * Build Next.js `Metadata` for a blog post detail route.
 * Mirrors `buildWorkMetadata` conventions: title template suffix from root
 * layout, description 80-160 chars, OG `type='article'` with all article-
 * specific time fields, and archived posts → `noindex, follow`.
 *
 * Canonical and OG URL use `encodeURIComponent(slug)` to stay byte-identical
 * with what HTTP clients send on the wire for non-ASCII slugs.
 */
export function buildPostMetadata(params: {
  post: PostRow;
  coverPath: string | null;
  authorName?: string | null;
  tagNames?: string[];
}): Metadata {
  const { post, coverPath, authorName, tagNames = [] } = params;
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const canonical = `${origin}/blog/${encodeURIComponent(post.slug)}`;
  const ogImage = coverPath ? `${origin}${coverPath}` : undefined;
  const description = ensurePostDescriptionFloor(post);
  const robots =
    post.status === 'archived'
      ? { index: false, follow: true }
      : post.status === 'draft'
        ? { index: false, follow: false }
        : undefined;

  return {
    title: post.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      type: 'article',
      ...(post.publishedAt
        ? { publishedTime: post.publishedAt.toISOString() }
        : {}),
      modifiedTime: post.updatedAt.toISOString(),
      ...(authorName ? { authors: [authorName] } : {}),
      ...(tagNames.length > 0 ? { tags: tagNames } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: post.title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(robots ? { robots } : {}),
  };
}
