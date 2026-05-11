# Database rules

หลักการสำหรับ Drizzle ORM + MariaDB / MySQL ทุกการอ่าน/เขียน DB

## Drizzle conventions

### Schema files

- หนึ่งตาราง = หนึ่งไฟล์ใน `src/lib/db/schema/`
- ชื่อไฟล์เป็น camelCase ตามชื่อตาราง — ตาราง `work_images` → `workImages.ts`
- ตั้ง column name แบบ `snake_case` ใน DB แต่ JS field เป็น `camelCase` (drizzle รองรับ via `text('display_name')`)
- ใส่ `relations()` ใน `src/lib/db/relations.ts` เสมอเมื่อมี FK — ทำให้ query nested ใช้ `with:` ได้

ตัวอย่าง:
```ts
// src/lib/db/schema/posts.ts
export const posts = mysqlTable('posts', {
  id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
  slug: varchar('slug', { length: 140 }).notNull().unique(),
  title: varchar('title', { length: 180 }).notNull(),
  bodyMdx: mediumtext('body_mdx').notNull(),
  status: mysqlEnum('status', ['draft','published','archived']).notNull().default('draft'),
  // ...
});
```

### Migrations

- รันผ่าน `drizzle-kit generate` แล้ว `drizzle-kit migrate` (หรือ `push` ใน dev) — ห้ามแก้ migration file ที่ generate แล้วด้วยมือ
- ทุก commit ที่แตะ schema ต้อง commit migration file ที่ generate มาด้วย — peer reviewer จะเช็คว่ามี diff ตรงกัน
- ห้าม `db:push` บน production — push ทับ data ได้ ใช้ `db:migrate` เท่านั้น

## Server-only enforcement

ทุกไฟล์ใน `src/lib/db/` และ `src/lib/services/` ต้องมี `import 'server-only'` ที่บรรทัดแรก
จุดประสงค์: ถ้ามี client component import เข้ามาโดยไม่ตั้งใจ build จะ error ทันที — ป้องกัน leak DB
credentials หรือ schema ลง bundle

```ts
// src/lib/services/post.ts (บรรทัดแรก)
import 'server-only';
import { db } from '@/lib/db';
```

## Where queries live

- **อนุญาต:** `src/lib/services/*` และ Server Actions inline ใน RSC
- **ห้าม:** raw SQL ใน route handler โดยตรง, query ใน client component, query ใน middleware (ใช้ session token / cookie แทน)

ทุก query ต้องผ่าน Drizzle builder — `db.select()`, `db.insert()`, etc. ห้าม `sql.raw()` ยกเว้นกรณีจำเป็นจริง
และต้อง parameterize ผ่าน `sql\`... ${param}\``

## Transactions for mutations ที่กระทบหลายตาราง

ใช้ `db.transaction()` เมื่อ:
- Insert post + insert post_images + insert post_tags junction (3 ตาราง)
- Insert work + insert work_images (กับ kind=before/after/process/detail) + insert work_tags
- Delete post → cascade ไป post_images + post_tags ผ่าน FK `ON DELETE CASCADE`

```ts
await db.transaction(async (tx) => {
  // ทุก operation ใน block นี้เป็น atomic
});
```

## Cache invalidation invariant — ห้ามผ่อน

ทุก mutation ที่เปลี่ยน content ของ post/work ต้อง **`revalidateTag()`** ทันทีหลัง commit transaction:

```ts
import { revalidateTag } from 'next/cache';

await db.transaction(async (tx) => {
  await tx.update(posts).set({ /* ... */ }).where(eq(posts.id, id));
  // ...
});

revalidateTag('posts');           // listing pages /blog
revalidateTag(`post:${id}`);      // detail page /blog/[slug]
revalidateTag('sitemap');         // sitemap.xml
```

ทุก service function ที่เป็น write **ต้อง** ระบุชัด ๆ ว่า invalidate tag ไหนบ้าง:

| Mutation | Tags to invalidate |
|---|---|
| `createPost` / `updatePost` (status=published) | `posts`, `post:<id>`, `sitemap` |
| `archivePost` | `posts`, `post:<id>`, `sitemap` |
| `createWork` / `updateWork` (status=published) | `works`, `work:<id>`, `sitemap` |
| `createContactInquiry` | (ไม่มี — internal admin only) |

**Invariant:** ทุก page ที่เป็น ISR (`revalidate: 60` หรือมี tag) ต้อง consistent กับ DB ภายใน 1 นาทีของ mutation. ถ้าหน้าเก่าโผล่ขึ้นมาคือ bug ของการลืม revalidateTag

เหตุผล: SEO ranking ขึ้นกับ freshness — Google crawl แล้วเห็น stale content คือเสีย credit

## Connection management

- `src/lib/db/index.ts` export drizzle client ตัวเดียว (singleton) — ใช้ connection pool ของ `mysql2`
- ห้ามสร้าง connection ใหม่ใน route handler / service — ทุกที่ import จาก `@/lib/db`
- Pool size ตั้งใน env `DB_POOL_SIZE` (default 10)

## Soft delete vs hard delete

ใช้ `status` enum แทน hard delete สำหรับ `posts`, `works`:
- `posts.status: 'draft' | 'published' | 'archived'`
- `works.status: 'draft' | 'published' | 'archived'`

ตาราง junction (e.g., `post_tags`, `work_tags`) ใช้ hard delete ปกติ. รูปภาพ (`post_images`, `work_images`)
ลบจริง (พร้อมไฟล์ใน storage) เมื่อ admin ลบ — เก็บไว้ก็เปลือง storage

เหตุผล: backlink ภายนอกที่ link มาที่ archived post ห้ามได้ 404 — ให้ render หน้า "บทความนี้ถูกเก็บแล้ว"
+ noindex แทน

## Indexes ที่ต้องมี

- `posts(slug)` UNIQUE — ทุก detail route ใช้
- `posts(status, published_at DESC)` — listing query
- `works(slug)` UNIQUE
- `works(status, published_at DESC)`
- `works(room_type, style)` — filter combo
- `tags(slug)` UNIQUE
- ทุก FK column ต้องมี index (drizzle generate ให้ปกติ — verify ใน migration SQL)

ถ้าเพิ่ม column ที่ใช้ filter บ่อย ต้องเพิ่ม index ในไฟล์ schema:

```ts
{ ... },
(t) => [
  index('posts_status_published_idx').on(t.status, t.publishedAt),
],
```
