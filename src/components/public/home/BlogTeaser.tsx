import Image from 'next/image';
import Link from 'next/link';

import { FadeUp } from '@/components/motion/FadeUp';
import type { PostListItem } from '@/lib/services/post';

const dateFmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' });

export function BlogTeaser({ posts }: { posts: PostListItem[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="blog-teaser-heading" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <FadeUp>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
              <span lang="th">บทความ &amp; ไอเดีย</span>
              <span aria-hidden="true"> · </span>
              <span lang="en">Journal</span>
            </span>
            <h2
              id="blog-teaser-heading"
              className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink md:text-4xl"
            >
              เรื่องน่ารู้สำหรับบ้านคุณ
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex min-h-[44px] items-center gap-2 border-b-[1.5px] border-ink pb-1 text-sm font-bold text-ink hover:text-brand-accent hover:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm transition-colors"
          >
            ดูบทความทั้งหมด <span aria-hidden="true">→</span>
          </Link>
        </div>
      </FadeUp>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group overflow-hidden rounded-2xl border border-line bg-brand-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
          >
            <Link
              href={`/blog/${encodeURIComponent(post.slug)}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-2xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-bg2">
                {post.coverPath && (
                  <Image
                    src={post.coverPath}
                    alt={post.coverAlt || post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    unoptimized
                  />
                )}
              </div>
              <div className="p-5">
                <div className="mb-2.5 flex items-center gap-2 text-xs text-muted-brand">
                  {post.readingTimeMin != null && (
                    <span className="font-bold text-brand-accent">อ่าน {post.readingTimeMin} นาที</span>
                  )}
                  {post.publishedAt && <span>· {dateFmt.format(post.publishedAt)}</span>}
                </div>
                <h3 className="text-[17px] font-bold leading-snug text-ink group-hover:text-brand-accent transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-accent">
                  อ่านต่อ <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
