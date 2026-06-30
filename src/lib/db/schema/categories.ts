import {
  bigint,
  mysqlEnum,
  mysqlTable,
  smallint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const categoryKindValues = ['post', 'work', 'both'] as const;
export type CategoryKind = (typeof categoryKindValues)[number];

/**
 * Editorial category — one primary bucket per post/work (single-select FK on
 * `posts`/`works`), distinct from the many-to-many `tags`. Shares the same
 * `kind` enum so the admin UI can filter categories by surface. Adds `color`
 * (theme swatch shown on cards) + `summary` (short description) over tags.
 */
export const categories = mysqlTable(
  'categories',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    slug: varchar('slug', { length: 80 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    kind: mysqlEnum('kind', categoryKindValues).notNull().default('both'),
    color: varchar('color', { length: 7 }),
    summary: varchar('summary', { length: 280 }),
    sort: smallint('sort').notNull().default(0),
  },
  (t) => [uniqueIndex('categories_slug_idx').on(t.slug)],
);

export type CategoryRow = typeof categories.$inferSelect;
export type CategoryInsertRow = typeof categories.$inferInsert;
