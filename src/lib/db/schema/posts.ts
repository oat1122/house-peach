import {
  bigint,
  index,
  int,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

import { users } from './users';
import { mediaAssets } from './mediaAssets';
import { tags } from './tags';

export const contentStatusValues = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof contentStatusValues)[number];

export const posts = mysqlTable(
  'posts',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    slug: varchar('slug', { length: 140 }).notNull(),
    title: varchar('title', { length: 180 }).notNull(),
    excerpt: varchar('excerpt', { length: 280 }).notNull(),
    bodyMdx: mediumtext('body_mdx').notNull(),
    coverMediaAssetId: bigint('cover_media_asset_id', {
      mode: 'number',
    }).references(() => mediaAssets.id, { onDelete: 'set null' }),
    status: mysqlEnum('status', contentStatusValues).notNull().default('draft'),
    publishedAt: timestamp('published_at'),
    authorId: bigint('author_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    readingTimeMin: smallint('reading_time_min'),
    viewCount: int('view_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    uniqueIndex('posts_slug_idx').on(t.slug),
    index('posts_status_published_idx').on(t.status, t.publishedAt),
    index('posts_author_idx').on(t.authorId),
    index('posts_cover_idx').on(t.coverMediaAssetId),
  ],
);

/**
 * Junction: which library assets are attached to a post's gallery.
 * No cover flag here — the cover lives on posts.cover_media_asset_id.
 */
export const postImages = mysqlTable(
  'post_images',
  {
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    mediaAssetId: bigint('media_asset_id', { mode: 'number' })
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    sort: smallint('sort').notNull().default(0),
  },
  (t) => [
    uniqueIndex('post_images_pk').on(t.postId, t.mediaAssetId),
    index('post_images_asset_idx').on(t.mediaAssetId),
  ],
);

export const postTags = mysqlTable(
  'post_tags',
  {
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: bigint('tag_id', { mode: 'number' })
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [
    index('post_tags_tag_idx').on(t.tagId),
    uniqueIndex('post_tags_pk').on(t.postId, t.tagId),
  ],
);

export type PostRow = typeof posts.$inferSelect;
export type PostInsertRow = typeof posts.$inferInsert;
