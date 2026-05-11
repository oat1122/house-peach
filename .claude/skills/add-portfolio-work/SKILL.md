---
name: add-portfolio-work
description: End-to-end procedure for shipping a new portfolio work (completed home decoration project) in house-peach — DB row, MDX summary + body, gallery composition (before/after/process/detail kinds), cover image, tag links, publish flow (status + revalidateTag), SEO metadata + JSON-LD CreativeWork. Use this skill when admin is adding a new completed project, or when implementing the admin work-creation flow. Trigger on phrases like "add a work", "new portfolio entry", "publish a project", "showcase a room", "before after gallery".
---

# Add a portfolio work

This skill is the end-to-end procedure for documenting a finished home-decoration project in the studio's portfolio.

## When to use

- Admin/editor wants to add a new completed project
- Building or updating the admin work-creation UI
- Backfilling old portfolio into the system

## Prerequisites

`works`, `work_images`, `work_tags` tables must exist (see ARCHITECTURE §5.3). If not, run `drizzle-add-table` skill first.

## Procedure (admin-facing)

### 1. Draft

Open `/admin/works/new`. Fill required fields:

| Field | Constraint |
|---|---|
| `title` | 4–180 chars |
| `slug` | auto-generated; `^[a-z0-9-]+$`, ≤ 140 chars, UNIQUE |
| `summary` | 80–280 chars — short pitch for cards + meta description |
| `bodyMdx` | long-form description (process, decisions, materials) |
| `roomType` | enum: `living` `bedroom` `kitchen` `bathroom` `office` `outdoor` `full_house` `other` |
| `style` | varchar(60) e.g. `'minimalist'`, `'japandi'`, `'mid-century'`, `'tropical'` |
| `tagIds` | at least 1 tag |
| `coverImageId` | **required** before publish |
| `yearCompleted`, `location`, `areaSqm`, `budgetRange` | optional but recommended for SEO + filter |
| `status` | `draft` initially |

### 2. Upload gallery

Multi-image upload. For each image set:
- `kind`: `before` | `after` | `process` | `detail`
- `alt`: descriptive text (e.g., "ห้องนั่งเล่นหลังตกแต่ง สไตล์ Japandi โทนพีช")
- `caption` (optional): short note shown under image
- `sort`: drag-reorder
- Mark one as `isCover`

Composition guideline:
- **at least 1 `after`** image (default — every work needs the "result")
- **paired `before` + `after`** if you have both — engagement is much higher
- `process` images for storytelling (mood boards, fabric swatches)
- `detail` close-ups go at the bottom of the page

### 3. Body MDX

Same whitelist as blog posts. Suggested structure:

```mdx
## ภาพรวมโปรเจกต์
ห้องนั่งเล่นใจกลางคอนโดสุขุมวิท เนื้อที่ 24 ตร.ม. งบประมาณ...

## ความท้าทาย
แสงธรรมชาติน้อย เพดานต่ำ...

## แนวคิดการออกแบบ
<Aside type="tip">Japandi คือการผสาน...</Aside>

<MDXImage src="/uploads/works/<uuid>/800.webp" alt="..." />

## วัสดุที่เลือก
- พื้นไม้โอ๊ค...

## ผลลัพธ์
<Gallery images={[...]} />
```

### 4. Publish

Server action `publishWork(id)` — same shape as `publishPost`:

```ts
revalidateTag('works');
revalidateTag(`work:${id}`);
revalidateTag(`works:room:${work.roomType}`);   // if you cache per-room listing
revalidateTag('sitemap');
```

## Procedure (engineer-facing — wiring the feature)

### 1. Schema (be-data)

Already in `src/lib/db/schema/works.ts` + `workImages.ts` + `workTags.ts`. If not, run `drizzle-add-table`.

### 2. Validation (be-data)

`src/lib/validation/work.ts`:

```ts
import { z } from 'zod';
import { Slug } from './common';

export const roomTypeEnum = ['living','bedroom','kitchen','bathroom','office','outdoor','full_house','other'] as const;
export const budgetRangeEnum = ['under_100k','100k_300k','300k_700k','700k_1.5m','1.5m_plus'] as const;
export const workImageKindEnum = ['before','after','process','detail'] as const;

export const WorkImageInput = z.object({
  id: z.coerce.number().int().positive().optional(),     // existing image
  path: z.string().min(1),
  alt: z.string().min(2).max(255),
  caption: z.string().max(280).nullable(),
  kind: z.enum(workImageKindEnum).default('after'),
  sort: z.coerce.number().int().nonnegative().default(0),
  isCover: z.boolean().default(false),
});

export const WorkInsert = z.object({
  title: z.string().min(4).max(180),
  slug: Slug,
  summary: z.string().min(80).max(280),
  bodyMdx: z.string().min(20),
  roomType: z.enum(roomTypeEnum),
  style: z.string().min(2).max(60),
  yearCompleted: z.coerce.number().int().min(2000).max(2100).nullable(),
  location: z.string().max(120).nullable(),
  areaSqm: z.coerce.number().positive().nullable(),
  budgetRange: z.enum(budgetRangeEnum).nullable(),
  tagIds: z.array(z.coerce.number().int().positive()).min(1),
  coverImageId: z.coerce.number().int().positive().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  images: z.array(WorkImageInput).default([]),
}).refine(d => d.status !== 'published' || d.coverImageId, {
  message: 'ต้องเลือก cover image ก่อน publish',
  path: ['coverImageId'],
}).refine(d => d.status !== 'published' || d.images.some(i => i.kind === 'after'), {
  message: 'ต้องมีรูป after อย่างน้อย 1 รูปก่อน publish',
  path: ['images'],
});
export type WorkInsert = z.infer<typeof WorkInsert>;
```

### 3. Services (be-data)

`src/lib/services/work.ts` — similar pattern to `post.ts` but with image array handling in transaction:

```ts
export async function createWork(input: unknown) {
  const session = await auth();
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'editor') {
    return { ok: false, error: 'Forbidden' };
  }
  const parsed = WorkInsert.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid', issues: parsed.error.flatten() };
  const data = parsed.data;

  const id = await db.transaction(async (tx) => {
    const [{ id }] = await tx.insert(works).values({
      title: data.title, slug: data.slug, summary: data.summary, bodyMdx: data.bodyMdx,
      roomType: data.roomType, style: data.style,
      yearCompleted: data.yearCompleted, location: data.location,
      areaSqm: data.areaSqm, budgetRange: data.budgetRange,
      coverImageId: data.coverImageId, status: data.status,
    }).$returningId();

    if (data.tagIds.length) {
      await tx.insert(workTags).values(data.tagIds.map(tagId => ({ workId: id, tagId })));
    }
    // Images already uploaded earlier (rows in work_images exist). If we're attaching new ones:
    // … insert new work_images rows; update sort/kind/alt for existing rows
    return id;
  });

  revalidateTag('works');
  revalidateTag(`work:${id}`);
  if (data.status === 'published') revalidateTag('sitemap');
  return { ok: true, id };
}
```

### 4. Public detail page (fe-public)

`src/app/(public)/works/[slug]/page.tsx`:

```tsx
import { compileMdxToReact } from '@/lib/mdx/compile';
import { getWorkBySlug } from '@/lib/services/work';
import { WorkGallery } from '@/components/public/WorkGallery';
import { env } from '@/env';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) return { title: 'ไม่พบผลงาน — house-peach', robots: { index: false } };
  return {
    title: `${work.title} — house-peach`,
    description: work.summary,
    alternates: { canonical: `/works/${work.slug}` },
    openGraph: {
      title: work.title, description: work.summary, type: 'article',
      images: work.coverImage ? [`${env.NEXT_PUBLIC_SITE_URL}${work.coverImage.path}`] : [],
    },
  };
}

export const revalidate = 60;

export default async function WorkPage({ params }) {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) notFound();
  const mdx = await compileMdxToReact(work.bodyMdx);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: work.title,
    description: work.summary,
    image: work.images.map(i => `${env.NEXT_PUBLIC_SITE_URL}${i.path}`),
    creator: { '@type': 'Organization', name: 'house-peach' },
    dateCreated: work.yearCompleted ? `${work.yearCompleted}-01-01` : undefined,
    contentLocation: work.location ? { '@type': 'Place', name: work.location } : undefined,
    keywords: work.tags.map(t => t.name).join(', '),
    about: work.roomType,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-4">
        <h1>{work.title}</h1>
        <p className="text-muted">{work.roomType} · {work.style} {work.location && `· ${work.location}`}</p>
        <WorkGallery images={work.images} />
        <div className="prose mt-8">{mdx}</div>
      </article>
    </>
  );
}
```

### 5. Gallery component (fe-public)

`WorkGallery` is a client component:
- Renders cover image as hero
- If `before` + `after` exist: render `<BeforeAfterSlider>` (interactive drag-divider)
- Then a grid of `process` + `detail` images
- Lightbox on tap (use `yet-another-react-lightbox` if needed — install on demand)

## Verify

- [ ] `/works` listing shows the new entry
- [ ] `/works/<slug>` renders gallery, body, JSON-LD
- [ ] Rich Results Test (Google) accepts CreativeWork
- [ ] Filter by room/style on `/works` includes this entry
- [ ] Sitemap includes `/works/<slug>`
- [ ] `before` and `after` images stack correctly on mobile

## Don'ts

- Don't publish without cover image (zod refinement blocks)
- Don't publish without at least 1 `after` image (zod refinement blocks)
- Don't store image paths absolute (e.g., `https://...`) — use relative `/uploads/...` so swap to S3 later is transparent
- Don't compute `kind` from filename — it's an explicit admin choice
