# Content rules (MDX, posts, works)

หลักการสำหรับเนื้อหาที่ admin/editor เขียนลง DB — blog posts (MDX) + portfolio works

## Slug

- รูปแบบ `^[a-z0-9-]+$` — lowercase, ASCII, ใช้ dash คั่น
- ความยาว ≤ 140 ตัวอักษร
- ห้ามมี space, underscore, ตัวพิเศษ, accented chars
- Auto-generate จาก title ผ่าน `slugify(title)` แล้วให้ admin แก้ได้ก่อน save
- **UNIQUE** ใน DB — ถ้าซ้ำต้องปฏิเสธที่ service layer (ไม่ใช่แค่ zod) — ตรวจก่อน insert
- เปลี่ยน slug แล้ว → เพิ่ม 301 redirect ใน `next.config.ts` `redirects()` (อย่าให้ URL เก่า 404)

## Status flow (posts + works)

```
draft  ──publish──▶  published  ──archive──▶  archived
                         ▲                       │
                         └──────unarchive────────┘
```

- `draft` — admin/editor ทำงาน, visibility = admin เท่านั้น (สิทธิ์เห็นบน listing admin)
- `published` — ขึ้น public + ใน sitemap + ใน listing page + `publishedAt` ต้องไม่ null
- `archived` — เคย published ก่อนหน้านี้, อยู่นอก sitemap + listing, แต่ URL `/blog/[slug]` หรือ `/works/[slug]` ยัง render
  ด้วย noindex (กัน backlink เสีย)
- เปลี่ยน status → revalidate tags: `posts`/`works`, `post:<id>`/`work:<id>`, `sitemap`

## Cover image

- ทุก post + work ต้องมี cover (อ้างผ่าน `coverMediaAssetId` ไป `media_assets`) ก่อน publish (zod validation)
- รูป cover ใช้สำหรับ:
  - OG image (1200×630 — `next/og` generate รอบ Phase 7, ก่อนหน้านั้นใช้รูปเดิม)
  - card thumbnail ใน listing
  - JSON-LD `image`
- Aspect ratio:
  - **Post cover** — preset `post` (16:10, 1600×1000) เปิดเป็น default ใน MediaUploadDialog
  - **Work cover** — preset `work` (3:2, 1500×1000)
  - **Work hero (detail)** — preset `workHero` (2:1, 2000×1000) — ถ้ามีหลายรูปต่อ work ให้ครอปแยกใน work edit form
  - **Square thumbnail** — preset `square` (1:1, 1080×1080) สำหรับ gallery thumb
  - **`free`** — upload ดิบไม่ครอป สำหรับรูปที่ออกแบบ aspect มาเองแล้ว
- Crop เป็น **optional** — admin เลือกได้ที่ MediaUploadDialog (preset dropdown ต่อ row + ปุ่ม "ครอป") ก่อนกด upload. รูปที่ไม่ครอป server resize เป็น 3 variants ตามปกติ — แต่ aspect จะตามต้นฉบับ

## Tags

- ตาราง `tags` แชร์ระหว่าง post + work
- `kind` enum: `'post' | 'work' | 'both'` — กำหนดให้ admin UI กรอง tag ตามบริบท
- Tag slug: format เดียวกับ post/work slug
- Tag name ไม่ unique (อาจมี EN+TH ที่ name ต่างกัน) — แต่ slug ต้อง unique

## MDX body (posts + works)

### Whitelist component เท่านั้น

ใน `lib/mdx/components.tsx`:

```ts
export const mdxComponents = {
  // override built-in HTML
  h2: H2WithAnchor,            // wraps with anchor link
  h3: H3WithAnchor,
  img: MDXImage,                // forces alt + next/image
  // custom blocks
  MDXImage,
  Quote,
  Aside,
  Gallery,
  CodeBlock,
  // disallow these — leaving them out means raw HTML strips
};
```

**ห้าม** เพิ่ม `<script>`, `<iframe>`, `<embed>`, `<object>`, `<style>` ลง whitelist — XSS vector

### Frontmatter ไม่ใช้

ในระบบเรา **metadata ทั้งหมดเก็บใน DB column** (title, excerpt, status, tags, coverImageId) — ไม่ใช่ใน MDX frontmatter
ตัว body MDX มีแต่เนื้อหา ไม่มี `---` block

เหตุผล: admin UI editor อยากให้แก้ field metadata ผ่าน form input ไม่ใช่ syntax — เร็วกว่า + validate ผ่าน zod ได้

### Heading rule

- ห้ามใส่ `# h1` ใน body — h1 คือ title ของ post (render นอก MDX)
- เริ่มที่ `## h2` — rehype-slug จะใส่ id ให้
- ใช้ h3 / h4 ตามลำดับ — ห้าม skip level

### Image ใน MDX

ใช้ custom `<MDXImage>` แทน `<img>` raw — บังคับ alt + ใช้ next/image:

```mdx
<MDXImage src="/uploads/posts/<uuid>/800.webp" alt="ห้องนั่งเล่นสไตล์ Japandi" />
```

อนุญาตให้ใช้ markdown image `![alt](url)` ได้ — จะ map ไป `MDXImage` ผ่าน `img: MDXImage` ใน whitelist

### Code blocks

ใช้ fenced code block ปกติ. `rehype-pretty-code` + shiki จะ highlight ตอน compile (zero runtime JS):

````mdx
```ts
const x = 1;
```
````

### Gallery

```mdx
<Gallery images={[
  { src: '/uploads/works/<uuid>/800.webp', alt: 'before' },
  { src: '/uploads/works/<uuid2>/800.webp', alt: 'after' },
]} />
```

## Excerpt

- ความยาว 80-280 ตัวอักษร
- ใช้สำหรับ meta description + card preview
- ห้าม empty — ถ้า user ไม่กรอก ให้ admin UI auto-fill จาก paragraph แรกของ body

## Reading time

precompute ตอน save:

```ts
import { readingTime } from '@/lib/utils/readingTime';
// อ่านที่ ~220 wpm สำหรับ TH/EN mixed content
post.readingTimeMin = readingTime(post.bodyMdx);
```

แสดงบน post detail page ("อ่าน 5 นาที") + ใส่ JSON-LD `Article` ผ่าน `timeRequired: "PT5M"`

## Work-specific rules

### Gallery composition (kind enum)

- `before` — สภาพห้องก่อนแต่ง (ถ้ามี — มี = engagement สูงมาก)
- `after` — สภาพห้องหลังแต่ง (default — ทุก work ต้องมีอย่างน้อย 1 รูป)
- `process` — งานระหว่างทำ (sketch, mood board, fabric sample)
- `detail` — close-up รายละเอียด (พื้นผิว, hardware, finishing)

แสดงผลบน work detail:
- รูปแรก = is_cover = true (ปกติคือ after รูปที่สวยที่สุด)
- before/after คู่กันใช้ component `<BeforeAfterSlider>` ถ้ามีทั้งสอง
- detail + process แสดง gallery แยกท้ายหน้า

### Required fields ก่อน publish

- `title`, `slug`, `summary`, `coverImageId`, `roomType`, `style`, `bodyMdx`
- `yearCompleted`, `location`, `areaSqm`, `budgetRange` — optional แต่แนะนำใส่ (ช่วย SEO + filter)

## Author / publisher

- `posts.authorId` = FK to `users.id` (ใครเขียน)
- Public render แสดงชื่อ + avatar (ถ้ามี)
- Work ไม่มี author field — `creator` เป็น organization "house-peach" เสมอ

## When in doubt

ถ้า content shape ใหม่ (e.g., เพิ่ม "case study" type ที่ไม่ใช่ post หรือ work) — ปรึกษาก่อน เพราะ
ต้องเพิ่ม schema + route + listing + sitemap ทั้งห่วงโซ่
