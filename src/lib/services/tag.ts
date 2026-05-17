import 'server-only';
import { and, asc, eq, like, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { bumpTags } from '@/lib/cache-tags';
import { postTags } from '@/lib/db/schema/posts';
import {
  tags as tagsTable,
  tagKindValues,
  type TagKind,
  type TagRow,
} from '@/lib/db/schema/tags';
import { workTags } from '@/lib/db/schema/works';
import type { TagInsert, TagUpdate } from '@/lib/validation/tag';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Admin-side tag row including the resolved usage counts on each side of the
 * `kind` enum. The counts are computed with correlated subqueries so the
 * listing query stays a single round-trip.
 */
export type AdminTagItem = TagRow & {
  postCount: number;
  workCount: number;
};

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * List tags for the admin index. Optional `kind` filter and free-text search
 * over name/slug. Always orders by (sort ASC, name ASC) — same ordering used
 * by the `listPostTagOptions` / `listWorkTagOptions` pickers so admins see
 * the same row order across surfaces.
 */
export async function listTagsForAdmin(input?: {
  kind?: TagKind | 'all';
  q?: string;
  limit?: number;
}): Promise<AdminTagItem[]> {
  const kind = input?.kind ?? 'all';
  const limit = Math.min(500, Math.max(1, input?.limit ?? 200));
  const q = input?.q?.trim();

  const where = [];
  if (kind !== 'all' && tagKindValues.includes(kind as TagKind)) {
    where.push(eq(tagsTable.kind, kind as TagKind));
  }
  if (q) {
    const pattern = `%${q}%`;
    where.push(or(like(tagsTable.name, pattern), like(tagsTable.slug, pattern))!);
  }

  const rows = await db
    .select({
      id: tagsTable.id,
      slug: tagsTable.slug,
      name: tagsTable.name,
      kind: tagsTable.kind,
      sort: tagsTable.sort,
      postCount: sql<number>`(SELECT COUNT(*) FROM ${postTags} WHERE ${postTags.tagId} = ${tagsTable.id})`,
      workCount: sql<number>`(SELECT COUNT(*) FROM ${workTags} WHERE ${workTags.tagId} = ${tagsTable.id})`,
    })
    .from(tagsTable)
    .where(where.length > 0 ? and(...where) : undefined)
    .orderBy(asc(tagsTable.sort), asc(tagsTable.name))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    postCount: Number(r.postCount ?? 0),
    workCount: Number(r.workCount ?? 0),
  }));
}

export async function getTagById(id: number): Promise<TagRow | null> {
  const [row] = await db
    .select()
    .from(tagsTable)
    .where(eq(tagsTable.id, id))
    .limit(1);
  return row ?? null;
}

// ── Writes ───────────────────────────────────────────────────────────────────

export class TagSlugTakenError extends Error {
  constructor() {
    super('slug นี้ถูกใช้แล้ว — ลองเปลี่ยน');
    this.name = 'TagSlugTakenError';
  }
}

async function assertTagSlugAvailable(slug: string, excludeId?: number) {
  const [existing] = await db
    .select({ id: tagsTable.id })
    .from(tagsTable)
    .where(eq(tagsTable.slug, slug))
    .limit(1);
  if (existing && existing.id !== excludeId) {
    throw new TagSlugTakenError();
  }
}

export async function createTag(input: TagInsert): Promise<number> {
  await assertTagSlugAvailable(input.slug);

  const result = await db.insert(tagsTable).values({
    slug: input.slug,
    name: input.name,
    kind: input.kind,
    sort: input.sort,
  });
  const insertId = (result as unknown as { insertId?: number }[])[0]?.insertId;
  if (!insertId) throw new Error('Failed to insert tag');

  bumpTags();
  return insertId;
}

/**
 * Patch-style update — only fields present in `input` are written.
 * Note: kind changes do NOT remove existing junction rows. If an admin
 * narrows a `both` tag to `post`, any currently-attached works keep the
 * tag; they just won't see it in the work-side picker for future edits.
 * V2 may surface a warning here — V1 trusts the admin.
 */
export async function updateTag(input: TagUpdate): Promise<void> {
  if (input.slug) await assertTagSlugAvailable(input.slug, input.id);

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.slug !== undefined) set.slug = input.slug;
  if (input.kind !== undefined) set.kind = input.kind;
  if (input.sort !== undefined) set.sort = input.sort;

  if (Object.keys(set).length === 0) return;

  await db.update(tagsTable).set(set).where(eq(tagsTable.id, input.id));
  bumpTags();
}

/**
 * Hard delete. FK `ON DELETE CASCADE` on `post_tags` + `work_tags` removes
 * the links automatically; the post/work rows themselves are untouched.
 */
export async function deleteTag(id: number): Promise<void> {
  await db.delete(tagsTable).where(eq(tagsTable.id, id));
  bumpTags();
}
