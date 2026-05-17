import { PostForm } from '@/components/admin/posts/PostForm';
import type { PickerAsset } from '@/components/admin/media/MediaPicker';
import { requireRole } from '@/lib/auth-guard';
import { listMediaAssets } from '@/lib/services/media';
import { listPostTagOptions } from '@/lib/services/post';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const { session } = await requireRole();

  const [tagOptions, libraryAssetsRaw] = await Promise.all([
    listPostTagOptions(),
    listMediaAssets({ limit: 500 }),
  ]);

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
      mode="new"
      tagOptions={tagOptions}
      libraryAssets={libraryAssets}
      authorName={session?.user?.name ?? null}
      coverAssetCache={null}
    />
  );
}
