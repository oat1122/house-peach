import { requireRole } from '@/lib/auth-guard';
import {
  listMediaAssets,
  listMediaPairs,
} from '@/lib/services/media';
import { MediaLibrary } from '@/components/admin/media/MediaLibrary';

export const dynamic = 'force-dynamic';

type SearchParams = { q?: string; tab?: string };

export default async function AdminMediaPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole();
  const params = await props.searchParams;
  const search = (params.q ?? '').trim();
  const tab = params.tab === 'pairs' ? 'pairs' : 'assets';

  const [assetRows, pairRows] = await Promise.all([
    listMediaAssets({ search: search || undefined, limit: 200 }),
    listMediaPairs(100),
  ]);

  const assets = assetRows.map((row) => ({
    id: row.asset.id,
    uuid: row.asset.uuid,
    title: row.asset.title,
    alt: row.asset.alt,
    path: row.asset.path,
    width: row.asset.width,
    height: row.asset.height,
    postCount: row.postCount,
    workCount: row.workCount,
    isPairBefore: row.isPairBefore,
    isPairAfter: row.isPairAfter,
  }));

  const pairs = pairRows.map((p) => ({
    id: p.id,
    label: p.label,
    before: { path: p.before.path, alt: p.before.alt },
    after: { path: p.after.path, alt: p.after.alt },
  }));

  return (
    <MediaLibrary
      assets={assets}
      pairs={pairs}
      tab={tab}
      searchValue={search}
    />
  );
}
