import {
  bigint,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

import { users } from './users';

/**
 * Free-pool media library. Every upload lands here regardless of whether it
 * will eventually be linked to a post, a work, both, or neither. Post and
 * work galleries reference assets through junction tables (post_images,
 * work_images) so the same asset can be re-used everywhere.
 */
export const mediaAssets = mysqlTable(
  'media_assets',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    uuid: varchar('uuid', { length: 36 }).notNull(),
    title: varchar('title', { length: 180 }).notNull().default(''),
    alt: varchar('alt', { length: 255 }).notNull().default(''),
    path: varchar('path', { length: 500 }).notNull(),
    mime: varchar('mime', { length: 64 }).notNull(),
    width: int('width').notNull().default(0),
    height: int('height').notNull().default(0),
    bytes: int('bytes').notNull().default(0),
    createdById: bigint('created_by_id', { mode: 'number' }).references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('media_assets_uuid_idx').on(t.uuid),
    index('media_assets_created_idx').on(t.createdAt),
    index('media_assets_title_idx').on(t.title),
  ],
);

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type MediaAssetInsertRow = typeof mediaAssets.$inferInsert;
