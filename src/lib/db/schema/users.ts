import {
  bigint,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const userRoleValues = ['admin', 'editor'] as const;

export const users = mysqlTable(
  'users',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerified: timestamp('email_verified'),
    image: varchar('image', { length: 500 }),
    role: mysqlEnum('role', userRoleValues).notNull().default('editor'),
    passwordHash: varchar('password_hash', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
);

export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type UserRole = (typeof userRoleValues)[number];
