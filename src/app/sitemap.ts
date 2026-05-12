import 'server-only';
import type { MetadataRoute } from 'next';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { works } from '@/lib/db/schema/works';
import { env } from '@/env';

/**
 * Sitemap for crawlers. Includes only `published` works — drafts and archived
 * are excluded (archived pages still render with `noindex`, so omitting them
 * from sitemap is consistent).
 *
 * `bumpWorkPaths()` in `src/lib/cache-tags.ts` calls
 * `revalidatePath('/sitemap.xml')` on every work mutation, so the sitemap
 * stays current within the next request after admin edits.
 *
 * Listing routes (/, /works, /blog) are emitted as static entries even if
 * not all are built yet — Google tolerates 404s on listed URLs (they just
 * drop from index). When those routes ship the entries are already in
 * place; remove the comment guards once they exist.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

  const rows = await db
    .select({
      slug: works.slug,
      updatedAt: works.updatedAt,
      publishedAt: works.publishedAt,
    })
    .from(works)
    .where(eq(works.status, 'published'))
    .orderBy(desc(works.publishedAt));

  // Percent-encode the slug to match the canonical URL form emitted by
  // buildWorkMetadata. Thai slugs render the same characters when decoded,
  // and crawlers correctly de-duplicate, but staying byte-identical with
  // the canonical avoids any ambiguity.
  const workEntries: MetadataRoute.Sitemap = rows.map((r) => ({
    url: `${origin}/works/${encodeURIComponent(r.slug)}`,
    lastModified: r.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    { url: `${origin}/`, changeFrequency: 'weekly', priority: 1.0 },
    ...workEntries,
  ];
}
