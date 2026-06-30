import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { eq } from 'drizzle-orm';

import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireRole } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import { mediaAssets } from '@/lib/db/schema/mediaAssets';
import { postTags } from '@/lib/db/schema/posts';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { users } from '@/lib/db/schema/users';
import { getCategoryById } from '@/lib/services/category';
import { getPostById } from '@/lib/services/post';
import { renderTiptap } from '@/lib/tiptap/render';

export const dynamic = 'force-dynamic';

export default async function PostDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireRole();
  const { id } = await props.params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

  const post = await getPostById(numId);
  if (!post) notFound();

  const [authorRow, coverRow, tagRows, category] = await Promise.all([
    db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1),
    post.coverMediaAssetId
      ? db
          .select({
            path: mediaAssets.path,
            alt: mediaAssets.alt,
            width: mediaAssets.width,
            height: mediaAssets.height,
          })
          .from(mediaAssets)
          .where(eq(mediaAssets.id, post.coverMediaAssetId))
          .limit(1)
      : Promise.resolve<{ path: string; alt: string; width: number; height: number }[]>([]),
    db
      .select({ name: tagsTable.name })
      .from(postTags)
      .innerJoin(tagsTable, eq(tagsTable.id, postTags.tagId))
      .where(eq(postTags.postId, post.id)),
    post.categoryId ? getCategoryById(post.categoryId) : Promise.resolve(null),
  ]);

  const author = authorRow[0]?.name ?? null;
  const cover = coverRow[0] ?? null;
  const tagNames = tagRows.map((r) => r.name);
  const body = renderTiptap(post.body);
  const fmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
      {/* Back link */}
      <Link
        href="/admin/posts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-brand transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden />
        กลับไปที่บทความ
      </Link>

      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl leading-tight text-ink md:text-3xl">
              {post.title}
            </h1>
            <StatusBadge status={post.status} />
          </div>
          <p className="truncate font-mono text-xs text-muted-brand">{post.slug}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {post.status === 'published' && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:bg-bg2"
            >
              ดูหน้าเว็บ
            </Link>
          )}
          <Link
            href={`/admin/posts/${post.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm text-bg transition-opacity hover:opacity-90"
          >
            <PencilLine size={14} aria-hidden />
            แก้ไข
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-5">
          {cover && (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line">
              <Image
                src={cover.path}
                alt={cover.alt || `${post.title} — ภาพปก`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <section className="rounded-2xl border border-line bg-brand-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-brand">เนื้อหา</h2>
            <div className="prose-post max-w-none">{body}</div>
          </section>
        </div>

        {/* Side column */}
        <aside className="sticky top-4">
          <section className="rounded-2xl border border-line bg-brand-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-brand">รายละเอียด</h2>
            <dl className="space-y-2.5 text-sm">
              {category && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">หมวดหมู่</dt>
                  <dd>
                    <span className="rounded-full bg-bg2 px-2.5 py-0.5 text-xs text-ink">
                      {category.name}
                    </span>
                  </dd>
                </div>
              )}
              {tagNames.length > 0 && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">แท็ก</dt>
                  <dd className="flex flex-wrap justify-end gap-1">
                    {tagNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-bg2 px-2.5 py-0.5 text-xs text-ink"
                      >
                        {name}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {author && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">ผู้เขียน</dt>
                  <dd className="text-ink">{author}</dd>
                </div>
              )}
              {post.readingTimeMin != null && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">เวลาอ่าน</dt>
                  <dd className="text-ink">{post.readingTimeMin} นาที</dd>
                </div>
              )}
              {post.publishedAt && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">เผยแพร่เมื่อ</dt>
                  <dd className="text-ink">{fmt.format(post.publishedAt)}</dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <dt className="shrink-0 text-muted-brand">ยอดอ่าน</dt>
                <dd className="text-ink">{post.viewCount.toLocaleString('th-TH')}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
