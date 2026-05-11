---
name: add-blog-post
description: End-to-end procedure for shipping a new blog post in house-peach — DB row, MDX body authoring, cover image upload, tag links, publish flow (status flip + revalidateTag), SEO metadata + JSON-LD Article, sitemap inclusion. Use this skill when admin/editor is creating a new post, or when implementing the admin post-creation flow. Trigger on phrases like "create a blog post", "add post", "publish article", "new journal entry", "ship a post".
---

# Add a blog post

This skill is the end-to-end procedure for getting a new blog post from "nothing" to "live and indexed by Google".

## When to use

- Admin/editor wants to write and publish a new post
- Building or updating the admin post-creation UI
- Backfilling existing content into the system

## Prerequisites

The `posts` table + service functions + admin route must exist (Phase 4 deliverable). If they don't, run `drizzle-add-table` skill first.

## Procedure (admin-facing)

### 1. Draft

Open `/admin/posts/new`. Fill required fields:

| Field | Constraint |
|---|---|
| `title` | 4–180 chars, descriptive, contain primary keyword |
| `slug` | auto-generated from title; admin can edit before save; `^[a-z0-9-]+$`, ≤ 140 chars, UNIQUE |
| `excerpt` | 80–280 chars, used for meta description + card preview |
| `tagIds` | at least 1 tag (kind = `post` or `both`) |
| `bodyMdx` | ≥ 20 chars; written in CodeMirror; live preview shows what reader sees |
| `coverImageId` | nullable while draft; **required** before publish |
| `status` | `draft` initially |

Save (server action `createPost`) → row inserted with `publishedAt = NULL`, `status = 'draft'`.

### 2. Upload cover image

Via `MediaBrowser` or inline uploader. POSTs to `/api/upload` with `entity: 'post'`, `parentId: <newPostId>`. Returns `id` + paths for 3 variants. Set `post.coverImageId`.

### 3. Body MDX

Write markdown body in CodeMirror. Only whitelisted MDX components allowed (see `.claude/rules/content.md`):

- `## h2`, `### h3` (no `# h1` — that's the title rendered outside MDX)
- `**bold**`, `*italic*`, lists, tables (GFM)
- `<MDXImage src alt />` for inline images
- `<Quote>...</Quote>` for pull quotes
- `<Aside type="note|warning|tip">...</Aside>` for callouts
- `<Gallery images={[...]} />` for multi-image galleries
- `` ```ts ... ``` `` fenced code blocks (rehype-pretty-code highlights)

Raw `<script>`, `<iframe>`, `<style>` are stripped server-side.

### 4. Preview

`MdxPreview` debounces and calls a server action `previewMdx(source: string)` that runs `compileMdxToReact()` and returns rendered HTML. Admin sees the final output before publishing.

### 5. Publish

Toggle `status` to `published` and click Save. Server action `publishPost(id)`:

```ts
'use server';
export async function publishPost(id: number) {
  const session = await auth();
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'editor') {
    return { ok: false, error: 'Forbidden' };
  }
  // Validate publish-ready (cover image required, etc.)
  const p = await getPostById(id);
  if (!p.coverImageId) return { ok: false, error: 'Cover image required to publish' };

  await db.update(posts)
    .set({ status: 'published', publishedAt: new Date(), readingTimeMin: readingTime(p.bodyMdx) })
    .where(eq(posts.id, id));

  revalidateTag('posts');
  revalidateTag(`post:${id}`);
  revalidateTag('sitemap');
  return { ok: true };
}
```

ISR'd `/blog` and `/blog/[slug]` pick up the change within seconds.

## Procedure (engineer-facing — wiring the feature)

If this is the first time building the post-creation flow:

### 1. Schema (be-data)

Already in `src/lib/db/schema/posts.ts` + `postImages.ts` + `postTags.ts` (see ARCHITECTURE §5.2). If not, run `drizzle-add-table` skill.

### 2. Validation (be-data)

`src/lib/validation/post.ts`:

```ts
import { z } from 'zod';
import { Slug } from './common';

export const PostInsert = z.object({
  title: z.string().min(4, 'หัวข้อต้องยาวอย่างน้อย 4 ตัวอักษร').max(180),
  slug: Slug,
  excerpt: z.string().min(80, 'คำโปรยควรยาวอย่างน้อย 80 ตัวอักษร').max(280),
  bodyMdx: z.string().min(20),
  tagIds: z.array(z.coerce.number().int().positive()).min(1, 'เลือกอย่างน้อย 1 แท็ก'),
  coverImageId: z.coerce.number().int().positive().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});
export type PostInsert = z.infer<typeof PostInsert>;

export const PostUpdate = PostInsert.partial().extend({
  id: z.coerce.number().int().positive(),
});
```

### 3. Services (be-data)

`src/lib/services/post.ts`:

```ts
import 'server-only';
import { db } from '@/lib/db';
import { posts, postTags } from '@/lib/db/schema';
import { eq, and, desc, isNotNull } from 'drizzle-orm';
import { PostInsert } from '@/lib/validation/post';
import { auth } from '@/lib/auth';
import { revalidateTag } from 'next/cache';
import { readingTime } from '@/lib/utils/readingTime';

export async function createPost(input: unknown) {
  const session = await auth();
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'editor') {
    return { ok: false, error: 'Forbidden' };
  }
  const parsed = PostInsert.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid', issues: parsed.error.flatten() };
  const data = parsed.data;

  const id = await db.transaction(async (tx) => {
    const [{ id }] = await tx.insert(posts).values({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      bodyMdx: data.bodyMdx,
      coverImageId: data.coverImageId,
      status: data.status,
      authorId: Number(session.user.id),
      readingTimeMin: readingTime(data.bodyMdx),
    }).$returningId();

    if (data.tagIds.length) {
      await tx.insert(postTags).values(data.tagIds.map(tagId => ({ postId: id, tagId })));
    }
    return id;
  });

  revalidateTag('posts');
  revalidateTag(`post:${id}`);
  if (data.status === 'published') revalidateTag('sitemap');
  return { ok: true, id };
}

export async function getPostBySlug(slug: string) {
  return db.query.posts.findFirst({
    where: and(eq(posts.slug, slug), eq(posts.status, 'published')),
    with: { coverImage: true, author: true, postTags: { with: { tag: true } } },
  });
}

export async function listPublishedPosts(opts?: { tagSlug?: string; limit?: number; offset?: number }) {
  // ... join postTags + tags if filter, else simple select
}
```

### 4. Public detail page (fe-public)

`src/app/(public)/blog/[slug]/page.tsx`:

```tsx
import { compileMdxToReact } from '@/lib/mdx/compile';
import { getPostBySlug } from '@/lib/services/post';
import { notFound } from 'next/navigation';
import { env } from '@/env';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'ไม่พบบทความ — house-peach', robots: { index: false } };
  return {
    title: `${post.title} — house-peach`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title, description: post.excerpt, type: 'article',
      images: post.coverImage ? [`${env.NEXT_PUBLIC_SITE_URL}${post.coverImage.path}`] : [],
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

export const revalidate = 60;

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const mdx = await compileMdxToReact(post.bodyMdx);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [`${env.NEXT_PUBLIC_SITE_URL}${post.coverImage.path}`] : [],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author.name },
    publisher: { '@type': 'Organization', name: 'house-peach' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="prose mx-auto px-4">
        <h1>{post.title}</h1>
        <p className="text-muted">{post.publishedAt?.toLocaleDateString('th-TH')} · อ่าน {post.readingTimeMin} นาที</p>
        {mdx}
      </article>
    </>
  );
}
```

### 5. Admin post editor (fe-admin)

`src/app/(admin)/admin/posts/new/page.tsx` — wraps `PostEditor` client component (see fe-admin.md).

## Verify

Manual checklist after first publish:

- [ ] `/blog` listing shows the new post
- [ ] `/blog/<slug>` renders title, excerpt, body, cover
- [ ] View page source — JSON-LD `BlogPosting` present + parses
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) passes
- [ ] Lighthouse SEO ≥ 95
- [ ] `/sitemap.xml` includes the new slug
- [ ] `<h2>` headings have anchor `#id` links (rehype-slug working)
- [ ] Code block (if any) has syntax highlight (rehype-pretty-code)
- [ ] `<script>` in body is stripped (security test)

## Don'ts

- Don't publish without cover image (zod will block, but admin UI should warn earlier)
- Don't bypass `revalidateTag` — ISR cache will lag
- Don't allow non-whitelist HTML in body — security boundary
- Don't store author name as string — use FK to users so name updates propagate
- Don't compute reading time on every render — precompute on save
