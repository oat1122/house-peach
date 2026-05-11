---
name: drizzle-add-table
description: Step-by-step procedure for adding a new MariaDB table to house-peach with Drizzle ORM — schema file, relations, migration generation, seed update, service file, zod schema, FK indexes, charset/collation. Use this skill whenever the data model needs a new entity (e.g., comments, newsletter subscribers, related-posts links, FAQ entries). Trigger on phrases like "new table for", "add table", "create entity", "model X in DB", "database for Y", "store X in DB".
---

# Drizzle: add a new table

This skill is the end-to-end procedure for adding a new table to the project. Skip a step and the data layer drifts.

## When to use

- A new entity needs storage (e.g., `reviews`, `wishlists`, `addresses`)
- Splitting an existing table (e.g., extracting `post_translations` from `posts` if multi-language)

## Procedure

### 1. Schema file

Create `src/lib/db/schema/<entity>.ts`:

```ts
import {
  mysqlTable, bigint, varchar, text, decimal, timestamp, mysqlEnum, index, uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { posts } from './posts';

export const comments = mysqlTable('comments', {
  id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
  postId: bigint('post_id', { mode: 'number' }).notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  authorName: varchar('author_name', { length: 80 }).notNull(),
  authorEmail: varchar('author_email', { length: 255 }).notNull(),
  body: text('body').notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  postIdx: index('comments_post_idx').on(t.postId),    // FK index
  statusIdx: index('comments_status_idx').on(t.status),
}));
```

Conventions:
- Table name `snake_case`, JS export `camelCase`
- Column names `snake_case` in DB, `camelCase` in JS via `varchar('display_name')` arg
- Add explicit index on every FK column (drizzle doesn't always — verify in migration SQL)
- Use `mysqlEnum` for fixed-set strings (status, role, reason)
- `bigint` for IDs (we may exceed `int` range)
- `decimal(10, 2)` for currency — never `float`
- `timestamp` with `defaultNow()` for `created_at`

### 2. Add to schema barrel (if exists)

```ts
// src/lib/db/schema/index.ts
export * from './posts';
export * from './comments';   // <— add
```

### 3. Define relations

```ts
// src/lib/db/relations.ts
import { relations } from 'drizzle-orm';
import { posts, comments } from './schema';

export const postsRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
}));
```

This enables nested queries:
```ts
db.query.posts.findFirst({ with: { comments: true } });
```

### 4. Generate migration

```bash
npx drizzle-kit generate
```

This emits `src/lib/db/migrations/<timestamp>_<name>.sql`. **Read the generated SQL** to verify:

- `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` (set in `drizzle.config.ts`)
- All FK columns indexed
- ENUM declared correctly
- Defaults set

If something looks wrong, fix the schema and re-generate — never edit the migration file by hand.

### 5. Apply locally

```bash
npx drizzle-kit migrate         # production-style
# or for fast dev iteration:
npx drizzle-kit push             # don't use on prod
```

### 6. Add zod schemas

```ts
import { z } from 'zod';

export const ReviewInsert = z.object({
  postId: z.coerce.number().int().positive(),
  authorName: z.string().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(10).max(2000),
});
export type ReviewInsert = z.infer<typeof ReviewInsert>;

export const ReviewUpdate = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(['pending', 'approved', 'rejected']),
});
export type ReviewUpdate = z.infer<typeof ReviewUpdate>;

// What we expose to the public storefront
export const ReviewPublic = z.object({
  id: z.number(),
  authorName: z.string(),
  rating: z.number(),
  body: z.string(),
  createdAt: z.date(),
});
export type ReviewPublic = z.infer<typeof ReviewPublic>;
```

### 7. Add service file

`src/lib/services/comment.ts`:

```ts
import 'server-only';
import { db } from '@/lib/db';
import { comments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CommentInsert, CommentModerate } from '@/lib/validation/comment';
import { auth } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

export async function listApprovedComments(postId: number) {
  return db.select()
    .from(comments)
    .where(and(eq(comments.postId, postId), eq(comments.status, 'approved')))
    .orderBy(desc(comments.createdAt));
}

export async function createComment(input: unknown) {
  const parsed = CommentInsert.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid', issues: parsed.error.flatten() };
  const [{ id }] = await db.insert(comments).values(parsed.data).$returningId();
  // status defaults to 'pending' — does NOT show until moderated; no public revalidate needed yet
  return { ok: true, id };
}

export async function moderateComment(input: unknown) {
  const session = await auth();
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'editor') {
    return { ok: false, error: 'Forbidden' };
  }
  const parsed = CommentModerate.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid' };
  await db.update(comments).set({ status: parsed.data.status }).where(eq(comments.id, parsed.data.id));
  if (parsed.data.status === 'approved') {
    const [c] = await db.select().from(comments).where(eq(comments.id, parsed.data.id));
    if (c) revalidateTag(`post:${c.postId}`);
  }
  return { ok: true };
}
```

### 8. Update seed (if applicable)

```ts
// scripts/seed.ts
await db.insert(comments).values([
  { postId: 1, authorName: 'Demo User', authorEmail: 'demo@example.com',
    body: 'บทความให้แรงบันดาลใจดีมาก ขอบคุณค่ะ', status: 'approved' },
]);
```

### 9. Add tests

`src/lib/services/review.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createComment, listApprovedComments } from './comment';

describe('createComment', () => {
  it('inserts a pending comment', async () => {
    const r = await createComment({ postId: 1, authorName: 'A', authorEmail: 'a@example.com', body: 'ขอบคุณมากครับ' });
    expect(r.ok).toBe(true);
  });
  it('rejects when body too short', async () => {
    const r = await createComment({ postId: 1, authorName: 'A', authorEmail: 'a@example.com', body: 'ok' });
    expect(r.ok).toBe(false);
  });
});
```

### 10. Hand off

- Tell `db-migration-reviewer` to review the generated migration
- Tell consuming agents (`fe-public`, `fe-admin`) the new service signatures
- Update `ARCHITECTURE.md` §6 (data model) if the relationship graph changed

## Verify

```bash
npm run build                     # types compile
npx drizzle-kit check             # detects schema/migration drift
npm test -- comment                # service tests
```

## Don'ts

- Don't edit generated migration files by hand
- Don't push to production with `db:push` — use `db:migrate`
- Don't omit FK indexes — query perf will tank as data grows
- Don't use `varchar(N)` without thinking about N — too short truncates, too long wastes index space
- Don't use `CASCADE` on FK without understanding the deletion graph (e.g., deleting a `category` shouldn't cascade-delete `products` — use `RESTRICT`)
