import 'server-only';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { bumpTag, bumpWorkPaths, tags as cacheTags } from '@/lib/cache-tags';
import { mediaAssets } from '@/lib/db/schema/mediaAssets';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { works, workTags, type WorkRow } from '@/lib/db/schema/works';
import { workImages } from '@/lib/db/schema/works';
import type { WorkInsert, WorkUpdate } from '@/lib/validation/work';

/**
 * List works for the admin index. Includes the resolved cover image path so
 * the table can render a thumbnail without an N+1 query.
 */
export type WorkListItem = WorkRow & {
  coverPath: string | null;
  coverAlt: string | null;
  tagCount: number;
};

export async function listWorks(): Promise<WorkListItem[]> {
  const rows = await db
    .select({
      work: works,
      coverPath: mediaAssets.path,
      coverAlt: mediaAssets.alt,
      tagCount: sql<number>`(SELECT COUNT(*) FROM ${workTags} WHERE ${workTags.workId} = ${works.id})`,
    })
    .from(works)
    .leftJoin(mediaAssets, eq(mediaAssets.id, works.coverMediaAssetId))
    .orderBy(desc(works.publishedAt), desc(works.createdAt))
    .limit(500);

  return rows.map((r) => ({
    ...r.work,
    coverPath: r.coverPath,
    coverAlt: r.coverAlt,
    tagCount: Number(r.tagCount ?? 0),
  }));
}

export type WorkDetail = WorkRow & {
  tagIds: number[];
};

export async function getWorkById(id: number): Promise<WorkDetail | null> {
  const [work] = await db.select().from(works).where(eq(works.id, id)).limit(1);
  if (!work) return null;
  const tagRows = await db
    .select({ tagId: workTags.tagId })
    .from(workTags)
    .where(eq(workTags.workId, id));
  return { ...work, tagIds: tagRows.map((r) => r.tagId) };
}

export async function getPublishedWorkBySlug(
  slug: string,
): Promise<WorkDetail | null> {
  // Try NFC first (current slugify() output + how browsers encode shared URLs).
  // If miss, fall back to NFKD — legacy rows written before slugify() was
  // taught to re-compose may still be stored decomposed; visually identical
  // but byte-wise different, so a strict eq() would skip them.
  const nfc = slug.normalize('NFC');
  const nfd = slug.normalize('NFKD');
  const candidates = nfc === nfd ? [nfc] : [nfc, nfd];

  let work: WorkRow | undefined;
  for (const candidate of candidates) {
    [work] = await db
      .select()
      .from(works)
      .where(and(eq(works.slug, candidate), eq(works.status, 'published')))
      .limit(1);
    if (work) break;
  }
  if (!work) return null;

  const tagRows = await db
    .select({ tagId: workTags.tagId })
    .from(workTags)
    .where(eq(workTags.workId, work.id));
  return { ...work, tagIds: tagRows.map((r) => r.tagId) };
}

export class WorkSlugTakenError extends Error {
  constructor() {
    super('slug นี้ถูกใช้แล้ว — ลองเปลี่ยน');
    this.name = 'WorkSlugTakenError';
  }
}

async function assertSlugAvailable(slug: string, excludeId?: number) {
  const [existing] = await db
    .select({ id: works.id })
    .from(works)
    .where(eq(works.slug, slug))
    .limit(1);
  if (existing && existing.id !== excludeId) {
    throw new WorkSlugTakenError();
  }
}

function bumpWork(id: number) {
  bumpTag(cacheTags.works);
  bumpTag(cacheTags.work(id));
  bumpTag(cacheTags.sitemap);
  // Path-based bust is what actually clears the ISR cache for the public
  // /works/[slug] and /works pages. See cache-tags.ts for the rationale.
  bumpWorkPaths();
}

export async function createWork(input: WorkInsert): Promise<number> {
  await assertSlugAvailable(input.slug);
  return db.transaction(async (tx) => {
    const result = await tx.insert(works).values({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      bodyMdx: input.bodyMdx,
      roomType: input.roomType,
      style: input.style,
      yearCompleted: input.yearCompleted ?? null,
      location: input.location ?? null,
      areaSqm: input.areaSqm != null ? String(input.areaSqm) : null,
      budgetRange: input.budgetRange ?? null,
      coverMediaAssetId: input.coverMediaAssetId ?? null,
      tone: input.tone,
      accent: input.accent,
      status: input.status,
      publishedAt:
        input.status === 'published'
          ? (input.publishedAt ?? new Date())
          : null,
    });
    const insertId = (result as unknown as { insertId?: number }[])[0]?.insertId;
    if (!insertId) throw new Error('Failed to insert work');

    if (input.tagIds.length > 0) {
      await ensureTagsExist(tx, input.tagIds);
      await tx
        .insert(workTags)
        .values(input.tagIds.map((tagId) => ({ workId: insertId, tagId })));
    }

    bumpWork(insertId);
    return insertId;
  });
}

export async function updateWork(input: WorkUpdate): Promise<void> {
  if (input.slug) await assertSlugAvailable(input.slug, input.id);

  await db.transaction(async (tx) => {
    const set: Record<string, unknown> = {};
    if (input.title !== undefined) set.title = input.title;
    if (input.slug !== undefined) set.slug = input.slug;
    if (input.summary !== undefined) set.summary = input.summary;
    if (input.bodyMdx !== undefined) set.bodyMdx = input.bodyMdx;
    if (input.roomType !== undefined) set.roomType = input.roomType;
    if (input.style !== undefined) set.style = input.style;
    if (input.yearCompleted !== undefined)
      set.yearCompleted = input.yearCompleted ?? null;
    if (input.location !== undefined) set.location = input.location ?? null;
    if (input.areaSqm !== undefined)
      set.areaSqm = input.areaSqm != null ? String(input.areaSqm) : null;
    if (input.budgetRange !== undefined)
      set.budgetRange = input.budgetRange ?? null;
    // NOTE: `coverMediaAssetId` is intentionally NOT settable via updateWork.
    // Cover selection is owned by setWorkCover() / the Gallery editor —
    // routing it through the form payload caused the form save to clobber
    // gallery writes back to null (RHF holds the stale on-mount default,
    // and zod's .default(null) refills the field even when the client omits
    // it). If a future flow needs to set it here, do an explicit unset first.
    if (input.tone !== undefined) set.tone = input.tone;
    if (input.accent !== undefined) set.accent = input.accent;
    if (input.status !== undefined) {
      set.status = input.status;
      if (input.status === 'published') {
        // Only stamp publishedAt the first time we publish.
        set.publishedAt = sql`COALESCE(${works.publishedAt}, NOW())`;
      }
    }

    if (Object.keys(set).length > 0) {
      await tx.update(works).set(set).where(eq(works.id, input.id));
    }

    if (input.tagIds !== undefined) {
      await tx.delete(workTags).where(eq(workTags.workId, input.id));
      if (input.tagIds.length > 0) {
        await ensureTagsExist(tx, input.tagIds);
        await tx
          .insert(workTags)
          .values(input.tagIds.map((tagId) => ({ workId: input.id, tagId })));
      }
    }
  });

  bumpWork(input.id);
}

export async function setWorkStatus(
  id: number,
  status: 'draft' | 'published' | 'archived',
): Promise<void> {
  // Only stamp publishedAt on first publish; leave existing value untouched
  // for draft/archived so the original publication timestamp is preserved.
  const set: Record<string, unknown> = { status };
  if (status === 'published') {
    set.publishedAt = sql`COALESCE(${works.publishedAt}, NOW())`;
  }
  await db.update(works).set(set).where(eq(works.id, id));
  bumpWork(id);
}

export async function deleteWork(id: number): Promise<void> {
  // FK ON DELETE CASCADE cleans work_images / work_tags / media_pairs links.
  await db.delete(works).where(eq(works.id, id));
  bumpTag(cacheTags.works);
  bumpTag(cacheTags.work(id));
  bumpTag(cacheTags.sitemap);
}

async function ensureTagsExist(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tagIds: number[],
) {
  const rows = await tx
    .select({ id: tagsTable.id })
    .from(tagsTable)
    .where(inArray(tagsTable.id, tagIds));
  if (rows.length !== tagIds.length) {
    const found = new Set(rows.map((r) => r.id));
    const missing = tagIds.filter((id) => !found.has(id));
    throw new Error(`Tag ids not found: ${missing.join(', ')}`);
  }
}

/**
 * List tags admin can pick when authoring a work — kind ∈ {work, both}.
 */
export async function listWorkTagOptions() {
  return await db
    .select({
      id: tagsTable.id,
      slug: tagsTable.slug,
      name: tagsTable.name,
      kind: tagsTable.kind,
    })
    .from(tagsTable)
    .where(inArray(tagsTable.kind, ['work', 'both']))
    .orderBy(tagsTable.sort, tagsTable.name);
}

/** Silence the unused import — workImages is exported here so Phase B can re-use the column references. */
export const _workImagesRef = workImages;
