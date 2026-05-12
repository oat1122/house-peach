import {
  bigint,
  boolean,
  decimal,
  index,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

import { mediaAssets } from './mediaAssets';
import { mediaPairs } from './mediaPairs';
import { contentStatusValues } from './posts';
import { tags } from './tags';

export const roomTypeValues = [
  'living',
  'bedroom',
  'kitchen',
  'bathroom',
  'office',
  'outdoor',
  'full_house',
  'other',
] as const;
export type RoomType = (typeof roomTypeValues)[number];

export const budgetRangeValues = [
  'under_100k',
  '100k_300k',
  '300k_700k',
  '700k_1.5m',
  '1.5m_plus',
] as const;
export type BudgetRange = (typeof budgetRangeValues)[number];

export const workImageKindValues = [
  'before',
  'after',
  'process',
  'detail',
] as const;
export type WorkImageKind = (typeof workImageKindValues)[number];

export const works = mysqlTable(
  'works',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    slug: varchar('slug', { length: 140 }).notNull(),
    title: varchar('title', { length: 180 }).notNull(),
    summary: varchar('summary', { length: 280 }).notNull(),
    bodyMdx: mediumtext('body_mdx').notNull(),
    roomType: mysqlEnum('room_type', roomTypeValues).notNull(),
    style: varchar('style', { length: 60 }).notNull(),
    yearCompleted: smallint('year_completed'),
    location: varchar('location', { length: 120 }),
    areaSqm: decimal('area_sqm', { precision: 7, scale: 2 }),
    budgetRange: mysqlEnum('budget_range', budgetRangeValues),
    coverMediaAssetId: bigint('cover_media_asset_id', {
      mode: 'number',
    }).references(() => mediaAssets.id, { onDelete: 'set null' }),
    tone: varchar('tone', { length: 7 }).notNull().default('#f5d6c0'),
    accent: varchar('accent', { length: 7 }).notNull().default('#a87856'),
    status: mysqlEnum('status', contentStatusValues).notNull().default('draft'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    uniqueIndex('works_slug_idx').on(t.slug),
    index('works_status_published_idx').on(t.status, t.publishedAt),
    index('works_room_style_idx').on(t.roomType, t.style),
    index('works_cover_idx').on(t.coverMediaAssetId),
  ],
);

/**
 * Junction: a library asset attached to a work, with gallery role.
 * When two rows share the same `pairId`, the renderer treats them as a
 * before/after pair (BeforeAfterSlider).
 */
export const workImages = mysqlTable(
  'work_images',
  {
    workId: bigint('work_id', { mode: 'number' })
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    mediaAssetId: bigint('media_asset_id', { mode: 'number' })
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    kind: mysqlEnum('kind', workImageKindValues).notNull().default('after'),
    pairId: bigint('pair_id', { mode: 'number' }).references(
      () => mediaPairs.id,
      { onDelete: 'set null' },
    ),
    caption: varchar('caption', { length: 280 }),
    sort: smallint('sort').notNull().default(0),
    // Admin-flagged "featured" — masonry layout gives these a 2×2 tile so the
    // best shots anchor the grid. Non-featured tiles take their natural
    // aspect ratio in 1×1 cells.
    isFeatured: boolean('is_featured').notNull().default(false),
  },
  (t) => [
    uniqueIndex('work_images_pk').on(t.workId, t.mediaAssetId),
    index('work_images_asset_idx').on(t.mediaAssetId),
    index('work_images_pair_idx').on(t.pairId),
  ],
);

export const workTags = mysqlTable(
  'work_tags',
  {
    workId: bigint('work_id', { mode: 'number' })
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    tagId: bigint('tag_id', { mode: 'number' })
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [
    index('work_tags_tag_idx').on(t.tagId),
    uniqueIndex('work_tags_pk').on(t.workId, t.tagId),
  ],
);

export type WorkRow = typeof works.$inferSelect;
export type WorkInsertRow = typeof works.$inferInsert;
