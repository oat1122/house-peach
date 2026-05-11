import {
  bigint,
  mysqlEnum,
  mysqlTable,
  smallint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const tagKindValues = ['post', 'work', 'both'] as const;
export type TagKind = (typeof tagKindValues)[number];

export const tags = mysqlTable(
  'tags',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    slug: varchar('slug', { length: 80 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    kind: mysqlEnum('kind', tagKindValues).notNull().default('both'),
    sort: smallint('sort').notNull().default(0),
  },
  (t) => [uniqueIndex('tags_slug_idx').on(t.slug)],
);

export type TagRow = typeof tags.$inferSelect;
export type TagInsert = typeof tags.$inferInsert;
