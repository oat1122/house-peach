import { TrendingUp } from 'lucide-react';

import { SideCard } from '@/components/public/SideCard';
import { PostCard, type PostCardPost } from './PostCard';

type Props = {
  posts: PostCardPost[];
};

/**
 * Sidebar card showing up to 4 recent posts as compact mini-rows.
 */
export function RecentPostsCard({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <SideCard
      title="บทความล่าสุด"
      icon={<TrendingUp size={18} className="text-muted-brand" aria-hidden="true" />}
    >
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.slug}>
            <PostCard post={post} variant="compact" />
          </li>
        ))}
      </ul>
    </SideCard>
  );
}
