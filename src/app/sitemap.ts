import 'server-only';
import type { MetadataRoute } from 'next';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema/posts';
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

  // Fetch published works and posts in parallel — both are needed before we
  // can assemble the sitemap and there is no dependency between them.
  const [workRows, postRows] = await Promise.all([
    db
      .select({
        slug: works.slug,
        updatedAt: works.updatedAt,
      })
      .from(works)
      .where(eq(works.status, 'published'))
      .orderBy(desc(works.publishedAt)),
    db
      .select({
        slug: posts.slug,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.publishedAt)),
  ]);

  // Percent-encode slugs to match the canonical URL form emitted by
  // buildWorkMetadata / buildPostMetadata. Thai slugs render the same
  // characters when decoded; staying byte-identical with the canonical
  // avoids crawler de-duplication ambiguity.
  const workEntries: MetadataRoute.Sitemap = workRows.map((r) => ({
    url: `${origin}/works/${encodeURIComponent(r.slug)}`,
    lastModified: r.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = postRows.map((r) => ({
    url: `${origin}/blog/${encodeURIComponent(r.slug)}`,
    lastModified: r.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    { url: `${origin}/`, changeFrequency: 'weekly', priority: 1.0 },
    // Listing routes — static entries. `lastModified` omitted; Google
    // tolerates absent lastmod and these listings change on every publish.
    { url: `${origin}/works`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${origin}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...workEntries,
    ...postEntries,
  ];
}
