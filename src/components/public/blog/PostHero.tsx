import Image from 'next/image';

import { PostBreadcrumb } from './PostBreadcrumb';
import { PostMetaRow } from './PostMetaRow';

type Props = {
  post: {
    title: string;
    excerpt: string;
    coverPath: string | null;
    coverAlt: string | null;
    publishedAt: Date;
    readingTimeMin: number | null;
    author: { name: string };
    tags: { name: string; slug: string }[];
  };
};

/**
 * Blog post hero section: breadcrumb, meta row, h1 title, excerpt, and cover
 * image (16:9, rounded-2xl). No decorative blobs per locked decision #4.
 * The cover image uses `priority` to improve LCP.
 */
export function PostHero({ post }: Props) {
  const resolvedAlt =
    post.coverAlt || `${post.title} — ภาพปก`;

  return (
    <section className="bg-bg pt-16 pb-8 md:pt-20 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Breadcrumb — leaf is the post title (matches JSON-LD position 3) */}
        <PostBreadcrumb postTitle={post.title} />

        {/* Meta row */}
        <div className="mt-4">
          <PostMetaRow
            publishedAt={post.publishedAt}
            readingTimeMin={post.readingTimeMin}
            author={post.author}
            tags={post.tags}
          />
        </div>

        {/* Title */}
        <h1
          className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-ink leading-[1.2] mt-5 max-w-3xl"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          {post.title}
        </h1>

        {/* Excerpt */}
        <p className="text-lg text-muted-brand leading-relaxed max-w-2xl mt-4 mb-8">
          {post.excerpt}
        </p>

        {/* Cover image */}
        {post.coverPath && (
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-bg2">
            <Image
              src={post.coverPath}
              alt={resolvedAlt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1152px"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
