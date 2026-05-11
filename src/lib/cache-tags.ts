import 'server-only';
import { revalidateTag } from 'next/cache';

/**
 * Wrapper around Next 16's two-arg revalidateTag. We default to `'max'` for
 * stale-while-revalidate semantics — the call returns immediately and the next
 * request to a tagged page triggers regeneration in the background.
 */
export function bumpTag(tag: string) {
  revalidateTag(tag, 'max');
}

export const tags = {
  posts: 'posts',
  works: 'works',
  sitemap: 'sitemap',
  post: (id: number) => `post:${id}`,
  work: (id: number) => `work:${id}`,
} as const;
