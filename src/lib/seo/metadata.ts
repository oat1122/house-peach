import 'server-only';
import type { Metadata } from 'next';

import { env } from '@/env';
import type { WorkRow } from '@/lib/db/schema/works';

/**
 * Build Next.js `Metadata` for a work detail route. Honors
 * `.claude/rules/seo.md` § Title format ("<page> — house-peach"), description
 * 80-160 chars guidance, OG type=website (CreativeWork isn't OG-native), and
 * archived works → noindex.
 */
export function buildWorkMetadata(params: {
  work: WorkRow;
  coverPath: string | null;
}): Metadata {
  const { work, coverPath } = params;
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const canonical = `${origin}/works/${work.slug}`;
  const ogImage = coverPath ? `${origin}${coverPath}` : undefined;
  const robots =
    work.status === 'archived'
      ? { index: false, follow: true }
      : work.status === 'draft'
        ? { index: false, follow: false }
        : undefined;

  return {
    title: `${work.title} — house-peach`,
    description: work.summary,
    alternates: { canonical },
    openGraph: {
      title: work.title,
      description: work.summary,
      url: canonical,
      type: 'website',
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: work.title,
      description: work.summary,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(robots ? { robots } : {}),
  };
}
