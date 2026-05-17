import 'server-only';
import { cache } from 'react';
import { and, asc, count, desc, eq, inArray, ne, notInArray, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { bumpTag, bumpWorkPaths, tags as cacheTags } from '@/lib/cache-tags';
import { mediaAssets } from '@/lib/db/schema/mediaAssets';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import {
  works,
  workImages,
  workTags,
  type BudgetRange,
  type RoomType,
  type WorkRow,
} from '@/lib/db/schema/works';
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
    ...normalizeWorkRow(r.work),
    coverPath: r.coverPath,
    coverAlt: r.coverAlt,
    tagCount: Number(r.tagCount ?? 0),
  }));
}

export type WorkDetail = WorkRow & {
  tagIds: number[];
};

/**
 * MariaDB stores `json` columns as longtext with a CHECK(json_valid()) and
 * the mysql2 driver returns them as raw strings — Drizzle's `$type<>()` is
 * compile-time only and does NOT parse on read. Every code path that reads
 * `works.materials` must run this normaliser, otherwise consumers will hit
 * `materials.map is not a function` at runtime.
 *
 * Acts on a mutated copy — never throws (defensive: if the stored JSON is
 * somehow malformed, return null rather than crash the page).
 */
function normalizeWorkRow<T extends WorkRow>(row: T): T {
  if (typeof row.materials === 'string') {
    try {
      const parsed = JSON.parse(row.materials);
      return { ...row, materials: Array.isArray(parsed) ? parsed : null };
    } catch {
      return { ...row, materials: null };
    }
  }
  return row;
}

export async function getWorkById(id: number): Promise<WorkDetail | null> {
  const [work] = await db.select().from(works).where(eq(works.id, id)).limit(1);
  if (!work) return null;
  const tagRows = await db
    .select({ tagId: workTags.tagId })
    .from(workTags)
    .where(eq(workTags.workId, id));
  return { ...normalizeWorkRow(work), tagIds: tagRows.map((r) => r.tagId) };
}

export const getPublishedWorkBySlug = cache(async (
  slug: string,
): Promise<WorkDetail | null> => {
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
  return { ...normalizeWorkRow(work), tagIds: tagRows.map((r) => r.tagId) };
});

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
      // v2.2 editorial fields — all nullable. createWork persists whatever the
      // form sent; updateWork (below) is the long-term write path.
      durationDays: input.durationDays ?? null,
      clientQuote: input.clientQuote ?? null,
      clientName: input.clientName ?? null,
      designerNote: input.designerNote ?? null,
      materials: input.materials ?? null,
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
    // v2.2 editorial fields — undefined = field omitted from form, leave DB
    // value untouched; null = admin cleared the field, persist as NULL.
    if (input.durationDays !== undefined)
      set.durationDays = input.durationDays ?? null;
    if (input.clientQuote !== undefined)
      set.clientQuote = input.clientQuote ?? null;
    if (input.clientName !== undefined)
      set.clientName = input.clientName ?? null;
    if (input.designerNote !== undefined)
      set.designerNote = input.designerNote ?? null;
    if (input.materials !== undefined)
      set.materials = input.materials ?? null;
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

/** Compact shape returned by listSimilarWorks — consumed by WorkCardCompact. */
export type WorkCompact = {
  id: number;
  slug: string;
  title: string;
  coverPath: string | null;
  roomType: RoomType;
  style: string | null;
  yearCompleted: number | null;
};

/**
 * Find published works similar to the given work (spec §14a).
 * Sequential fallback chain — stops as soon as we have enough results:
 *   1. Same style AND same roomType
 *   2. Same style OR same roomType
 *   3. Shares ≥1 tag (ordered by number of shared tags DESC)
 *   4. Return whatever we have (may be fewer than limit)
 */
export async function listSimilarWorks(
  workId: number,
  roomType: RoomType,
  style: string | null,
  limit: number,
): Promise<WorkCompact[]> {
  const base = and(eq(works.status, 'published'), ne(works.id, workId));

  const selectShape = {
    id: works.id,
    slug: works.slug,
    title: works.title,
    coverPath: mediaAssets.path,
    roomType: works.roomType,
    style: works.style,
    yearCompleted: works.yearCompleted,
  };

  const withCover = db
    .select(selectShape)
    .from(works)
    .leftJoin(mediaAssets, eq(mediaAssets.id, works.coverMediaAssetId));

  // Fallback 1: exact match
  if (style) {
    const rows = await withCover
      .where(and(base, eq(works.roomType, roomType), eq(works.style, style)))
      .orderBy(desc(works.publishedAt))
      .limit(limit);
    if (rows.length >= limit) return rows;
  }

  // Fallback 2: room OR style
  const orRows = await withCover
    .where(
      and(base, or(eq(works.roomType, roomType), style ? eq(works.style, style) : sql`FALSE`)),
    )
    .orderBy(desc(works.publishedAt))
    .limit(limit);
  if (orRows.length >= limit) return orRows;

  // Fallback 3: tag overlap — aggregate shared tag count
  const tagRows = await db
    .select({ ...selectShape, sharedTags: count(workTags.tagId) })
    .from(works)
    .leftJoin(mediaAssets, eq(mediaAssets.id, works.coverMediaAssetId))
    .innerJoin(workTags, eq(workTags.workId, works.id))
    .where(
      and(
        base,
        inArray(
          workTags.tagId,
          db.select({ tagId: workTags.tagId }).from(workTags).where(eq(workTags.workId, workId)),
        ),
      ),
    )
    .groupBy(works.id)
    .orderBy(desc(count(workTags.tagId)), desc(works.publishedAt))
    .limit(limit);

  return tagRows;
}

/**
 * Latest published works for bottom discovery grid (spec §14b).
 * Excludes the current work and any works already shown in the sidebar.
 * Returns up to `limit` results — fewer is acceptable (spec §22).
 */
export async function listLatestOtherWorks(
  workId: number,
  excludeIds: number[],
  limit: number,
): Promise<WorkListItem[]> {
  const allExcluded = [workId, ...excludeIds];

  const rows = await db
    .select({
      work: works,
      coverPath: mediaAssets.path,
      coverAlt: mediaAssets.alt,
      tagCount: sql<number>`(SELECT COUNT(*) FROM ${workTags} WHERE ${workTags.workId} = ${works.id})`,
    })
    .from(works)
    .leftJoin(mediaAssets, eq(mediaAssets.id, works.coverMediaAssetId))
    .where(and(eq(works.status, 'published'), notInArray(works.id, allExcluded)))
    .orderBy(desc(works.publishedAt))
    .limit(limit);

  return rows.map((r) => ({
    ...normalizeWorkRow(r.work),
    coverPath: r.coverPath,
    coverAlt: r.coverAlt,
    tagCount: Number(r.tagCount ?? 0),
  }));
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

// ── Public listing queries ─────────────────────────────────────

/**
 * Minimal shape required by the /works listing page cards.
 * Excludes heavy fields (bodyMdx, tone, accent, materials) not needed for the listing.
 */
export type WorkPublicListItem = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  roomType: RoomType;
  style: string | null;
  location: string | null;
  yearCompleted: number | null;
  areaSqm: string | null;
  budgetRange: BudgetRange | null;
  durationDays: number | null;
  coverPath: string | null;
  coverAlt: string | null;
};

/**
 * Paginated list of published works for the public /works listing page.
 * Filters compose with AND. tagSlug filter: if the tag doesn't exist, returns empty.
 * Ordering: published_at DESC, created_at DESC (stability on same publish date).
 */
export async function listPublishedWorks(input: {
  page: number;
  limit: number;
  roomType?: RoomType;
  style?: string;
  tagSlug?: string;
}): Promise<{ items: WorkPublicListItem[]; total: number; hasMore: boolean }> {
  const page = Math.max(1, input.page);
  const limit = Math.min(50, Math.max(1, input.limit));
  const offset = (page - 1) * limit;

  // Resolve tagSlug → tagId early; return empty if the tag doesn't exist.
  let tagWorkIds: number[] | undefined;
  if (input.tagSlug !== undefined) {
    const [tagRow] = await db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(eq(tagsTable.slug, input.tagSlug))
      .limit(1);
    if (!tagRow) return { items: [], total: 0, hasMore: false };
    const tagLinks = await db
      .select({ workId: workTags.workId })
      .from(workTags)
      .where(eq(workTags.tagId, tagRow.id));
    tagWorkIds = tagLinks.map((r) => r.workId);
    if (tagWorkIds.length === 0) return { items: [], total: 0, hasMore: false };
  }

  const baseFilter = and(
    eq(works.status, 'published'),
    input.roomType !== undefined ? eq(works.roomType, input.roomType) : undefined,
    input.style !== undefined ? eq(works.style, input.style) : undefined,
    tagWorkIds !== undefined ? inArray(works.id, tagWorkIds) : undefined,
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(works)
    .where(baseFilter);

  const rows = await db
    .select({
      id: works.id,
      slug: works.slug,
      title: works.title,
      summary: works.summary,
      roomType: works.roomType,
      style: works.style,
      location: works.location,
      yearCompleted: works.yearCompleted,
      areaSqm: works.areaSqm,
      budgetRange: works.budgetRange,
      durationDays: works.durationDays,
      coverPath: mediaAssets.path,
      coverAlt: mediaAssets.alt,
    })
    .from(works)
    .leftJoin(mediaAssets, eq(mediaAssets.id, works.coverMediaAssetId))
    .where(baseFilter)
    .orderBy(desc(works.publishedAt), desc(works.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map((r) => ({ ...r, areaSqm: r.areaSqm ?? null })),
    total: Number(total),
    hasMore: page * limit < Number(total),
  };
}

/**
 * Distinct style values from all published works, sorted A–Z.
 * Used to populate the style filter <Select> on the /works listing page.
 * Returns [] when no published works exist.
 */
export async function listDistinctWorkStyles(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ style: works.style })
    .from(works)
    .where(eq(works.status, 'published'))
    .orderBy(asc(works.style));
  return rows.map((r) => r.style);
}
