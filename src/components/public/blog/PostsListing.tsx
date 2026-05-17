import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { FadeUp } from '@/components/motion/FadeUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';

import { PostCard, type PostCardPost } from './PostCard';

type Props = {
  posts: PostCardPost[];
  total: number;
  /** True when a tag filter is currently active. */
  isFiltered: boolean;
};

/**
 * RSC — Renders the blog grid with hero + regular cards.
 *
 * Mirrors WorksListing exactly so /blog and /works share the editorial pattern:
 * - No filter: first item is hero (variant="hero"), rest in 2/3-col grid
 * - Filtered:  skip hero — all items in 2/3-col grid (derivative listing)
 * - ≤ 6 regular cards: <Stagger>; > 6: <FadeUp> on the grid container
 * - Empty:    context-appropriate empty state
 *
 * Pagination is rendered by the page component (not here) because blog uses
 * numbered pagination (better for SEO + crawl) vs. the works "load more" pattern.
 */
export function PostsListing({ posts, total, isFiltered }: Props) {
  // Truly empty journal (no filter, no posts at all)
  if (!isFiltered && posts.length === 0) {
    return (
      <div className="py-20 text-center">
        <SearchX size={48} className="text-muted-brand mx-auto mb-4" aria-hidden />
        <h2 className="text-xl font-semibold text-ink">ยังไม่มีบทความ</h2>
        <p className="text-sm text-muted-brand mt-2">
          กลับมาดูใหม่อีกครั้ง —{' '}
          <Link href="/contact" className="text-brand-accent underline">
            ติดต่อเรา
          </Link>
        </p>
      </div>
    );
  }

  // Filter returned zero results
  if (isFiltered && posts.length === 0) {
    return (
      <div className="py-20 text-center">
        <SearchX size={48} className="text-muted-brand mx-auto mb-4" aria-hidden />
        <h2 className="text-xl font-semibold text-ink">
          ยังไม่มีบทความในหมวดนี้
        </h2>
        <p className="text-sm text-muted-brand mt-2">
          ลองเปลี่ยนตัวกรอง หรือ{' '}
          <Link href="/blog" className="text-brand-accent underline">
            ดูทั้งหมด →
          </Link>
        </p>
      </div>
    );
  }

  const heroPost = !isFiltered ? posts[0] : null;
  const regularPosts = !isFiltered ? posts.slice(1) : posts;

  return (
    <div aria-label={`บทความ ${total} รายการ`}>
      {/* Hero card — unfiltered view only */}
      {heroPost && (
        <FadeUp delay={0.1}>
          <div className="mt-8">
            <PostCard post={heroPost} variant="hero" priority />
          </div>
        </FadeUp>
      )}

      {/* Divider between hero and regular grid */}
      {heroPost && regularPosts.length > 0 && (
        <hr className="border-t border-line mx-0 mt-8 md:mt-12" />
      )}

      {/* Regular grid — matches WorksListing breakpoints exactly */}
      {regularPosts.length > 0 && (
        <div className="mt-8 md:mt-12">
          {regularPosts.length <= 6 ? (
            <Stagger
              as="ul"
              className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 list-none p-0"
            >
              {regularPosts.map((post, idx) => (
                <StaggerItem as="li" key={post.slug}>
                  <PostCard
                    post={post}
                    variant="default"
                    // First regular card gets priority only when there's no hero
                    priority={!heroPost && idx === 0}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <FadeUp>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 list-none p-0">
                {regularPosts.map((post, idx) => (
                  <li key={post.slug}>
                    <PostCard
                      post={post}
                      variant="default"
                      priority={!heroPost && idx === 0}
                    />
                  </li>
                ))}
              </ul>
            </FadeUp>
          )}
        </div>
      )}
    </div>
  );
}
