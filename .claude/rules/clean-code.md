# Clean code & reuse rules

หลักการเขียนโค้ดให้อ่านง่าย + ใช้ซ้ำได้ — ทุก agent อ่านก่อนเขียน feature ใหม่หรือ refactor

> **ปรัชญา:** *เขียนน้อย — ใช้ซ้ำของเดิม — ลบเป็น* โค้ดที่ดีที่สุดคือโค้ดที่ไม่ต้องเขียน

---

## 1. Reuse priority — ก่อนเขียนใหม่ ต้องเช็คก่อน

ทุกครั้งก่อนสร้างไฟล์ใหม่ / function ใหม่ / component ใหม่ ต้องเช็คตามลำดับ:

1. **มีใน repo แล้วหรือเปล่า?** — `grep` / `Glob` หา keyword ที่เกี่ยวข้อง
2. **มีใน library ที่ install แล้วหรือเปล่า?** — เช็ค `package.json` (lodash-es, date-fns, zod helpers, radix utils)
3. **มีใน shadcn registry หรือเปล่า?** (ถ้าเป็น UI) — ดู `stack.md` § Component sourcing
4. **เขียนใหม่** — เฉพาะเมื่อ 1-3 ไม่เจอ + มีเหตุผลใน PR description

### Search checklist ก่อนเขียน

| ต้องการ | Grep keyword | location ที่ควรเช็ค |
|---|---|---|
| Slug / URL helper | `slugify`, `toSlug` | `lib/utils/slug.ts` |
| Date format | `Intl.DateTimeFormat`, `formatDate` | `lib/utils/` |
| Image helper | `getImageUrl`, `imageVariant` | `lib/services/image.ts` |
| Auth check | `auth()`, `requireRole` | `lib/auth.ts`, `lib/actions/` |
| Zod schema | `<Domain>Insert`, `<Domain>Update` | `lib/validation/` |
| DB query | `getPost`, `listWorks` | `lib/services/` |
| UI primitive | (Button, Card, Dialog, ...) | `components/ui/` |
| Layout block | (Hero, PostCard, Footer) | `components/public/` |

---

## 2. Rule of three — เมื่อไหร่ extract

- **1 ครั้ง:** inline เลย ไม่ต้อง extract
- **2 ครั้ง:** อาจ duplicate ได้ ถ้า context ต่างกัน — duplicate code ดีกว่า wrong abstraction
- **3 ครั้ง:** extract เป็น function / component / hook

ห้าม **premature abstraction** — เห็น 1 ใช้ แล้ว extract ทันที จะกลายเป็น API ที่ผิด สมมติฐานเปลี่ยน + ต้อง refactor ทั้ง chain

> "Duplication is far cheaper than the wrong abstraction" — Sandi Metz

### ตัวอย่าง — เห็นซ้ำแบบไหนถึง extract

```ts
// ✓ เห็น pattern ซ้ำ 3 จุด → extract
const featuredPosts = posts.filter(p => p.status === 'published' && p.isFeatured);
const featuredWorks = works.filter(w => w.status === 'published' && w.isFeatured);
const featuredTags  = tags.filter(t => t.status === 'published' && t.isFeatured);
// → extract helper `getFeatured<T>(items: T[])` ใน `lib/utils/`

// ✗ เห็นแค่จุดเดียว ห้าม extract premature
function calculateReadingTimeWithFancyOptions(...) { /* over-designed */ }
```

---

## 3. File / function size

### Files

- **Component file** ≤ 200 บรรทัด — เกินคือควรแตก
- **Service file** ≤ 300 บรรทัด — เกินคือ domain ใหญ่เกิน ต้องแยก (e.g., `post.ts` → `post.read.ts` + `post.write.ts`)
- **Schema file (Drizzle)** ≤ 100 บรรทัด — เกินคือ table มี column เยอะผิดปกติ ถามก่อน
- **Route handler** ≤ 50 บรรทัด — logic หนัก ๆ ต้องอยู่ใน `lib/services/`

### Functions

- **Component function** ≤ 100 บรรทัด — เกินคือต้องแตกเป็น sub-component
- **Service function** ≤ 50 บรรทัด — เกินคือทำหลาย responsibility
- **Utility** ≤ 20 บรรทัด — pure function ที่ใหญ่กว่านี้คือ "service" แล้ว ย้าย folder
- **Nesting** ≤ 3 levels — เกินใช้ early return / extract

### Early return ดีกว่า nested if

```ts
// ✗ nested
function publishPost(post, user) {
  if (user) {
    if (user.role === 'admin') {
      if (post.status === 'draft') {
        // ... 30 lines
      }
    }
  }
}

// ✓ early return
function publishPost(post, user) {
  if (!user) throw new Error('Unauthenticated');
  if (user.role !== 'admin') throw new Error('Forbidden');
  if (post.status !== 'draft') throw new Error('Already published');
  // ... main logic
}
```

---

## 4. Naming

### Booleans

ใช้ verb prefix: `is`, `has`, `should`, `can`, `did`

```ts
const isPublished = post.status === 'published';
const hasGallery = work.images.length > 0;
const canEdit = session.user.role === 'admin';
```

### Functions — verb-first

| Action | Prefix |
|---|---|
| query single | `get*` (`getPostBySlug`) |
| query list | `list*` (`listPublishedPosts`) |
| mutation create | `create*` |
| mutation update | `update*` |
| mutation delete | `delete*` / `archive*` |
| boolean check | `is*` / `has*` / `can*` |
| transform | `to*` / `format*` (`toSlug`, `formatDate`) |
| event handler | `on*` / `handle*` (`onSubmit`, `handleUpload`) |

### Variables — descriptive ไม่ย่อ

```ts
// ✗
const p = await db.select().from(posts);
const cnt = items.length;

// ✓
const publishedPosts = await db.select().from(posts);
const itemCount = items.length;
```

ยกเว้น: `i`, `j` ใน loop, `e` ใน event handler, `ctx` ใน server action context

### File naming — ดู `folder-structure.md` § File naming

---

## 5. Comments — minimal, WHY not WHAT

**Default:** ไม่ใส่ comment

ใส่ comment เฉพาะเมื่อ:
- **WHY** ไม่ชัดเจน — มี constraint ซ่อน, workaround bug, business rule แปลก
- **TODO** ที่ track ไว้ (พร้อม issue / PR link)
- **Type annotation** ที่ TS infer ไม่ได้

### ห้ามทำ

```ts
// ✗ บอก WHAT ที่ identifier บอกอยู่แล้ว
// Increment counter
counter += 1;

// ✗ อ้างถึง task / PR / issue ปัจจุบัน — rot เร็ว
// Added for issue #123 — used by admin panel
function getPostBySlug() { }

// ✗ block comment ที่อธิบายโค้ดข้างล่าง
/**
 * This function gets a post by slug.
 * It returns null if not found.
 * @param slug The slug to search for
 * @returns The post or null
 */
function getPostBySlug(slug: string) { }
```

### ทำได้

```ts
// ✓ WHY ที่ซ่อน
// Use bigint mode because post id can exceed Number.MAX_SAFE_INTEGER after 2030
id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),

// ✓ workaround ที่อธิบาย root cause
// next-mdx-remote ส่ง undefined ให้ children เมื่อ MDX body empty — fall back to ''
const body = props.children ?? '';

// ✓ TODO with link
// TODO(#42): swap to S3ImageStore when deploy target = Vercel
```

---

## 6. Dead code — ลบทันที

- **ห้าม comment-out code** — `git history` คือ memory ของ project
- **ห้าม `// removed: ...` หรือ `// old code:`** — diff ใน git ดูได้
- **ห้าม keep unused export** — ถ้าไม่มีใคร import ลบทันที (เช็คด้วย `Grep`)
- **ห้าม unused variable / import** — ESLint จับให้ ถ้า warning โผล่ต้องเคลียร์ก่อน commit

```ts
// ✗
function publishPost(id) {
  // const oldLogic = doStuff(id); // removed 2024
  // if (legacy) { ... }
  return newLogic(id);
}

// ✓ ลบให้หมด
function publishPost(id) {
  return newLogic(id);
}
```

---

## 7. Magic numbers / strings → const

```ts
// ✗
if (excerpt.length > 280) throw new Error('Too long');
setTimeout(cb, 86400000);

// ✓
const EXCERPT_MAX_LENGTH = 280;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

if (excerpt.length > EXCERPT_MAX_LENGTH) throw new Error('Too long');
setTimeout(cb, MS_PER_DAY);
```

ยกเว้น: 0, 1, -1, 2 (common math), HTTP status code ที่อ่านง่าย (200, 404)

---

## 8. Imports — clean + sorted

ESLint จัดให้แล้ว แต่หลักคือ:

```ts
// 1. node built-in
import { readFile } from 'node:fs/promises';

// 2. external packages
import { z } from 'zod';
import { eq } from 'drizzle-orm';

// 3. internal — absolute alias
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema/posts';
import { Button } from '@/components/ui/button';

// 4. types-only (separate)
import type { Metadata } from 'next';
import type { Post } from '@/lib/validation/post';
```

- ห้าม relative `../../foo` (ดู `folder-structure.md` § Import paths)
- ใช้ `import type` สำหรับ type-only import — ลด bundle size

---

## 9. Single responsibility — แต่ละ unit ทำอย่างเดียว

### Function = 1 verb

```ts
// ✗ ทำหลายเรื่อง
async function publishPostAndSendEmailAndRevalidate(id) {
  await db.update(posts).set({ status: 'published' }).where(eq(posts.id, id));
  await sendEmail({ to: 'team@...', subject: 'New post' });
  revalidateTag('posts');
}

// ✓ orchestrate ที่ caller
async function publishPost(id) {
  await db.update(posts).set({ status: 'published' }).where(eq(posts.id, id));
  revalidateTag('posts');
}
async function notifyTeamNewPost(post) { /* ... */ }

// caller (server action)
await publishPost(id);
await notifyTeamNewPost(post);
```

### Component = 1 visual concern

ถ้า component มี state logic + form + display data + animation — แตกออก:
- container (data fetching) — RSC
- form (RHF + zod) — client
- presentation (pure props) — RSC

---

## 10. Pure functions ก่อน — side effect ทีหลัง

```ts
// ✓ pure — ทดสอบง่าย ใช้ซ้ำได้
export function buildPostMetadata(post: Post): Metadata {
  return { title: `${post.title} — house-peach`, /* ... */ };
}

// caller (impure boundary)
export async function generateMetadata({ params }) {
  const post = await getPostBySlug((await params).slug);
  return buildPostMetadata(post);
}
```

แยก **pure logic** (transform, validate, build) ออกจาก **side effect** (DB, network, revalidate, fs)
— pure ไป unit test, impure ทดสอบ integration

---

## 11. Where shared things live

| ประเภท | Folder | หมายเหตุ |
|---|---|---|
| Pure utility (slug, date, classNames) | `src/lib/utils/` | server + client ใช้ได้ |
| Zod schema | `src/lib/validation/` | isomorphic (ดู `validation.md`) |
| Server-only helper (auth, db query) | `src/lib/services/` | มี `import 'server-only'` |
| UI primitive | `src/components/ui/` | shadcn-managed |
| Domain component (public site) | `src/components/public/` | reusable across public pages |
| Domain component (admin) | `src/components/admin/` | reusable across admin pages |
| Motion wrapper | `src/components/motion/` | `<FadeUp>`, `<Stagger>`, ... |
| MDX render component | `src/components/mdx/` | whitelist registered |
| i18n label | `src/lib/i18n/labels.ts` | ดู `i18n.md` |
| SEO helper | `src/lib/seo/` | `buildMetadata`, JSON-LD builder |
| Theme token | `src/styles/themes.css` | ดู `stack.md` § Theme tokens |

ดู `folder-structure.md` § Ownership — แก้นอกพื้นที่ตัวเองต้องประสาน

---

## 12. Don't design for hypothetical future

- ห้ามใส่ `options` parameter ที่ยังไม่มีใช้
- ห้ามทำ generic `<T>` ที่มีแค่ 1 concrete use case
- ห้ามเตรียม `IThing` interface + `ThingImpl` ถ้ามี implementation เดียว
- ห้ามทำ feature flag / config option ที่ไม่มีคนเรียก
- ห้าม backwards-compat shim ถ้าเปลี่ยน contract ได้เลย

ยกเว้น: `ImageStore` interface — มี decision D2 ระบุชัดว่าจะ swap S3 → ต้อง pluggable (ดู `ARCHITECTURE.md`)

---

## 13. Error handling — boundary เท่านั้น

- **Internal code** trust framework + DB + zod — ไม่ต้อง wrap try/catch แบบ defensive
- **System boundary** (route handler, server action entry, API call ออก) — handle ทุก error path
- ห้าม `try { ... } catch (e) { console.log(e) }` — swallowed error คือ bug ซ่อน
- ห้าม `catch (e) { throw e }` — ไม่มีประโยชน์

```ts
// ✗ defensive ไม่จำเป็น
function buildSlug(title: string): string {
  try {
    return slugify(title);
  } catch (e) {
    return '';
  }
}

// ✓ trust input ที่ผ่าน zod แล้ว
function buildSlug(title: string): string {
  return slugify(title);
}
```

---

## 14. When in doubt — ใช้ skill `simplify-reuse`

หลัง implement feature ใหม่หรือก่อน merge PR — เรียก skill [`simplify-reuse`](../skills/simplify-reuse/SKILL.md) ทำ self-review:
1. หา duplication
2. หา dead code
3. ตรวจ naming
4. ตรวจ file/function size
5. ตรวจว่ามี shadcn / utility ที่ใช้แทน custom ได้ไหม

ถ้า review แล้วเจอ pattern ที่ duplicate ≥ 3 จุด — refactor ทันที (ไม่ใช่ TODO)
