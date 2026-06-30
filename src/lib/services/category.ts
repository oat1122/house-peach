import 'server-only';
import { and, asc, eq, inArray, like, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { bumpCategories } from '@/lib/cache-tags';
import { isDuplicateKeyError } from '@/lib/db/errors';
import {
  categories as categoriesTable,
  categoryKindValues,
  type CategoryKind,
  type CategoryRow,
} from '@/lib/db/schema/categories';
import { posts } from '@/lib/db/schema/posts';
import { works } from '@/lib/db/schema/works';
import type { CategoryInsert, CategoryUpdate } from '@/lib/validation/category';

// ── Types ────────────────────────────────────────────────────────────────────

/** Admin row with resolved usage counts on each content surface. */
export type AdminCategoryItem = CategoryRow & {
  postCount: number;
  workCount: number;
};

/** Lightweight option for the single-select category picker in post/work forms. */
export type CategoryOption = Pick<
  CategoryRow,
  'id' | 'name' | 'slug' | 'kind' | 'color'
>;

/** One content row that references this category (for the detail-page usage list). */
export type CategoryUsageItem = {
  id: number;
  kind: 'post' | 'work';
  title: string;
  slug: string;
  status: string;
};

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * List categories for the admin index. Optional `kind` filter + free-text
 * search over name/slug. Usage counts are correlated subqueries so the listing
 * stays a single round-trip — same shape as `listTagsForAdmin`.
 */
export async function listCategoriesForAdmin(input?: {
  kind?: CategoryKind | 'all';
  q?: string;
  limit?: number;
}): Promise<AdminCategoryItem[]> {
  const kind = input?.kind ?? 'all';
  const limit = Math.min(500, Math.max(1, input?.limit ?? 200));
  const q = input?.q?.trim();

  const where = [];
  if (kind !== 'all' && categoryKindValues.includes(kind as CategoryKind)) {
    where.push(eq(categoriesTable.kind, kind as CategoryKind));
  }
  if (q) {
    const pattern = `%${q}%`;
    where.push(
      or(
        like(categoriesTable.name, pattern),
        like(categoriesTable.slug, pattern),
      )!,
    );
  }

  const rows = await db
    .select({
      id: categoriesTable.id,
      slug: categoriesTable.slug,
      name: categoriesTable.name,
      kind: categoriesTable.kind,
      color: categoriesTable.color,
      summary: categoriesTable.summary,
      sort: categoriesTable.sort,
      postCount: sql<number>`(SELECT COUNT(*) FROM ${posts} WHERE ${posts.categoryId} = ${categoriesTable.id})`,
      workCount: sql<number>`(SELECT COUNT(*) FROM ${works} WHERE ${works.categoryId} = ${categoriesTable.id})`,
    })
    .from(categoriesTable)
    .where(where.length > 0 ? and(...where) : undefined)
    .orderBy(asc(categoriesTable.sort), asc(categoriesTable.name))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    postCount: Number(r.postCount ?? 0),
    workCount: Number(r.workCount ?? 0),
  }));
}

export async function getCategoryById(id: number): Promise<CategoryRow | null> {
  const [row] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * Options for the single-select category picker. `kind` narrows to categories
 * usable on that surface — a post picks from {post, both}, a work from
 * {work, both}. Ordered (sort ASC, name ASC) to match the admin list.
 */
export async function listCategoryOptions(
  kind: 'post' | 'work',
): Promise<CategoryOption[]> {
  const usable: CategoryKind[] = kind === 'post' ? ['post', 'both'] : ['work', 'both'];
  return db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      kind: categoriesTable.kind,
      color: categoriesTable.color,
    })
    .from(categoriesTable)
    .where(inArray(categoriesTable.kind, usable))
    .orderBy(asc(categoriesTable.sort), asc(categoriesTable.name));
}

/** Content rows (posts + works) referencing this category — for the detail page. */
export async function listCategoryUsage(
  id: number,
): Promise<CategoryUsageItem[]> {
  const [postRows, workRows] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
      })
      .from(posts)
      .where(eq(posts.categoryId, id))
      .limit(50),
    db
      .select({
        id: works.id,
        title: works.title,
        slug: works.slug,
        status: works.status,
      })
      .from(works)
      .where(eq(works.categoryId, id))
      .limit(50),
  ]);

  return [
    ...postRows.map((r) => ({ ...r, kind: 'post' as const })),
    ...workRows.map((r) => ({ ...r, kind: 'work' as const })),
  ];
}

// ── Writes ───────────────────────────────────────────────────────────────────

export class CategorySlugTakenError extends Error {
  constructor() {
    super('slug นี้ถูกใช้แล้ว — ลองเปลี่ยน');
    this.name = 'CategorySlugTakenError';
  }
}

async function assertCategorySlugAvailable(slug: string, excludeId?: number) {
  const [existing] = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slug))
    .limit(1);
  if (existing && existing.id !== excludeId) {
    throw new CategorySlugTakenError();
  }
}

export async function createCategory(input: CategoryInsert): Promise<number> {
  await assertCategorySlugAvailable(input.slug);

  // Same non-atomic pre-check + UNIQUE-index backstop as createTag — convert a
  // 1062 race into the domain error so the form gets a useful fieldErrors.slug.
  let insertId: number | undefined;
  try {
    const result = await db.insert(categoriesTable).values({
      slug: input.slug,
      name: input.name,
      kind: input.kind,
      color: input.color,
      summary: input.summary,
      sort: input.sort,
    });
    insertId = (result as unknown as { insertId?: number }[])[0]?.insertId;
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new CategorySlugTakenError();
    throw err;
  }
  if (!insertId) throw new Error('Failed to insert category');

  bumpCategories();
  return insertId;
}

/** Patch-style update — only fields present in `input` are written. */
export async function updateCategory(input: CategoryUpdate): Promise<void> {
  if (input.slug) await assertCategorySlugAvailable(input.slug, input.id);

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.slug !== undefined) set.slug = input.slug;
  if (input.kind !== undefined) set.kind = input.kind;
  if (input.color !== undefined) set.color = input.color;
  if (input.summary !== undefined) set.summary = input.summary;
  if (input.sort !== undefined) set.sort = input.sort;

  if (Object.keys(set).length === 0) return;

  try {
    await db
      .update(categoriesTable)
      .set(set)
      .where(eq(categoriesTable.id, input.id));
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new CategorySlugTakenError();
    throw err;
  }
  bumpCategories();
}

/**
 * Hard delete. FK `ON DELETE SET NULL` on posts/works clears the reference;
 * the content rows themselves are untouched (just become uncategorised).
 */
export async function deleteCategory(id: number): Promise<void> {
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  bumpCategories();
}
