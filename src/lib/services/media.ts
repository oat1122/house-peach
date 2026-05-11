import 'server-only';
import { and, desc, eq, inArray, like, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { bumpTag, tags as cacheTags } from '@/lib/cache-tags';
import { mediaAssets, type MediaAssetRow } from '@/lib/db/schema/mediaAssets';
import { mediaPairs } from '@/lib/db/schema/mediaPairs';
import { postImages } from '@/lib/db/schema/posts';
import { users } from '@/lib/db/schema/users';
import { workImages } from '@/lib/db/schema/works';
import {
  deleteStoredImage,
  processAndStoreImage,
} from './imageProcess';

export type CreateAssetInput = {
  buffer: Buffer;
  title?: string;
  alt?: string;
  createdById?: number | null;
};

export async function createMediaAsset(
  input: CreateAssetInput,
): Promise<MediaAssetRow> {
  const variants = await processAndStoreImage(input.buffer);

  // Stale JWT sessions can carry a user id that no longer exists in the DB
  // (e.g. after a dev reseed). Verify before inserting — otherwise the FK on
  // media_assets.created_by_id rejects the row.
  let createdById: number | null = null;
  if (input.createdById && Number.isFinite(input.createdById)) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.createdById))
      .limit(1);
    createdById = u?.id ?? null;
  }

  const result = await db.insert(mediaAssets).values({
    uuid: variants.uuid,
    title: (input.title ?? '').slice(0, 180),
    alt: (input.alt ?? '').slice(0, 255),
    path: variants.path,
    mime: variants.mime,
    width: variants.width,
    height: variants.height,
    bytes: variants.bytes,
    createdById,
  });
  const insertId = (result as unknown as { insertId?: number }[])[0]?.insertId;
  if (!insertId) throw new Error('Failed to insert media_asset');

  const [row] = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, insertId))
    .limit(1);
  if (!row) throw new Error('media_asset not found after insert');
  return row;
}

export type AssetUsage = {
  asset: MediaAssetRow;
  postCount: number;
  workCount: number;
  isPairBefore: boolean;
  isPairAfter: boolean;
};

const POST_COUNT_SQL = sql<number>`(SELECT COUNT(*) FROM ${postImages} WHERE ${postImages.mediaAssetId} = ${mediaAssets.id})`;
const WORK_COUNT_SQL = sql<number>`(SELECT COUNT(*) FROM ${workImages} WHERE ${workImages.mediaAssetId} = ${mediaAssets.id})`;
const PAIR_BEFORE_SQL = sql<number>`(SELECT COUNT(*) FROM ${mediaPairs} WHERE ${mediaPairs.beforeAssetId} = ${mediaAssets.id})`;
const PAIR_AFTER_SQL = sql<number>`(SELECT COUNT(*) FROM ${mediaPairs} WHERE ${mediaPairs.afterAssetId} = ${mediaAssets.id})`;

export type ListAssetsOptions = {
  search?: string;
  limit?: number;
};

export async function listMediaAssets(
  options: ListAssetsOptions = {},
): Promise<AssetUsage[]> {
  const { search, limit = 200 } = options;
  const baseQuery = db
    .select({
      asset: mediaAssets,
      postCount: POST_COUNT_SQL,
      workCount: WORK_COUNT_SQL,
      isPairBefore: PAIR_BEFORE_SQL,
      isPairAfter: PAIR_AFTER_SQL,
    })
    .from(mediaAssets);

  const filtered = search
    ? baseQuery.where(
        or(
          like(mediaAssets.title, `%${search}%`),
          like(mediaAssets.alt, `%${search}%`),
        ),
      )
    : baseQuery;

  const rows = await filtered
    .orderBy(desc(mediaAssets.createdAt), desc(mediaAssets.id))
    .limit(limit);

  return rows.map((r) => ({
    asset: r.asset,
    postCount: Number(r.postCount ?? 0),
    workCount: Number(r.workCount ?? 0),
    isPairBefore: Number(r.isPairBefore ?? 0) > 0,
    isPairAfter: Number(r.isPairAfter ?? 0) > 0,
  }));
}

export async function updateMediaAssetMeta(
  id: number,
  patch: { title?: string; alt?: string },
): Promise<void> {
  const set: Record<string, string> = {};
  if (typeof patch.title === 'string') set.title = patch.title.slice(0, 180);
  if (typeof patch.alt === 'string') set.alt = patch.alt.slice(0, 255);
  if (Object.keys(set).length === 0) return;
  await db.update(mediaAssets).set(set).where(eq(mediaAssets.id, id));
}

export type DeleteAssetResult = {
  deleted: boolean;
  affected: { postCount: number; workCount: number; pairCount: number };
};

export async function deleteMediaAsset(id: number): Promise<DeleteAssetResult> {
  const [row] = await db
    .select({ uuid: mediaAssets.uuid })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!row) return { deleted: false, affected: { postCount: 0, workCount: 0, pairCount: 0 } };

  // Count usage for the response message before we cascade.
  const [counts] = await db
    .select({
      postCount: POST_COUNT_SQL,
      workCount: WORK_COUNT_SQL,
      pairCount: sql<number>`((SELECT COUNT(*) FROM ${mediaPairs} WHERE ${mediaPairs.beforeAssetId} = ${mediaAssets.id})
        + (SELECT COUNT(*) FROM ${mediaPairs} WHERE ${mediaAssets.id} = ${mediaPairs.afterAssetId}))`,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);

  // FK ON DELETE CASCADE on post_images/work_images/media_pairs cleans junction rows.
  // posts.cover_media_asset_id / works.cover_media_asset_id are SET NULL.
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  await deleteStoredImage(row.uuid).catch(() => undefined);

  // Bump any content that was using this asset. We could be more surgical, but the
  // count is unbounded — easier to bump the listings broadly.
  bumpTag(cacheTags.posts);
  bumpTag(cacheTags.works);
  bumpTag(cacheTags.sitemap);

  return {
    deleted: true,
    affected: {
      postCount: Number(counts?.postCount ?? 0),
      workCount: Number(counts?.workCount ?? 0),
      pairCount: Number(counts?.pairCount ?? 0),
    },
  };
}

export type CreatePairInput = {
  beforeAssetId: number;
  afterAssetId: number;
  label?: string;
};

export async function createMediaPair(input: CreatePairInput) {
  if (input.beforeAssetId === input.afterAssetId) {
    throw new Error('A pair must contain two different assets');
  }

  // Verify both assets exist.
  const rows = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, [input.beforeAssetId, input.afterAssetId]));
  if (rows.length !== 2) throw new Error('One or both assets not found');

  // Already paired? (Either direction.)
  const [existing] = await db
    .select({ id: mediaPairs.id })
    .from(mediaPairs)
    .where(
      or(
        and(
          eq(mediaPairs.beforeAssetId, input.beforeAssetId),
          eq(mediaPairs.afterAssetId, input.afterAssetId),
        ),
        and(
          eq(mediaPairs.beforeAssetId, input.afterAssetId),
          eq(mediaPairs.afterAssetId, input.beforeAssetId),
        ),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const result = await db.insert(mediaPairs).values({
    beforeAssetId: input.beforeAssetId,
    afterAssetId: input.afterAssetId,
    label: (input.label ?? '').slice(0, 180),
  });
  const insertId = (result as unknown as { insertId?: number }[])[0]?.insertId;
  if (!insertId) throw new Error('Failed to insert media_pair');

  return { id: insertId };
}

export type ListedPair = {
  id: number;
  label: string;
  createdAt: Date;
  before: MediaAssetRow;
  after: MediaAssetRow;
};

export async function listMediaPairs(limit = 100): Promise<ListedPair[]> {
  const beforeAssets = sql<string>`'before'`;
  const afterAssets = sql<string>`'after'`;
  void beforeAssets;
  void afterAssets;

  const rows = await db
    .select({
      id: mediaPairs.id,
      label: mediaPairs.label,
      createdAt: mediaPairs.createdAt,
      beforeAssetId: mediaPairs.beforeAssetId,
      afterAssetId: mediaPairs.afterAssetId,
    })
    .from(mediaPairs)
    .orderBy(desc(mediaPairs.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const assetIds = Array.from(
    new Set(rows.flatMap((r) => [r.beforeAssetId, r.afterAssetId])),
  );
  const assets = await db
    .select()
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, assetIds));
  const byId = new Map(assets.map((a) => [a.id, a]));

  const result: ListedPair[] = [];
  for (const r of rows) {
    const before = byId.get(r.beforeAssetId);
    const after = byId.get(r.afterAssetId);
    if (!before || !after) continue;
    result.push({
      id: r.id,
      label: r.label,
      createdAt: r.createdAt,
      before,
      after,
    });
  }
  return result;
}

export async function updateMediaPairLabel(id: number, label: string) {
  await db
    .update(mediaPairs)
    .set({ label: label.slice(0, 180) })
    .where(eq(mediaPairs.id, id));
}

export async function deleteMediaPair(id: number) {
  // work_images.pair_id is SET NULL on cascade — work galleries lose pairing
  // metadata but keep the underlying images.
  await db.delete(mediaPairs).where(eq(mediaPairs.id, id));
  bumpTag(cacheTags.works);
}
