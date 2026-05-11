---
name: add-server-action
description: How to author a Next.js 16 server action in house-peach — zod-validated input, role-based auth check, drizzle mutation in a transaction, cache revalidation via revalidateTag, error handling that returns useful info to RHF. Use this skill whenever a frontend agent needs a new mutation endpoint (create product, update cart, submit quote, etc.) or when refactoring existing actions for consistency. Trigger on phrases like "server action for X", "add a mutation", "create product action", "submit handler", "form submit endpoint".
---

# Add a server action

This skill is the canonical pattern for write-side data mutations in house-peach. Server actions live in `src/lib/services/<domain>.ts` and are imported by RSC/client components.

## When to use

- Frontend needs to create / update / delete data
- A form submit handler that mutates DB
- A user-triggered side effect (favorite, add to cart, place order)
- Don't use this for reads — read-side data access is plain async functions in services

## The pattern

Every server action follows:

1. `'use server'` directive (file-level if all functions in file are actions, or per-function inline)
2. Validate input with the zod schema from `src/lib/validation/<domain>.ts`
3. Auth check (when applicable)
4. Drizzle mutation, transaction-wrapped if multi-table
5. `revalidateTag` / `revalidatePath` to invalidate caches
6. Return either the new resource or a typed result envelope

## Template — single-table create

```ts
// src/lib/services/post.ts
import 'server-only';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { PostInsert } from '@/lib/validation/post';
import { auth } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

export async function createPost(input: unknown) {
  // 1. Auth check
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, error: 'Forbidden' as const };
  }

  // 2. Validate
  const parsed = PostInsert.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid', issues: parsed.error.flatten() };
  }

  // 3. Mutate
  const [row] = await db.insert(posts).values(parsed.data).$returningId();

  // 4. Invalidate cache
  revalidateTag('posts');
  revalidateTag(`post:${row.id}`);
  revalidateTag('sitemap');

  return { ok: true, id: row.id };
}
```

> Mark file with `'use server'` at the top if you intend `createProduct` to be called from client components. Otherwise it's just a server-only utility.

## Template — multi-table mutation in a transaction

```ts
// src/lib/services/post.ts
'use server';
import 'server-only';
import { db } from '@/lib/db';
import { posts, postTags } from '@/lib/db/schema';
import { PostInsert } from '@/lib/validation/post';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

export async function savePost(input: unknown) {
  const parsed = PostInsert.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid', issues: parsed.error.flatten() };
  const data = parsed.data;

  try {
    const postId = await db.transaction(async (tx) => {
      const [{ id }] = await tx.insert(posts).values({
        title: data.title, slug: data.slug, excerpt: data.excerpt,
        bodyMdx: data.bodyMdx, coverImageId: data.coverImageId,
        status: data.status,
      }).$returningId();

      if (data.tagIds.length) {
        // Replace existing tag links atomically: delete then insert
        await tx.delete(postTags).where(eq(postTags.postId, id));
        await tx.insert(postTags).values(
          data.tagIds.map(tagId => ({ postId: id, tagId }))
        );
      }
      return id;
    });

    revalidateTag('posts');
    revalidateTag(`post:${postId}`);
    if (data.status === 'published') revalidateTag('sitemap');
    return { ok: true, postId };
  } catch (err) {
    // Log and surface generic
    console.error('savePost failed', err);
    return { ok: false, error: 'Internal' };
  }
}

```

## Calling from React Hook Form

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { savePost } from '@/lib/services/post';

export function PostForm() {
  const form = useForm({ resolver: zodResolver(PostInsert) });

  const onSubmit = async (data: PostInsert) => {
    const r = await savePost(data);
    if (!r.ok) {
      if (r.error === 'Invalid') {
        // map issues into form.setError
      } else form.setError('root', { message: 'Something went wrong. Please try again.' });
      return;
    }
    redirect(`/admin/posts/${r.postId}/edit`);
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## Cache invalidation rules

For each mutation, decide which caches to invalidate:

| Mutation | Tags to invalidate |
|---|---|
| createPost / updatePost (status=published) | `posts`, `post:<id>`, `sitemap` |
| archivePost | `posts`, `post:<id>`, `sitemap` |
| createWork / updateWork (status=published) | `works`, `work:<id>`, `sitemap` |
| createContactInquiry | (none — internal admin only) |

In RSC:

```ts
const posts = await db.select().from(posts).$cache({ tags: ['posts'] });
```

(Or use `unstable_cache` wrapper — check Next 16 docs for the current API.)

## Result envelope convention

Always return `{ ok: true, ... }` or `{ ok: false, error: '...', ... }` — typed as a discriminated union. Avoids throwing across the RSC payload boundary.

```ts
type ServiceResult<T> =
  | { ok: true } & T
  | { ok: false; error: string; issues?: ZodFlattenedError; [k: string]: unknown };
```

## Don'ts

- Don't `throw` from a server action expecting client to catch — Next will turn it into a generic 500. Use the result envelope.
- Don't skip auth check — middleware doesn't cover server actions
- Don't skip the auth check just because middleware exists — server actions can be called directly
- Don't forget `revalidateTag` — stale pages will linger
- Don't return raw DB errors to client (info disclosure) — log + return `Internal`
