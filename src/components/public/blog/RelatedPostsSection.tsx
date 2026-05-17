import { FadeUp } from '@/components/motion/FadeUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';

import { PostCard, type PostCardPost } from './PostCard';

type Props = {
  posts: PostCardPost[];
};

/**
 * Full-width related posts section below the article body.
 * Uses Stagger (≤ 3 items — within motion budget) for sequential entrance.
 * Returns null when no related posts are available.
 */
export function RelatedPostsSection({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="bg-bg2 border-t border-line py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <FadeUp>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-serif text-ink">
              บทความที่คุณอาจสนใจ
            </h2>
          </div>
        </FadeUp>

        <Stagger
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          as="div"
        >
          {posts.slice(0, 3).map((post, i) => (
            <StaggerItem key={post.slug}>
              <PostCard post={post} variant="related" priority={i === 0} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
