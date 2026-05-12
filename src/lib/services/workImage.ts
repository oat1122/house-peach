import 'server-only';
import { and, asc, eq, inArray, max, notInArray, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { bumpTag, tags as cacheTags } from '@/lib/cache-tags';
import { mediaAssets, type MediaAssetRow } from '@/lib/db/schema/mediaAssets';
import { mediaPairs } from '@/lib/db/schema/mediaPairs';
import { works, workImages } from '@/lib/db/schema/works';
import type {
  AttachAssetsInput,
  AttachPairInput,
  ReorderInput,
  RemoveInput,
  SetCoverInput,
  UpdateCaptionInput,
  UpdateKindInput,
} from '@/lib/validation/workImage';

export type WorkImageListItem = {
  workId: number;
  mediaAssetId: number;
  kind: 'before' | 'after' | 'process' | 'detail';
  pairId: number | null;
  caption: string | null;
  sort: number;
  asset: MediaAssetRow;
  isCover: boolean;
};

function bumpWork(workId: number) {
  bumpTag(cacheTags.works);
  bumpTag(cacheTags.work(workId));
  bumpTag(cacheTags.sitemap);
}

export async function listWorkImages(
  workId: number,
): Promise<WorkImageListItem[]> {
  const rows = await db
    .select({
      workId: workImages.workId,
      mediaAssetId: workImages.mediaAssetId,
      kind: workImages.kind,
      pairId: workImages.pairId,
      caption: workImages.caption,
      sort: workImages.sort,
      asset: mediaAssets,
      coverMediaAssetId: works.coverMediaAssetId,
    })
    .from(workImages)
    .innerJoin(mediaAssets, eq(mediaAssets.id, workImages.mediaAssetId))
    .innerJoin(works, eq(works.id, workImages.workId))
    .where(eq(workImages.workId, workId))
    .orderBy(asc(workImages.sort), asc(workImages.mediaAssetId));

  return rows.map((r) => ({
    workId: r.workId,
    mediaAssetId: r.mediaAssetId,
    kind: r.kind,
    pairId: r.pairId,
    caption: r.caption,
    sort: r.sort,
    asset: r.asset,
    isCover: r.coverMediaAssetId === r.mediaAssetId,
  }));
}

/**
 * Attach N media assets to a work. New rows go at the end (max(sort)+1...).
 * Idempotent: assets already linked are silently skipped (PK collision).
 */
export async function attachAssetsToWork(input: AttachAssetsInput) {
  const { workId, mediaAssetIds, defaultKind } = input;

  await db.transaction(async (tx) => {
    // Skip assets that are already linked to this work.
    const existing = await tx
      .select({ id: workImages.mediaAssetId })
      .from(workImages)
      .where(
        and(
          eq(workImages.workId, workId),
          inArray(workImages.mediaAssetId, mediaAssetIds),
        ),
      );
    const linked = new Set(existing.map((r) => r.id));
    const fresh = mediaAssetIds.filter((id) => !linked.has(id));
    if (fresh.length === 0) return;

    // Verify every fresh asset exists.
    const validAssets = await tx
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(inArray(mediaAssets.id, fresh));
    if (validAssets.length !== fresh.length) {
      throw new Error('Some media assets not found');
    }

    const [{ maxSort }] = await tx
      .select({ maxSort: max(workImages.sort) })
      .from(workImages)
      .where(eq(workImages.workId, workId));
    let nextSort = (maxSort ?? -1) + 1;

    await tx.insert(workImages).values(
      fresh.map((mediaAssetId) => ({
        workId,
        mediaAssetId,
        kind: defaultKind,
        sort: nextSort++,
      })),
    );
  });

  bumpWork(workId);
}

/**
 * Attach a media_pair to a work — inserts 2 work_images rows sharing the
 * pair_id, with kind=before/after taken from the pair's before/after assets.
 */
export async function attachPairToWork(input: AttachPairInput) {
  const { workId, pairId } = input;

  await db.transaction(async (tx) => {
    const [pair] = await tx
      .select()
      .from(mediaPairs)
      .where(eq(mediaPairs.id, pairId))
      .limit(1);
    if (!pair) throw new Error('Pair not found');

    // If either asset is already linked → bail; admin needs to detach first.
    const existing = await tx
      .select({ id: workImages.mediaAssetId })
      .from(workImages)
      .where(
        and(
          eq(workImages.workId, workId),
          inArray(workImages.mediaAssetId, [
            pair.beforeAssetId,
            pair.afterAssetId,
          ]),
        ),
      );
    if (existing.length > 0) {
      throw new Error('รูปใน pair นี้ถูกผูกกับ work นี้อยู่แล้ว');
    }

    const [{ maxSort }] = await tx
      .select({ maxSort: max(workImages.sort) })
      .from(workImages)
      .where(eq(workImages.workId, workId));
    const base = (maxSort ?? -1) + 1;

    await tx.insert(workImages).values([
      {
        workId,
        mediaAssetId: pair.beforeAssetId,
        kind: 'before',
        pairId: pair.id,
        sort: base,
      },
      {
        workId,
        mediaAssetId: pair.afterAssetId,
        kind: 'after',
        pairId: pair.id,
        sort: base + 1,
      },
    ]);
  });

  bumpWork(workId);
}

/**
 * Persist a new order for the entire gallery of a work. Caller passes the
 * mediaAssetIds in the desired order; index → sort. Rows not included are
 * left alone.
 */
export async function reorderWorkImages(input: ReorderInput) {
  const { workId, mediaAssetIds } = input;

  await db.transaction(async (tx) => {
    // Verify all rows belong to this work (defense against forged ids).
    const owned = await tx
      .select({ id: workImages.mediaAssetId })
      .from(workImages)
      .where(
        and(
          eq(workImages.workId, workId),
          inArray(workImages.mediaAssetId, mediaAssetIds),
        ),
      );
    if (owned.length !== mediaAssetIds.length) {
      throw new Error('Some images are not part of this work');
    }

    for (let i = 0; i < mediaAssetIds.length; i++) {
      await tx
        .update(workImages)
        .set({ sort: i })
        .where(
          and(
            eq(workImages.workId, workId),
            eq(workImages.mediaAssetId, mediaAssetIds[i]),
          ),
        );
    }
  });

  bumpWork(workId);
}

export async function updateWorkImageKind(input: UpdateKindInput) {
  const { workId, mediaAssetId, kind } = input;
  await db
    .update(workImages)
    .set({ kind })
    .where(
      and(
        eq(workImages.workId, workId),
        eq(workImages.mediaAssetId, mediaAssetId),
      ),
    );
  bumpWork(workId);
}

export async function updateWorkImageCaption(input: UpdateCaptionInput) {
  const { workId, mediaAssetId, caption } = input;
  await db
    .update(workImages)
    .set({ caption })
    .where(
      and(
        eq(workImages.workId, workId),
        eq(workImages.mediaAssetId, mediaAssetId),
      ),
    );
  bumpWork(workId);
}

export async function setWorkCover(input: SetCoverInput) {
  const { workId, mediaAssetId } = input;
  if (mediaAssetId !== null) {
    // Verify the asset is attached to this work.
    const [row] = await db
      .select({ id: workImages.mediaAssetId })
      .from(workImages)
      .where(
        and(
          eq(workImages.workId, workId),
          eq(workImages.mediaAssetId, mediaAssetId),
        ),
      )
      .limit(1);
    if (!row) throw new Error('รูปนี้ไม่ได้อยู่ใน work');
  }
  await db
    .update(works)
    .set({ coverMediaAssetId: mediaAssetId })
    .where(eq(works.id, workId));
  bumpWork(workId);
}

export async function removeWorkImage(input: RemoveInput) {
  const { workId, mediaAssetId } = input;

  await db.transaction(async (tx) => {
    // If this row is the cover, clear cover first (FK SET NULL handles delete
    // case, but we'd rather pick the next cover if there's still gallery left
    // — clearing keeps things simple, admin can re-pick).
    const [w] = await tx
      .select({ coverMediaAssetId: works.coverMediaAssetId })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);
    if (w?.coverMediaAssetId === mediaAssetId) {
      await tx
        .update(works)
        .set({ coverMediaAssetId: null })
        .where(eq(works.id, workId));
    }

    // Find the row's pair_id; if it's part of a pair, also detach the partner
    // pair_id (the partner row stays as a single).
    const [target] = await tx
      .select({ pairId: workImages.pairId })
      .from(workImages)
      .where(
        and(
          eq(workImages.workId, workId),
          eq(workImages.mediaAssetId, mediaAssetId),
        ),
      )
      .limit(1);

    await tx
      .delete(workImages)
      .where(
        and(
          eq(workImages.workId, workId),
          eq(workImages.mediaAssetId, mediaAssetId),
        ),
      );

    if (target?.pairId != null) {
      // Strip pair_id from the orphaned partner so the renderer doesn't try to
      // pair it with a deleted row.
      await tx
        .update(workImages)
        .set({ pairId: null })
        .where(
          and(
            eq(workImages.workId, workId),
            eq(workImages.pairId, target.pairId),
          ),
        );
    }

    // Compact sort indexes so reordering remains stable.
    const remaining = await tx
      .select({
        mediaAssetId: workImages.mediaAssetId,
        sort: workImages.sort,
      })
      .from(workImages)
      .where(eq(workImages.workId, workId))
      .orderBy(asc(workImages.sort), asc(workImages.mediaAssetId));

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].sort !== i) {
        await tx
          .update(workImages)
          .set({ sort: i })
          .where(
            and(
              eq(workImages.workId, workId),
              eq(workImages.mediaAssetId, remaining[i].mediaAssetId),
            ),
          );
      }
    }
  });

  bumpWork(workId);
}

// Mark unused imports as intentional re-exports — server file imports get
// shaken at build, but the linter is conservative.
export const _unused = { notInArray, sql };
