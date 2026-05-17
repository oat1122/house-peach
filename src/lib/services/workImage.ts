import 'server-only';
import { and, asc, eq, inArray, max } from 'drizzle-orm';

import { db } from '@/lib/db';
import { bumpWorkById } from '@/lib/cache-tags';
import { mediaAssets, type MediaAssetRow } from '@/lib/db/schema/mediaAssets';
import { mediaPairs } from '@/lib/db/schema/mediaPairs';
import { works, workImages } from '@/lib/db/schema/works';
import type {
  AttachAssetsInput,
  AttachPairInput,
  ReorderInput,
  RemoveInput,
  SetCoverInput,
  SetFeaturedInput,
  UpdateCaptionInput,
  UpdateKindInput,
} from '@/lib/validation/workImage';

export type WorkImageListItem = {
  workId: number;
  mediaAssetId: number;
  kind: 'before' | 'after' | 'process' | 'detail' | 'plan';
  pairId: number | null;
  caption: string | null;
  sort: number;
  asset: MediaAssetRow;
  isCover: boolean;
  isFeatured: boolean;
};

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
      isFeatured: workImages.isFeatured,
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
    isFeatured: r.isFeatured,
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

    // Auto-pick the first fresh asset as cover if the work has none yet.
    // Saves the admin a click on the common "upload + done" path.
    const [w] = await tx
      .select({ coverMediaAssetId: works.coverMediaAssetId })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);
    if (w && w.coverMediaAssetId == null) {
      await tx
        .update(works)
        .set({ coverMediaAssetId: fresh[0] })
        .where(eq(works.id, workId));
    }
  });

  bumpWorkById(workId);
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

    // Auto-pick the "after" image as cover if the work has none yet — the
    // after-shot is naturally the marquee shot of a before/after pair.
    const [w] = await tx
      .select({ coverMediaAssetId: works.coverMediaAssetId })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);
    if (w && w.coverMediaAssetId == null) {
      await tx
        .update(works)
        .set({ coverMediaAssetId: pair.afterAssetId })
        .where(eq(works.id, workId));
    }
  });

  bumpWorkById(workId);
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

  bumpWorkById(workId);
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
  bumpWorkById(workId);
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
  bumpWorkById(workId);
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
  bumpWorkById(workId);
}

/**
 * Toggle a work_image's `is_featured` flag. Featured rows get the larger 2×2
 * tile in the masonry gallery (process + detail sections on the public detail
 * page). No constraint on how many can be featured per work — the masonry
 * fills gaps naturally either way, but UX-wise admin probably wants 1–3.
 */
export async function setWorkImageFeatured(input: SetFeaturedInput) {
  const { workId, mediaAssetId, isFeatured } = input;
  const result = await db
    .update(workImages)
    .set({ isFeatured })
    .where(
      and(
        eq(workImages.workId, workId),
        eq(workImages.mediaAssetId, mediaAssetId),
      ),
    );
  // mysql2's UPDATE result has affectedRows on the OkPacket.
  const affected = (result as unknown as { affectedRows?: number }[])[0]
    ?.affectedRows;
  if (affected === 0) throw new Error('รูปนี้ไม่ได้อยู่ใน work');
  bumpWorkById(workId);
}

export async function removeWorkImage(input: RemoveInput) {
  const { workId, mediaAssetId } = input;

  await db.transaction(async (tx) => {
    const [w] = await tx
      .select({ coverMediaAssetId: works.coverMediaAssetId })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);
    const wasCover = w?.coverMediaAssetId === mediaAssetId;

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

    // If the deleted row was the cover, auto-promote the next remaining image
    // (lowest sort) so the work always has a cover when at least one image is
    // left. Falls back to null when the gallery is empty.
    if (wasCover) {
      const [next] = await tx
        .select({ id: workImages.mediaAssetId })
        .from(workImages)
        .where(eq(workImages.workId, workId))
        .orderBy(asc(workImages.sort), asc(workImages.mediaAssetId))
        .limit(1);
      await tx
        .update(works)
        .set({ coverMediaAssetId: next?.id ?? null })
        .where(eq(works.id, workId));
    }

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

  bumpWorkById(workId);
}

