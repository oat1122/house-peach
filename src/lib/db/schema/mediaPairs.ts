import {
  bigint,
  index,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

import { mediaAssets } from './mediaAssets';

/**
 * before/after pair tag on library assets. Both rows still exist
 * independently in media_assets; the pair is just metadata that admin and
 * the renderer can act on (BeforeAfterSlider picks two paired rows up).
 */
export const mediaPairs = mysqlTable(
  'media_pairs',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    beforeAssetId: bigint('before_asset_id', { mode: 'number' })
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    afterAssetId: bigint('after_asset_id', { mode: 'number' })
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 180 }).notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('media_pairs_assets_idx').on(t.beforeAssetId, t.afterAssetId),
    index('media_pairs_after_idx').on(t.afterAssetId),
  ],
);

export type MediaPairRow = typeof mediaPairs.$inferSelect;
export type MediaPairInsertRow = typeof mediaPairs.$inferInsert;
