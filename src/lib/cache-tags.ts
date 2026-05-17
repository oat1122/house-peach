import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Wrapper around Next 16's two-arg revalidateTag. We default to `'max'` for
 * stale-while-revalidate semantics — the call returns immediately and the next
 * request to a tagged page triggers regeneration in the background.
 *
 * Note: tag-based invalidation only fires for data fetched inside
 * `unstable_cache({ tags })` or `fetch({ next: { tags } })`. Pages that read
 * Drizzle directly (the current shape of this project) don't subscribe to
 * tags, so these calls are effectively no-ops today — kept as
 * forward-compat in case we wrap reads in `unstable_cache` later. The
 * actual ISR bust happens via `bumpWorkPaths()` / `bumpPostPaths()` below.
 */
export function bumpTag(tag: string) {
  revalidateTag(tag, 'max');
}

/**
 * Bust the public works pages on Next's ISR cache. Called from every
 * service-layer mutation that touches a work or work_image so admins see
 * their save immediately instead of waiting for the 60s revalidate window.
 *
 * Route-segment form (`'/works/[slug]', 'page'`) busts all detail-page
 * cache entries at once — no per-slug lookup needed. Per Next 16 docs the
 * revalidation only fires on next visit (lazy), so blanket-busting is cheap.
 */
export function bumpWorkPaths() {
  revalidatePath('/works/[slug]', 'page');
  revalidatePath('/works');
  // Home page reads listHomeFeed() — bust here so admin edits to home_section
  // / publish status take effect immediately instead of waiting 60s.
  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  revalidatePath('/llms.txt');
  revalidatePath('/llms-full.txt');
}

/** Same idea as bumpWorkPaths but for blog posts. Wired in once /blog ships. */
export function bumpPostPaths() {
  revalidatePath('/blog/[slug]', 'page');
  revalidatePath('/blog');
  revalidatePath('/sitemap.xml');
  revalidatePath('/llms.txt');
  revalidatePath('/llms-full.txt');
}

export const tags = {
  posts: 'posts',
  works: 'works',
  sitemap: 'sitemap',
  post: (id: number) => `post:${id}`,
  work: (id: number) => `work:${id}`,
} as const;

/**
 * Full cache bust for a single post mutation. Combines tag-based
 * revalidation (forward-compat for future `unstable_cache` wrapping) with
 * path-based ISR busting (the actual effective mechanism today).
 *
 * Call this from every service function that mutates a post row.
 * Mirrors the local `bumpWork(id)` pattern in `lib/services/work.ts`.
 */
export function bumpPostById(id: number) {
  revalidateTag(tags.posts, 'max');
  revalidateTag(tags.post(id), 'max');
  bumpPostPaths();
}

/**
 * Full cache bust for a single work mutation. Mirrors `bumpPostById` — keeps
 * the per-domain invariant in one place rather than duplicating the helper
 * across `lib/services/work.ts` + `lib/services/workImage.ts`.
 */
export function bumpWorkById(id: number) {
  revalidateTag(tags.works, 'max');
  revalidateTag(tags.work(id), 'max');
  revalidateTag(tags.sitemap, 'max');
  bumpWorkPaths();
}

/**
 * Cache bust for any tag mutation (create / update / delete).
 *
 * Tags are shared between blog + works, so a single rename/delete may show
 * stale data on either domain's listings and detail pages. We err on the
 * side of busting both — the cost is one extra ISR regeneration on next
 * visit; the alternative (stale tag names rendered into already-cached
 * pages) is worse SEO + worse UX.
 *
 * Call from every service function in `lib/services/tag.ts`.
 */
export function bumpTags() {
  revalidateTag(tags.posts, 'max');
  revalidateTag(tags.works, 'max');
  bumpPostPaths();
  bumpWorkPaths();
}
