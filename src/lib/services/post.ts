import 'server-only';
import { cache } from 'react';
import { and, count, desc, eq, inArray, like, ne, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { bumpPostById, bumpTag, tags as cacheTags } from '@/lib/cache-tags';
import { mediaAssets } from '@/lib/db/schema/mediaAssets';
import {
  posts,
  postTags,
  type ContentStatus,
  type PostRow,
} from '@/lib/db/schema/posts';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { users } from '@/lib/db/schema/users';
import { readingTime } from '@/lib/utils/readingTime';
import type { PostInsert, PostUpdate } from '@/lib/validation/post';

// ── Shared shape helpers ───────────────────────────────────────────────────────

/** Author columns included in every public read. */
const authorCols = {
  authorName: users.name,
  authorImage: users.image,
} as const;

/** Cover asset columns included in every public read. */
const coverCols = {
  coverPath: mediaAssets.path,
  coverAlt: mediaAssets.alt,
} as const;

// ── Public types ───────────────────────────────────────────────────────────────

/**
 * Full post shape returned by `getPublishedPostBySlug`.
 * Includes status so the detail page can apply `noindex` for archived posts
 * per content.md § Status flow without a second DB hit.
 */
export type PostDetail = PostRow & {
  authorName: string | null;
  authorImage: string | null;
  coverPath: string | null;
  coverAlt: string | null;
  tagIds: number[];
  tagNames: string[];
};

/** Compact shape for listing cards — heavy fields (bodyMdx) excluded. */
export type PostListItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  status: PostRow['status'];
  publishedAt: Date | null;
  updatedAt: Date;
  readingTimeMin: number | null;
  authorName: string | null;
  authorImage: string | null;
  coverPath: string | null;
  coverAlt: string | null;
};

// ── Detail query ───────────────────────────────────────────────────────────────

/**
 * Fetch a post by slug for the public detail page.
 *
 * Returns published AND archived posts (archived pages still render, but with
 * `robots: { index: false }` per content.md § Status flow). Drafts are never
 * returned — they are invisible to the public site.
 *
 * Uses React's `cache()` so repeated calls within one RSC render tree (e.g.,
 * generateMetadata + page) share a single DB round-trip.
 *
 * Slug encoding: tries NFC first (current output of slugify()), falls back to
 * NFKD for legacy rows written before Unicode normalisation was enforced.
 * Mirrors the same pattern used in `getPublishedWorkBySlug`.
 */
export const getPublishedPostBySlug = cache(async (
  slug: string,
): Promise<PostDetail | null> => {
  const nfc = slug.normalize('NFC');
  const nfd = slug.normalize('NFKD');
  const candidates = nfc === nfd ? [nfc] : [nfc, nfd];

  let post: PostRow | undefined;
  for (const candidate of candidates) {
    [post] = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.slug, candidate),
          // Draft is the only status excluded from the public site.
          // Archived posts render with noindex — caller decides.
          or(eq(posts.status, 'published'), eq(posts.status, 'archived')),
        ),
      )
      .limit(1);
    if (post) break;
  }
  if (!post) return null;

  const [authorRow, coverRow, tagRows] = await Promise.all([
    db
      .select({ name: users.name, image: users.image })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1),
    post.coverMediaAssetId
      ? db
          .select({ path: mediaAssets.path, alt: mediaAssets.alt })
          .from(mediaAssets)
          .where(eq(mediaAssets.id, post.coverMediaAssetId))
          .limit(1)
      : Promise.resolve<{ path: string; alt: string }[]>([]),
    db
      .select({ tagId: postTags.tagId, name: tagsTable.name })
      .from(postTags)
      .innerJoin(tagsTable, eq(tagsTable.id, postTags.tagId))
      .where(eq(postTags.postId, post.id)),
  ]);

  return {
    ...post,
    authorName: authorRow[0]?.name ?? null,
    authorImage: authorRow[0]?.image ?? null,
    coverPath: coverRow[0]?.path ?? null,
    coverAlt: coverRow[0]?.alt ?? null,
    tagIds: tagRows.map((r) => r.tagId),
    tagNames: tagRows.map((r) => r.name),
  };
});

// ── Listing query ──────────────────────────────────────────────────────────────

/**
 * Paginated published-posts listing for /blog.
 * Optionally filters by tag slug — returns empty when the tag doesn't exist.
 * Always orders by `publishedAt DESC, createdAt DESC` for stable paging.
 */
export async function listPublishedPosts(input: {
  page: number;
  perPage?: number;
  tagSlug?: string;
}): Promise<{ posts: PostListItem[]; total: number; hasMore: boolean }> {
  const page = Math.max(1, input.page);
  const perPage = Math.min(50, Math.max(1, input.perPage ?? 12));
  const offset = (page - 1) * perPage;

  // Resolve optional tag filter → post id list.
  let tagPostIds: number[] | undefined;
  if (input.tagSlug !== undefined) {
    const [tagRow] = await db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(eq(tagsTable.slug, input.tagSlug))
      .limit(1);
    if (!tagRow) return { posts: [], total: 0, hasMore: false };

    const tagLinks = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tagId, tagRow.id));
    tagPostIds = tagLinks.map((r) => r.postId);
    if (tagPostIds.length === 0) return { posts: [], total: 0, hasMore: false };
  }

  const baseFilter = and(
    eq(posts.status, 'published'),
    tagPostIds !== undefined ? inArray(posts.id, tagPostIds) : undefined,
  );

  const [{ total }] = await db.select({ total: count() }).from(posts).where(baseFilter);

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      readingTimeMin: posts.readingTimeMin,
      ...authorCols,
      ...coverCols,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .leftJoin(mediaAssets, eq(mediaAssets.id, posts.coverMediaAssetId))
    .where(baseFilter)
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(perPage)
    .offset(offset);

  return {
    posts: rows,
    total: Number(total),
    hasMore: page * perPage < Number(total),
  };
}

// ── Related / recent helpers ───────────────────────────────────────────────────

/**
 * Posts sharing tags with `post`, excluding itself.
 * Falls back to latest published posts when no shared-tag results exist.
 * Returns up to `limit` items — fewer is acceptable.
 */
export async function listRelatedPosts(
  post: Pick<PostRow, 'id'> & { tagIds: number[] },
  limit = 4,
): Promise<PostListItem[]> {
  const selectCols = {
    id: posts.id,
    slug: posts.slug,
    title: posts.title,
    excerpt: posts.excerpt,
    status: posts.status,
    publishedAt: posts.publishedAt,
    updatedAt: posts.updatedAt,
    readingTimeMin: posts.readingTimeMin,
    ...authorCols,
    ...coverCols,
  };

  // Tag-matched candidates when the post has tags.
  if (post.tagIds.length > 0) {
    const rows = await db
      .select(selectCols)
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .leftJoin(mediaAssets, eq(mediaAssets.id, posts.coverMediaAssetId))
      .where(
        and(
          eq(posts.status, 'published'),
          ne(posts.id, post.id),
          inArray(
            posts.id,
            db.select({ postId: postTags.postId })
              .from(postTags)
              .where(inArray(postTags.tagId, post.tagIds)),
          ),
        ),
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit);
    if (rows.length > 0) return rows;
  }

  // Fallback: latest published (excluding self).
  return db
    .select(selectCols)
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .leftJoin(mediaAssets, eq(mediaAssets.id, posts.coverMediaAssetId))
    .where(and(eq(posts.status, 'published'), ne(posts.id, post.id)))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

/**
 * Most-recent published posts — sidebar widget.
 * Optionally excludes a post by id (the currently viewed post).
 */
export async function listRecentPosts(input: {
  excludeId?: number;
  limit?: number;
}): Promise<PostListItem[]> {
  const limit = Math.min(20, Math.max(1, input.limit ?? 4));

  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      readingTimeMin: posts.readingTimeMin,
      ...authorCols,
      ...coverCols,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .leftJoin(mediaAssets, eq(mediaAssets.id, posts.coverMediaAssetId))
    .where(
      and(
        eq(posts.status, 'published'),
        input.excludeId !== undefined ? ne(posts.id, input.excludeId) : undefined,
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

// ── Admin queries ──────────────────────────────────────────────────────────────

/**
 * Admin-side post row. Differs from public PostListItem by including the
 * tag count + view count (admin signals) and dropping authorImage (admin
 * table renders a text-only column for author).
 */
export type AdminPostListItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  status: ContentStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  readingTimeMin: number | null;
  coverPath: string | null;
  coverAlt: string | null;
  authorName: string | null;
  tagCount: number;
};

/**
 * List posts for the admin index. Supports status filter and free-text search
 * over title/slug. Returns all rows regardless of status (admin needs visibility
 * into drafts + archived).
 */
export async function listPostsForAdmin(input?: {
  status?: ContentStatus | 'all';
  q?: string;
  limit?: number;
}): Promise<AdminPostListItem[]> {
  const status = input?.status ?? 'all';
  const limit = Math.min(500, Math.max(1, input?.limit ?? 200));
  // Cap q before it reaches the LIKE wildcard — a 500-char `%`-soup pattern
  // forces MariaDB into a full-table scan even with our row-limit applied.
  const q = input?.q?.trim().slice(0, 100);

  const where = [];
  if (status !== 'all') where.push(eq(posts.status, status));
  if (q) {
    const pattern = `%${q}%`;
    where.push(or(like(posts.title, pattern), like(posts.slug, pattern))!);
  }

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      status: posts.status,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      viewCount: posts.viewCount,
      readingTimeMin: posts.readingTimeMin,
      coverPath: mediaAssets.path,
      coverAlt: mediaAssets.alt,
      authorName: users.name,
      tagCount: sql<number>`(SELECT COUNT(*) FROM ${postTags} WHERE ${postTags.postId} = ${posts.id})`,
    })
    .from(posts)
    .leftJoin(mediaAssets, eq(mediaAssets.id, posts.coverMediaAssetId))
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(where.length > 0 ? and(...where) : undefined)
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    tagCount: Number(r.tagCount ?? 0),
  }));
}

/** Admin-only shape — includes tagIds for the edit form tag picker. */
export type AdminPostDetail = PostRow & { tagIds: number[] };

/**
 * Fetch a post by id for the admin edit form. Includes any status (draft /
 * published / archived) — the admin can edit all three.
 */
export async function getPostById(id: number): Promise<AdminPostDetail | null> {
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) return null;
  const tagRows = await db
    .select({ tagId: postTags.tagId })
    .from(postTags)
    .where(eq(postTags.postId, id));
  return { ...post, tagIds: tagRows.map((r) => r.tagId) };
}

/**
 * List tags admins can attach to a post — kind ∈ {post, both}. Same shape
 * as `listWorkTagOptions` so the form's tag-pill component is interchangeable.
 */
export async function listPostTagOptions() {
  return db
    .select({
      id: tagsTable.id,
      slug: tagsTable.slug,
      name: tagsTable.name,
      kind: tagsTable.kind,
    })
    .from(tagsTable)
    .where(inArray(tagsTable.kind, ['post', 'both']))
    .orderBy(tagsTable.sort, tagsTable.name);
}

// ── Admin mutations ────────────────────────────────────────────────────────────

export class PostSlugTakenError extends Error {
  constructor() {
    super('slug นี้ถูกใช้แล้ว — ลองเปลี่ยน');
    this.name = 'PostSlugTakenError';
  }
}

async function assertPostSlugAvailable(slug: string, excludeId?: number) {
  const [existing] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  if (existing && existing.id !== excludeId) {
    throw new PostSlugTakenError();
  }
}

/**
 * Create a new post. `authorId` is taken from the session at the action layer
 * — never from form input. `readingTimeMin` is precomputed from bodyMdx.
 */
export async function createPost(
  input: PostInsert,
  authorId: number,
): Promise<number> {
  await assertPostSlugAvailable(input.slug);
  const id = await db.transaction(async (tx) => {
    const result = await tx.insert(posts).values({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      bodyMdx: input.bodyMdx,
      coverMediaAssetId: input.coverMediaAssetId ?? null,
      status: input.status,
      publishedAt:
        input.status === 'published'
          ? (input.publishedAt ?? new Date())
          : null,
      authorId,
      readingTimeMin: readingTime(input.bodyMdx),
    });
    const insertId = (result as unknown as { insertId?: number }[])[0]?.insertId;
    if (!insertId) throw new Error('Failed to insert post');

    if (input.tagIds.length > 0) {
      await ensurePostTagsExist(tx, input.tagIds);
      await tx
        .insert(postTags)
        .values(input.tagIds.map((tagId) => ({ postId: insertId, tagId })));
    }

    return insertId;
  });

  bumpPostById(id);
  return id;
}

/**
 * Patch-style update — only fields present in `input` are written. Allows the
 * admin form to omit fields the user didn't touch (matches WorkForm pattern).
 * Recomputes `readingTimeMin` whenever bodyMdx is included.
 */
export async function updatePost(input: PostUpdate): Promise<void> {
  if (input.slug) await assertPostSlugAvailable(input.slug, input.id);

  await db.transaction(async (tx) => {
    const set: Record<string, unknown> = {};
    if (input.title !== undefined) set.title = input.title;
    if (input.slug !== undefined) set.slug = input.slug;
    if (input.excerpt !== undefined) set.excerpt = input.excerpt;
    if (input.bodyMdx !== undefined) {
      set.bodyMdx = input.bodyMdx;
      set.readingTimeMin = readingTime(input.bodyMdx);
    }
    if (input.coverMediaAssetId !== undefined)
      set.coverMediaAssetId = input.coverMediaAssetId ?? null;
    if (input.status !== undefined) {
      set.status = input.status;
      if (input.status === 'published') {
        // Stamp publishedAt only on the first publish — preserve original
        // date through archive/unarchive cycles.
        set.publishedAt = sql`COALESCE(${posts.publishedAt}, NOW())`;
      }
    }

    if (Object.keys(set).length > 0) {
      await tx.update(posts).set(set).where(eq(posts.id, input.id));
    }

    if (input.tagIds !== undefined) {
      await tx.delete(postTags).where(eq(postTags.postId, input.id));
      if (input.tagIds.length > 0) {
        await ensurePostTagsExist(tx, input.tagIds);
        await tx
          .insert(postTags)
          .values(input.tagIds.map((tagId) => ({ postId: input.id, tagId })));
      }
    }
  });

  bumpPostById(input.id);
}

export async function setPostStatus(
  id: number,
  status: ContentStatus,
): Promise<void> {
  const set: Record<string, unknown> = { status };
  if (status === 'published') {
    set.publishedAt = sql`COALESCE(${posts.publishedAt}, NOW())`;
  }
  await db.update(posts).set(set).where(eq(posts.id, id));
  bumpPostById(id);
}

export async function deletePost(id: number): Promise<void> {
  // FK ON DELETE CASCADE drops post_images / post_tags. The cover row in
  // mediaAssets is preserved (FK is ON DELETE SET NULL on posts.cover_… side).
  await db.delete(posts).where(eq(posts.id, id));
  bumpTag(cacheTags.posts);
  bumpTag(cacheTags.post(id));
  bumpTag(cacheTags.sitemap);
}

async function ensurePostTagsExist(
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
