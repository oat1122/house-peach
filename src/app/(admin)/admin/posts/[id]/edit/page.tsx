import { notFound } from 'next/navigation';

import { PostForm } from '@/components/admin/posts/PostForm';
import type { PickerAsset } from '@/components/admin/media/MediaPicker';
import { requireRole } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import { mediaAssets } from '@/lib/db/schema/mediaAssets';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { listCategoryOptions } from '@/lib/services/category';
import { listMediaAssets } from '@/lib/services/media';
import { getPostById, listPostTagOptions } from '@/lib/services/post';
import type { PostInsert } from '@/lib/validation/post';

export const dynamic = 'force-dynamic';

export default async function EditPostPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireRole();
  const { id } = await props.params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

  const [post, tagOptions, categoryOptions, libraryAssetsRaw] =
    await Promise.all([
      getPostById(numId),
      listPostTagOptions(),
      listCategoryOptions('post'),
      listMediaAssets({ limit: 500 }),
    ]);
  if (!post) notFound();

  // Resolve author display name + current cover asset in parallel — both are
  // join queries the listing page already does, but the edit form takes a
  // different shape so we re-fetch with simple `select().where()` here.
  const [authorRow, coverRow] = await Promise.all([
    db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1),
    post.coverMediaAssetId
      ? db
          .select({
            id: mediaAssets.id,
            title: mediaAssets.title,
            alt: mediaAssets.alt,
            path: mediaAssets.path,
            width: mediaAssets.width,
            height: mediaAssets.height,
          })
          .from(mediaAssets)
          .where(eq(mediaAssets.id, post.coverMediaAssetId))
          .limit(1)
      : Promise.resolve<PickerAsset[]>([]),
  ]);

  const defaultValues: Partial<PostInsert> & {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    readingTimeMin: number | null;
  } = {
    id: post.id,
    title: post.title,
    slug: post.slug as PostInsert['slug'],
    excerpt: post.excerpt,
    body: post.body,
    coverMediaAssetId: post.coverMediaAssetId ?? null,
    categoryId: post.categoryId ?? null,
    status: post.status,
    publishedAt: post.publishedAt ?? null,
    tagIds: post.tagIds,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    viewCount: post.viewCount,
    readingTimeMin: post.readingTimeMin,
  };

  const libraryAssets: PickerAsset[] = libraryAssetsRaw.map((row) => ({
    id: row.asset.id,
    title: row.asset.title,
    alt: row.asset.alt,
    path: row.asset.path,
    width: row.asset.width,
    height: row.asset.height,
  }));

  return (
    <PostForm
      mode="edit"
      defaultValues={defaultValues}
      tagOptions={tagOptions}
      categoryOptions={categoryOptions}
      libraryAssets={libraryAssets}
      authorName={authorRow[0]?.name ?? null}
      coverAssetCache={coverRow[0] ?? null}
    />
  );
}
