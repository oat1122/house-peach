# ARCHITECTURE — house-peach

> เว็บไซต์ **studio ตกแต่งบ้าน** แนว warm-tone minimalist
> โครงสร้าง mobile-first, เน้น SEO + Core Web Vitals, แสดงผลงาน (portfolio) + blog เป็น content หลัก
> Stack: Next.js 16 (App Router, RSC, React Compiler) · Tailwind v4 · shadcn/ui · Drizzle ORM + MariaDB · NextAuth v5 · zod

---

## 1. Goal & scope

### หน้าที่ของเว็บ (V1)

1. **Showcase ผลงานตกแต่งบ้าน (portfolio)** — แต่ละโปรเจกต์มีรูป before/after, รายละเอียด, สไตล์, พื้นที่ (ห้องนอน/ห้องนั่งเล่น/ครัว/etc.), ราคา/งบประมาณช่วง (optional), แท็ก
2. **Blog** — บทความให้แรงบันดาลใจตกแต่ง, how-to, trend, case study — เป็นเครื่องมือ **SEO หลัก** ของแบรนด์
3. **Lead capture (optional)** — ฟอร์มขอใบเสนอราคา / ติดต่อ (ไม่มี cart, ไม่มี payment ใน V1)
4. **Admin panel** — สำหรับเจ้าของเว็บล็อกอินเข้ามาโพสต์ blog + เพิ่มผลงาน + จัดการ media

### ไม่มีใน V1

- ❌ Customer register / signup — **admin login เท่านั้น** (NextAuth Credentials provider, ไม่มี public register form)
- ❌ Cart / checkout / payment — เว็บนี้ไม่ใช่ e-commerce
- ❌ Multi-tenant / multi-store
- ❌ Customer review / rating
- ❌ Comment system บน blog (V1 ดูเฉย ๆ — ถ้าจะมี comment ค่อยทำผ่าน external เช่น Disqus / giscus)

---

## 2. Tech stack

| Layer | Choice | เหตุผล |
|---|---|---|
| Framework | **Next.js 16** (App Router, RSC, Server Actions, React Compiler) | SSR + SEO + streaming + perf budget — ครบในที่เดียว |
| Language | **TypeScript** `strict: true` | ห้าม `any`, ใช้ `unknown` + zod สำหรับ external input |
| UI primitives | **shadcn/ui** (Radix-based) | copy-into-repo, theme ผ่าน CSS vars, ไม่ผูก version |
| Styling | **Tailwind CSS v4** | utility-first, mobile-first โดย default |
| Theme | **next-themes** | light / dark + multi-preset (peach / cream / sage / ink) ผ่าน `data-theme` |
| Animation | **motion** (`motion/react`) | fadeUp, slideUp sheet, image swap — ตามมาตรฐาน motion budget |
| Forms | **react-hook-form** + `@hookform/resolvers/zod` | uncontrolled, perf ดีบน mobile |
| Validation | **zod** (shared FE/BE) | schema เดียวใช้ทั้ง form (FE) + server action (BE) — ห้าม duplicate logic |
| Auth | **NextAuth.js v5** + `@auth/drizzle-adapter` | Credentials provider (admin email + password — bcrypt), **ปิด register flow** |
| ORM | **Drizzle ORM** + `drizzle-kit` | type-safe SQL, migration ผ่าน `db:generate` + `db:migrate` |
| Database | **MariaDB / MySQL** (`mysql2` driver) | relational, FK + transaction support |
| Content (blog) | **MDX-in-DB** — body เก็บเป็น MDX string ใน column `posts.body_mdx`, render ด้วย `next-mdx-remote` (RSC) | flex + version ใน DB + component custom (`<Gallery>`, `<Quote>`) ได้ ไม่ต้องตั้ง headless CMS |
| Blog editor (admin) | **CodeMirror 6** (`@uiw/react-codemirror` + `@codemirror/lang-markdown`) + live preview pane | syntax highlight markdown + autocomplete — เบากว่า Monaco มาก |
| MDX plugins | `remark-gfm` · `rehype-slug` · `rehype-autolink-headings` · `rehype-pretty-code` + `shiki` | GFM (table/task list), heading anchor (SEO + TOC), code highlight zero-JS |
| Image storage | **Pluggable `ImageStore` interface** — `LocalImageStore` (default, `/public/uploads/`) ↔ `S3ImageStore` (สลับได้ตอน deploy) | deploy target ยังไม่ตัดสินใจ — abstraction เลื่อน decision ได้ |
| Image processing | **sharp** (server-only) | resize + webp 3 variants ตอน upload |
| Logging | **pino** + `pino-pretty` (dev) | structured logging, ไม่ใช่ `console.log` |
| Lint/format | ESLint + Prettier (+ `prettier-plugin-tailwindcss`) | คงค่า default ของ create-next-app |
| Test | **Vitest** (unit, ติดตั้งตั้งแต่ Phase 0) + **Playwright** (E2E smoke, Phase 9) | unit test schema/util ตั้งแต่ commit แรก |

> **Next.js 16 awareness:** repo มี `AGENTS.md` แจ้งว่า "This is NOT the Next.js you know" — ก่อนเขียน API ใด ๆ (`use server`, route handler, metadata, caching, `cookies()`, `headers()`) **ต้องอ่าน** `node_modules/next/dist/docs/01-app/` ก่อน อย่า assume API จาก training data เก่า

---

## 3. High-level diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                       Browser (mobile-first)                       │
│  next-themes  ·  motion/react  ·  RHF+zod  ·  shadcn/ui  ·  TW v4  │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ HTTPS (RSC payload / Server Actions)
┌──────────────────────────▼─────────────────────────────────────────┐
│                      Next.js 16 App Router                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ (public)     │  │ (admin)      │  │ api/                     │  │
│  │  - /         │  │  - dashboard │  │  - auth/[...nextauth]    │  │
│  │  - /works    │  │  - posts     │  │  - upload                │  │
│  │  - /works/:s │  │  - works     │  │  - sitemap (in app/)     │  │
│  │  - /blog     │  │  - media     │  │                          │  │
│  │  - /blog/:s  │  │  - settings  │  │                          │  │
│  │  - /about    │  │              │  │                          │  │
│  │  - /contact  │  │              │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────┘  │
│         │                 │                          │              │
│         └────── server actions / lib/services ───────┘              │
│                            │                                        │
│                    ┌───────▼────────┐                               │
│                    │  Drizzle ORM   │  ←  zod validation            │
│                    └───────┬────────┘                               │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                     ┌───────▼────────┐
                     │   MariaDB      │  (InnoDB, utf8mb4, FK + tx)
                     └────────────────┘
                             │
                     ┌───────▼────────┐
                     │ public/uploads │  ←  sharp (local FS)
                     └────────────────┘
```

---

## 4. Directory layout

```
house-peach/
├─ AGENTS.md                  # มี Next 16 warning — อ่านก่อนแก้
├─ ARCHITECTURE.md            # ไฟล์นี้
├─ README.md
├─ drizzle.config.ts
├─ next.config.ts             # reactCompiler: true (เปิดอยู่แล้ว) + CSP headers
├─ middleware.ts              # NextAuth route gate สำหรับ /admin/*
├─ public/
│  ├─ uploads/                # gitignored ยกเว้น .gitkeep
│  │  ├─ posts/<uuid>/{cover,800,400}.webp
│  │  └─ works/<uuid>/{800,400,original}.webp
│  ├─ og/                     # static OG fallback
│  └─ favicon.ico
├─ src/
│  ├─ env.ts                  # zod-validated env loader
│  ├─ app/
│  │  ├─ (public)/            # route group — public pages (default cache: ISR)
│  │  │  ├─ layout.tsx        # AppHeader + Footer (top nav on desktop, sticky bottom on mobile)
│  │  │  ├─ page.tsx          # Home — hero + featured works + latest posts
│  │  │  ├─ works/
│  │  │  │  ├─ page.tsx       # Portfolio grid + filter (room type / style / tag)
│  │  │  │  └─ [slug]/page.tsx# Work detail — gallery, story, JSON-LD CreativeWork
│  │  │  ├─ blog/
│  │  │  │  ├─ page.tsx       # Post listing (paginated, filter by tag)
│  │  │  │  └─ [slug]/page.tsx# Post detail — MDX render, JSON-LD Article
│  │  │  ├─ about/page.tsx
│  │  │  └─ contact/page.tsx  # Lead form (zod + server action)
│  │  ├─ (admin)/admin/       # auth-gated
│  │  │  ├─ layout.tsx        # AdminNav
│  │  │  ├─ page.tsx          # Dashboard (latest posts, works draft count)
│  │  │  ├─ login/page.tsx    # public sign-in page (NextAuth)
│  │  │  ├─ posts/
│  │  │  │  ├─ page.tsx       # list
│  │  │  │  ├─ new/page.tsx
│  │  │  │  └─ [id]/edit/page.tsx
│  │  │  ├─ works/
│  │  │  ├─ tags/page.tsx
│  │  │  └─ media/page.tsx    # browse uploaded images
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  └─ upload/route.ts   # multipart → sharp → /public/uploads
│  │  ├─ sitemap.ts           # query posts + works → <loc> + <lastmod>
│  │  ├─ robots.ts            # disallow /admin /api
│  │  ├─ globals.css          # @import "tailwindcss" + @theme inline tokens
│  │  └─ layout.tsx           # ThemeProvider + fonts (next/font)
│  ├─ components/
│  │  ├─ ui/                  # shadcn primitives — generated, do not hand-edit
│  │  ├─ public/              # AppHeader, Footer, PostCard, WorkCard, FilterBar, …
│  │  ├─ admin/               # PostEditor, WorkForm, ImageUploader, MdxPreview
│  │  ├─ motion/              # FadeUp, SlideUpSheet, Stagger
│  │  └─ mdx/                 # MDX render components (Image, Quote, Aside, Gallery)
│  ├─ lib/
│  │  ├─ db/
│  │  │  ├─ index.ts          # drizzle client singleton (mysql2 pool)
│  │  │  ├─ schema/           # หนึ่งตาราง = หนึ่งไฟล์
│  │  │  ├─ relations.ts
│  │  │  └─ migrations/       # generated — never hand-edit
│  │  ├─ auth.ts              # NextAuth config + Credentials provider
│  │  ├─ validation/          # zod schemas — **isomorphic** (ห้าม import server-only)
│  │  │  ├─ post.ts
│  │  │  ├─ work.ts
│  │  │  ├─ contact.ts
│  │  │  └─ common.ts         # Slug, HexColor, brand types
│  │  ├─ services/            # server-only data access (import 'server-only' ที่หัวไฟล์)
│  │  │  ├─ post.ts
│  │  │  ├─ work.ts
│  │  │  ├─ tag.ts
│  │  │  ├─ image.ts
│  │  │  └─ contact.ts
│  │  ├─ actions/             # 'use server' wrappers ที่ทำ auth check + ส่งต่อ services
│  │  ├─ mdx/
│  │  │  ├─ compile.ts        # next-mdx-remote/rsc compile + plugins
│  │  │  └─ components.tsx    # mapping mdx tag → React component
│  │  ├─ seo/
│  │  │  ├─ metadata.ts       # buildMetadata({ title, description, image, canonical })
│  │  │  └─ jsonld.ts         # Article, CreativeWork, BreadcrumbList builders
│  │  ├─ i18n/labels.ts       # TH primary, EN secondary (bilingual chrome)
│  │  ├─ log.ts               # pino instance
│  │  └─ utils/
│  │     ├─ slug.ts
│  │     ├─ readingTime.ts
│  │     └─ cn.ts
│  └─ styles/
│     └─ themes.css           # 4 theme presets (peach / cream / sage / ink)
├─ scripts/
│  ├─ seed.ts                 # seed demo data
│  ├─ create-admin.ts         # bcrypt hash + insert admin user
│  └─ backup.sh
└─ tests/
   ├─ e2e/blog.spec.ts        # Playwright — view post + open work
   └─ fixtures/
```

### Path alias

`tsconfig.json` ใช้ `@/*` ชี้ `src/*`. ห้าม relative path ลึกกว่า 2 ระดับ (`../../foo`).

---

## 5. Data model (Drizzle schema)

ตารางใช้ **InnoDB** + `utf8mb4` + FK constraints. Surrogate key = `bigint` autoincrement. Column ใน DB ใช้ `snake_case`, JS field เป็น `camelCase`.

### 5.1 Auth (NextAuth Drizzle adapter)

ตามมาตรฐาน [Auth.js Drizzle adapter](https://authjs.dev/getting-started/adapters/drizzle):

```
users
─────
id            bigint PK
name          varchar(255)
email         varchar(255) UNIQUE
email_verified timestamp NULL
image         varchar(500) NULL
role          enum('admin', 'editor') NOT NULL DEFAULT 'editor'
password_hash varchar(255) NULL   -- bcrypt; null = OAuth-only
created_at    timestamp
updated_at    timestamp ON UPDATE
```

ตาราง `accounts`, `sessions`, `verification_tokens` ตามสคีมามาตรฐาน adapter

> **No public register:** เพิ่ม admin ผ่าน script เท่านั้น (`npm run admin:create`) — ไม่มี route `/register`, ไม่มี server action `signUp`

### 5.2 Content — Posts (blog)

```
posts
─────
id            bigint PK
slug          varchar(140) UNIQUE
title         varchar(180)
excerpt       varchar(280)         -- สำหรับ meta description + card preview
body_mdx      mediumtext           -- MDX source
cover_image_id bigint NULL FK → post_images.id
status        enum('draft','published','archived') DEFAULT 'draft'
published_at  timestamp NULL       -- null = not yet published
author_id     bigint FK → users.id
reading_time_min smallint NULL    -- precomputed ตอน save
view_count    int DEFAULT 0
created_at, updated_at

post_images
─────
id            bigint PK
post_id       bigint FK → posts.id ON DELETE CASCADE
path          varchar(500)         -- '/uploads/posts/<uuid>/800.webp'
alt           varchar(255)
sort          smallint
is_cover      tinyint DEFAULT 0

post_tags  (junction)
─────
post_id       bigint FK
tag_id        bigint FK
PRIMARY KEY (post_id, tag_id)
```

### 5.3 Portfolio — Works

```
works
─────
id            bigint PK
slug          varchar(140) UNIQUE
title         varchar(180)
summary       varchar(280)         -- short pitch for cards
body_mdx      mediumtext           -- long-form description
room_type     enum('living','bedroom','kitchen','bathroom','office','outdoor','full_house','other')
style         varchar(60)          -- 'minimalist' / 'japandi' / 'mid-century' / etc.
year_completed smallint NULL
location      varchar(120) NULL    -- จังหวัด / เขต
area_sqm      decimal(7,2) NULL    -- ตร.ม. (optional)
budget_range  enum('under_100k','100k_300k','300k_700k','700k_1.5m','1.5m_plus') NULL
cover_image_id bigint NULL FK → work_images.id
tone          varchar(7) DEFAULT '#f5d6c0'  -- hex สำหรับ card background
accent        varchar(7) DEFAULT '#a87856'
status        enum('draft','published','archived') DEFAULT 'draft'
published_at  timestamp NULL
created_at, updated_at

work_images
─────
id            bigint PK
work_id       bigint FK ON DELETE CASCADE
path          varchar(500)
alt           varchar(255)
caption       varchar(280) NULL
kind          enum('before','after','process','detail') DEFAULT 'after'
sort          smallint
is_cover      tinyint DEFAULT 0

work_tags  (junction)
─────
work_id       bigint FK
tag_id        bigint FK
PRIMARY KEY (work_id, tag_id)
```

### 5.4 Shared tags

```
tags
─────
id            bigint PK
slug          varchar(80) UNIQUE
name          varchar(80)
kind          enum('post','work','both') DEFAULT 'both'
sort          smallint DEFAULT 0
```

### 5.5 Lead capture (contact form)

```
contact_inquiries
─────
id            bigint PK
contact_name  varchar(120)
contact_email varchar(255)
contact_phone varchar(40) NULL
service_type  enum('full_design','consultation','partial','other')
budget_range  enum(...) NULL
project_description varchar(2000)
status        enum('new','contacted','closed') DEFAULT 'new'
created_at
```

### 5.6 Indexes ที่ต้องมี

- `posts(slug)` — UNIQUE, ใช้ทุก detail route
- `posts(status, published_at DESC)` — listing query
- `works(slug)` — UNIQUE
- `works(status, published_at DESC)`
- `works(room_type, style)` — filter
- `tags(slug)` — UNIQUE
- `*_tags(tag_id)` — สำหรับ join filter

---

## 6. Validation — shared zod (FE/BE)

ทุก schema ใน `src/lib/validation/` ต้อง:

- ไม่ import `'server-only'`, `@/lib/db`, หรือ Node-only module
- ใช้ทั้งใน RHF (FE) และ server action (BE)

```ts
// src/lib/validation/post.ts
import { z } from 'zod';
import { Slug } from './common';

export const PostInsert = z.object({
  title: z.string().min(4, 'หัวข้อต้องยาวอย่างน้อย 4 ตัวอักษร').max(180),
  slug: Slug,
  excerpt: z.string().max(280),
  bodyMdx: z.string().min(20, 'เนื้อหายังสั้นเกินไป'),
  tagIds: z.array(z.coerce.number().int().positive()).default([]),
  coverImageId: z.coerce.number().int().positive().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  publishedAt: z.coerce.date().nullable().optional(),
});
export type PostInsert = z.infer<typeof PostInsert>;
```

ใช้ที่ FE:

```ts
const form = useForm<PostInsert>({ resolver: zodResolver(PostInsert) });
```

ใช้ที่ BE:

```ts
'use server';
import { auth } from '@/lib/auth';
import { PostInsert } from '@/lib/validation/post';

export async function createPost(input: unknown) {
  const session = await auth();
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'editor') {
    throw new Error('Forbidden');
  }
  const data = PostInsert.parse(input);   // throws ZodError → server boundary แปลงเป็น UI error
  // ... drizzle insert
}
```

> **กฎ:** ห้าม validate FE และ BE ด้วย schema คนละชุด — schema เดียว ใช้ทุกที่

---

## 7. Auth flow (NextAuth v5, admin-only, no register)

```ts
// src/lib/auth.ts (เค้าร่าง)
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, { /* schema mapping */ }),
  session: { strategy: 'jwt' },            // Credentials provider บังคับใช้ JWT
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? '').trim().toLowerCase();
        const password = String(creds?.password ?? '');
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        // Always run bcrypt to keep timing constant (defeats user enumeration)
        const hash = user?.passwordHash ?? DUMMY_HASH;
        const ok = await bcrypt.compare(password, hash);
        if (!user || !ok) return null;
        return { id: String(user.id), email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.role = user.role; return token; },
    async session({ session, token }) {
      session.user.role = token.role as 'admin' | 'editor';
      return session;
    },
    /** Middleware gate — admin paths require admin/editor role */
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      if (pathname === '/admin/login') return true;
      if (pathname.startsWith('/admin')) return Boolean(auth?.user?.role);
      return true;
    },
  },
});
```

```ts
// middleware.ts
export { auth as default } from '@/lib/auth';
export const config = { matcher: ['/admin/:path*'] };
```

### Defense in depth

Middleware เป็น **first gate** เท่านั้น — ทุก server action ที่ทำ mutation ต้อง re-check role อีกครั้ง เพราะ server action ถูกเรียกตรงผ่าน RSC payload ได้ ถ้าไม่เช็ค คนรู้ endpoint จะ bypass

```ts
'use server';
export async function deletePost(id: number) {
  const session = await auth();
  if (session?.user?.role !== 'admin') throw new Error('Forbidden');
  // ...
}
```

### การเพิ่ม admin ใหม่

```bash
npm run admin:create  # script ใน scripts/create-admin.ts — bcrypt rounds 12, insert into users
```

ไม่มี route `/register`, ไม่มี server action `signUp`, ไม่มี link "Create account" ที่หน้า login

---

## 8. SEO strategy (สำคัญที่สุดสำหรับโปรเจกต์นี้)

### 8.1 Render mode ต่อหน้า

| Route | Render | Cache strategy |
|---|---|---|
| `/` | RSC + ISR | revalidate ทุก 5 นาที, tag `home` |
| `/works`, `/blog` | RSC + ISR | revalidate ทุก 60s, tag `works`, `posts` |
| `/works/[slug]` | RSC + ISR | revalidate ทุก 60s, tag `work:<id>` — invalidate ตอน admin save |
| `/blog/[slug]` | RSC + ISR | revalidate ทุก 60s, tag `post:<id>` |
| `/about` | RSC + static | revalidate รายวัน |
| `/contact` | RSC + dynamic | ไม่ cache (form) |
| `/admin/*` | dynamic + `robots: { index: false }` | ไม่ cache |

`revalidateTag('post:<id>')` ทุกครั้งที่ admin save — cache invalidate ทันที โดยไม่ต้องรอ TTL

### 8.2 Metadata pattern

ทุกหน้าใน `(public)` ต้อง export `metadata` หรือ `generateMetadata`:

```ts
// src/app/(public)/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'ไม่พบบทความ — house-peach' };
  return {
    title: `${post.title} — house-peach`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      images: post.coverImage ? [`${env.NEXT_PUBLIC_SITE_URL}${post.coverImage.path}`] : [],
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name],
    },
    twitter: { card: 'summary_large_image' },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}
```

**Title format:** `<Page-specific> — house-peach` — brand name อยู่หลัง ไม่ใช่นำหน้า (SEO weight ลง content จริงก่อน)

**Description:** 80–160 ตัวอักษร, ห้าม empty / undefined — fall back เป็น `${title}, แต่งบ้านสไตล์...`

### 8.3 Structured data (JSON-LD)

ใส่ `<script type="application/ld+json">` ทุก detail page:

- **Blog post** → `BlogPosting` / `Article` + `BreadcrumbList`
- **Work** → `CreativeWork` (หรือ `Project` แบบ custom) + `ImageObject` หลายชิ้น + `BreadcrumbList`
- **Home** → `Organization` (ชื่อแบรนด์, logo, sameAs สำหรับ social)
- **Contact** → `LocalBusiness` ถ้ามีหน้าร้าน / ที่ตั้งจริง

```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt,
  image: post.coverImage ? [`${SITE}${post.coverImage.path}`] : [],
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  author: { '@type': 'Person', name: post.author.name },
  publisher: { '@type': 'Organization', name: 'house-peach' },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/${post.slug}` },
})}}/>
```

> **ห้าม:** JSON-LD ที่ไม่ตรงเนื้อหาจริง (Google ลงโทษ misleading structured data)

### 8.4 Sitemap & robots

```ts
// src/app/sitemap.ts
export default async function sitemap() {
  const [posts, works] = await Promise.all([listPublishedPosts(), listPublishedWorks()]);
  return [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/works`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/about`, priority: 0.5 },
    { url: `${SITE}/contact`, priority: 0.5 },
    ...posts.map(p => ({ url: `${SITE}/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
    ...works.map(w => ({ url: `${SITE}/works/${w.slug}`, lastModified: w.updatedAt, priority: 0.8 })),
  ];
}

// src/app/robots.ts
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
```

### 8.5 Canonical & redirect

- ทุกหน้าใส่ `alternates.canonical` ที่ชี้ self
- Filter params (`?room=living&style=japandi`) → canonical ชี้ base URL ไม่มี params (กัน duplicate content)
- เปลี่ยน slug → เพิ่ม 301 redirect ใน `next.config.ts` → `redirects()` — ห้าม 404 URL เก่า

### 8.6 Internal linking

- บทความ blog → link ไปยัง work ที่เกี่ยวข้อง (related works section)
- Work detail → link ไป related posts
- Tag page (`/blog/tag/japandi`, `/works/tag/japandi`) — long-tail keyword

---

## 9. Performance — Core Web Vitals budget

ตั้งเป้า:

| Metric | Target | กลยุทธ์ |
|---|---|---|
| **LCP** | < 2.5s บน 4G mobile | hero image `priority` + AVIF/webp + preconnect fonts |
| **INP** | < 200ms | RSC default = น้อย JS; React Compiler ลด re-render โดยอัตโนมัติ |
| **CLS** | < 0.1 | ทุก `<Image>` ใส่ `width`/`height` หรือ aspect ratio container; reserve space for fonts (`display: swap` + size-adjust) |
| **TTFB** | < 600ms | Drizzle pool 10, ISR ลด DB hit, MariaDB ตั้ง innodb cache |
| **JS bundle (initial)** | < 100KB gz | dynamic import motion + admin bundle separate |

### 9.1 Images

```tsx
import Image from 'next/image';

<Image
  src={work.coverImage.path}
  alt={`${work.title} — ${work.roomType}`}
  width={800}
  height={600}
  sizes="(max-width: 640px) 100vw, 50vw"
  priority={isAboveTheFold}   // เฉพาะ LCP image
  className="object-cover"
/>
```

Upload pipeline สร้าง 3 variants (`400.webp`, `800.webp`, `original.webp`) — `next/image` เลือกตาม `sizes`

### 9.2 Fonts

ใช้ `next/font` กับ subset:

```ts
// app/layout.tsx
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
const sans = DM_Sans({ subsets: ['latin','thai'], display: 'swap', variable: '--font-sans' });
const serif = DM_Serif_Display({ subsets: ['latin','thai'], weight: '400', display: 'swap', variable: '--font-serif' });
```

ห้าม load font จาก CDN ใน `<head>` ด้วยมือ — `next/font` self-host ให้แล้ว (เร็วกว่า + ไม่มี CLS)

### 9.3 MDX blog rendering

- compile MDX **ที่ build/ISR time** ไม่ใช่ runtime client — ใช้ `next-mdx-remote/rsc`
- whitelist component (Image, Quote, Aside, Gallery, CodeBlock) — ห้ามใส่ component ที่ใช้ heavy JS ใน blog body
- reading time precompute ตอน save → เก็บ `posts.reading_time_min` (ไม่คำนวณตอน render)

### 9.4 Caching layers

- ISR — ที่อธิบายข้างบน
- DB query — ไม่ใช้ in-memory cache layer (Next 16 จัดให้แล้วผ่าน `unstable_cache` หรือ fetch cache)
- HTTP cache header — `next.config.ts` ตั้ง `Cache-Control: public, max-age=31536000, immutable` สำหรับ `/uploads/*` และ `/_next/static/*`

### 9.5 Bundle analyzer

```bash
npm run build:analyze  # ใช้ @next/bundle-analyzer
```

ก่อนปิดแต่ละ feature เช็ค bundle ไม่บวมเกินเป้า

---

## 10. Theme system — light / dark + multi-preset

ใช้ `next-themes` กับ `attribute="data-theme"` รองรับ:

| Theme | mode | tone |
|---|---|---|
| `peach` | light | warm pinkish-peach (default) |
| `cream` | light | classic warm cream |
| `sage` | light | muted green for nature lovers |
| `ink` | dark | warm dark for night reading |

```css
/* src/styles/themes.css */
:root, [data-theme="peach"] {
  --bg: #faeee2; --bg2: #f3dccc; --card: #ffffff;
  --ink: #2a1f17; --muted: #8c7768; --line: #e8d4c2; --accent: #c97c5e;
}
[data-theme="cream"] { --bg:#f3ebde; --bg2:#ebe1d0; --card:#faf5ec; --ink:#1a1612; --muted:#8a7e6f; --line:#d8cdb9; --accent:#a87856; }
[data-theme="sage"]  { --bg:#e8ede1; --bg2:#d8e0cd; --card:#f3f7ed; --ink:#1c2018; --muted:#7d8a73; --line:#c7d2bb; --accent:#5e7e5a; }
[data-theme="ink"]   { --bg:#1c1812; --bg2:#27201a; --card:#2c2520; --ink:#f5ecdc; --muted:#a8998a; --line:#3a322a; --accent:#e0a07e; }
```

```css
/* src/app/globals.css */
@import "tailwindcss";
@theme inline {
  --color-bg: var(--bg);
  --color-bg2: var(--bg2);
  --color-card: var(--card);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-line: var(--line);
  --color-accent: var(--accent);
  --font-sans: var(--font-sans);
  --font-serif: var(--font-serif);
}
```

ใช้ใน component: `bg-bg`, `text-ink`, `border-line`, `text-accent` — ห้ามฮาร์ดโค้ด hex

### Dark/light toggle

ปุ่มสลับ light preset (peach / cream / sage) ↔ `ink` (dark) — เก็บ preference ใน cookie/localStorage ผ่าน `next-themes`

---

## 11. Accessibility (WCAG 2.1 AA)

- semantic HTML: `<header>`, `<nav>`, `<main>`, `<article>` (post / work), `<footer>`
- หนึ่ง `<h1>` ต่อหน้า — ห้าม heading skip
- ปุ่ม icon-only ต้อง `aria-label`
- ทุก `<Image>` ต้องมี `alt` ที่ descriptive (ไม่ใช่ "image" / filename)
- focus ring เห็นชัด — `focus-visible:ring-2 focus-visible:ring-accent`
- `prefers-reduced-motion` — animation ทุกตัวต้องเช็ค `useReducedMotion()`
- color contrast ≥ 4.5:1 (text) / 3:1 (UI) — ทดสอบทุก theme preset
- min tap target 44×44 px
- Lighthouse a11y ≥ 95 ก่อนปิด phase

---

## 12. i18n strategy

V1: TH เป็นภาษาหลัก, EN เป็น secondary (สำหรับ chrome / nav / brand voice)

```ts
// src/lib/i18n/labels.ts
export const labels = {
  works: { en: 'Works', th: 'ผลงาน' },
  blog: { en: 'Journal', th: 'บทความ' },
  about: { en: 'About', th: 'เกี่ยวกับเรา' },
  contact: { en: 'Contact', th: 'ติดต่อ' },
  inquireProject: { en: 'Start a project', th: 'เริ่มโปรเจกต์' },
} as const;
```

- Content (post body, work description) — TH เป็นหลัก; V1 ไม่ทำ duplicate EN (V2 ค่อยเพิ่ม `body_mdx_en`)
- Date: `Intl.DateTimeFormat('th-TH', { dateStyle: 'long' })` → "15 มีนาคม 2569" (พ.ศ.)
- Number/currency (ถ้าโชว์งบประมาณ): `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`

---

## 13. Image upload pipeline

```
admin browser
  │
  ├─ (optional) ImageCropDialog — preset 1:1 / 16:10 / 3:2 / 2:1 / free
  │     - canvas draw → toBlob('image/webp', 0.92) → File (≤5MB)
  │     - 'free' = skip crop, send original
  │
admin POST /api/upload
  │
  ├─ check session.role ∈ {admin, editor}
  ├─ rate limit 20 req / 5 min / IP
  ├─ parse multipart (max 5MB; reject >5MB before reading full body)
  ├─ file-type sniff magic bytes — allowlist image/jpeg, image/png, image/webp
  ├─ generate uuid → key
  ├─ sharp re-encode (กัน polyglot file):
  │     - original.webp (quality 90)
  │     - 800.webp (longest edge 800)
  │     - 400.webp (longest edge 400)
  ├─ save to /public/uploads/library/<uuid>/
  └─ insert media_assets row + return asset
```

**Client crop (optional preprocessing):**

- `src/lib/imageCrop/config.ts` — `CROP_PRESETS` (square / post / work / workHero / free)
- `src/lib/imageCrop/processing.ts` — pure math + canvas draw
- `src/components/admin/media/ImageCropDialog.tsx` — pointer drag + zoom slider 1×–4×
- Output `image/webp` quality 0.92 matches server allowlist — server still re-encodes via sharp for variants

**Pluggable interface:**

```ts
// src/lib/services/image.ts
import 'server-only';
export interface ImageStore {
  put(buf: Buffer, key: string): Promise<string>;   // returns public path
  delete(key: string): Promise<void>;
}
export const imageStore: ImageStore = new LocalImageStore();  // swap → S3Store ภายหลัง
```

> `public/uploads/` ใส่ใน `.gitignore` (ยกเว้น `.gitkeep`). Production mount เป็น persistent volume

---

## 14. Server actions vs route handlers

| Use case | Choice |
|---|---|
| Form submit (post/work create/edit, contact) | **Server action** — RHF เรียกตรง |
| File upload | **Route handler** `/api/upload` — multipart parsing ง่ายกว่า |
| NextAuth | **Route handler** `/api/auth/[...nextauth]` |
| Public content fetch | **Direct in RSC** — ไม่ผ่าน API |
| Webhook (future) | **Route handler** |

หลีกเลี่ยง internal REST API — RSC อ่าน DB ตรงผ่าน `lib/services/*`

---

## 15. Security baseline

อิงตาม `.claude/rules/security.md` ของ tnp-ecommerce (จะ port มา):

- **Defense in depth:** middleware + per-action role check
- **Password:** bcrypt rounds ≥ 10 — ห้าม MD5/SHA-1, ห้าม store plaintext
- **Login timing:** dummy bcrypt compare กัน user enumeration
- **File upload:** mime sniff (`file-type` package) + size cap + re-encode ทุกไฟล์
- **SQL injection:** Drizzle parameterize อัตโนมัติ — ห้าม `sql.raw()` + string concat
- **XSS:** RSC + React escape; **MDX content ต้อง compile-time sanitize** + whitelist component
- **CSRF:** Next.js server actions มี built-in origin check
- **Cookies:** `httpOnly`, `secure` (prod), `sameSite: 'lax'`
- **CSP:** strict `Content-Security-Policy` header ใน `next.config.ts`
- **Rate limit:** `/api/upload` 10 req/5min/IP, `/api/auth/*` 20 req/5min/IP (Phase 2 — ใช้ `@upstash/ratelimit` หรือ in-memory)
- **Env validation:** `src/env.ts` ใช้ zod parse `process.env` ที่ boot — fail-fast ถ้า var ขาด

---

## 16. Environment variables

```bash
# .env.local
DATABASE_URL=mysql://user:pass@localhost:3306/house_peach
DB_POOL_SIZE=10
AUTH_SECRET=<openssl rand -base64 32>   # ≥ 32 chars
AUTH_URL=http://localhost:3000          # production: https://house-peach.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UPLOAD_DIR=public/uploads
NODE_ENV=development
```

```ts
// src/env.ts
import 'server-only';
import { z } from 'zod';

const Env = z.object({
  DATABASE_URL: z.string().url(),
  DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  UPLOAD_DIR: z.string().default('public/uploads'),
});

export const env = Env.parse(process.env);
```

---

## 17. Testing strategy

| Layer | Tool | Target |
|---|---|---|
| Unit (zod, utils, slug, readingTime) | Vitest | 80% coverage |
| Service (lib/services/* mutations) | Vitest + testcontainers MariaDB | flows หลัก |
| E2E (view post + view work + submit contact) | Playwright | smoke 1 path/feature |

ไฟล์ test อยู่ติดข้าง source: `post.ts` + `post.test.ts` ใน folder เดียวกัน. E2E อยู่ใน `tests/e2e/`

---

## 18. Library checklist (finalized — สำหรับ Phase 0 setup)

ผ่านการตัดสินใจร่วมกันแล้ว — ชุดด้านล่างคือสิ่งที่ Cowork จะติดตั้งใน Phase 0

### 18.1 Install commands (รัน 4 ชุด)

```bash
# 1) Core: DB + auth + validation + form + theme + logging
npm i drizzle-orm mysql2 zod next-auth@beta @auth/drizzle-adapter bcryptjs \
       react-hook-form @hookform/resolvers next-themes motion server-only \
       pino pino-pretty
npm i -D drizzle-kit @types/bcryptjs dotenv

# 2) Image pipeline + shadcn utils
npm i sharp file-type clsx tailwind-merge class-variance-authority

# 3) MDX (RSC compile) + CodeMirror editor (admin)
npm i next-mdx-remote remark-gfm rehype-slug rehype-autolink-headings \
       rehype-pretty-code shiki
npm i @uiw/react-codemirror @codemirror/lang-markdown @codemirror/theme-one-dark

# 4) Testing (Phase 0)
npm i -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

### 18.2 shadcn init + base components

```bash
npx shadcn@latest init
# options: TypeScript = yes · style = new-york · base color = neutral
# · CSS variables = yes · RSC = yes

npx shadcn@latest add button input textarea label form sheet dialog \
                       dropdown-menu tabs badge sonner avatar separator \
                       skeleton card
```

> หลัง `shadcn init` มัน auto-install `lucide-react` + `tw-animate-css` ให้ และแก้ `globals.css` ใส่ `@theme inline { … }` token

### 18.3 ไฟล์ที่ Cowork จะสร้างใน Phase 0

- `src/env.ts` — zod env validation (ดู §16)
- `src/lib/db/index.ts` — drizzle client singleton (mysql2 pool size จาก `env.DB_POOL_SIZE`)
- `src/lib/db/schema/` — empty placeholder, schema จริงเพิ่มใน Phase 2
- `src/lib/auth.ts` — NextAuth v5 Credentials skeleton (ดู §7)
- `src/lib/log.ts` — pino instance (pretty transport dev, json prod)
- `src/lib/services/image.ts` — `ImageStore` interface + `LocalImageStore` impl
- `src/styles/themes.css` — 4 preset peach/cream/sage/ink (ดู §10)
- `middleware.ts` — `export { auth as default } from '@/lib/auth'` (gate `/admin/*`)
- `drizzle.config.ts` — load `.env.local`, dialect mysql, schema path
- `vitest.config.ts` — jsdom env, alias `@/*` ตาม tsconfig
- `next.config.ts` — เพิ่ม CSP headers + bundle analyzer hook
- `.env.example` — placeholder ทุก var ที่ `env.ts` parse
- `.gitignore` — เพิ่ม `public/uploads/*` (ยกเว้น `.gitkeep`), `.env.local`
- `scripts/create-admin.ts` — bcrypt hash + insert admin user (รันด้วย `npm run admin:create`)
- `package.json` scripts — `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`, `admin:create`, `test`, `test:watch`, `build:analyze`

### 18.4 Libraries ที่ **ไม่ลง** ตอน Phase 0 (เพิ่มทีหลัง)

| Library | จะลงตอน |
|---|---|
| `@next/bundle-analyzer` | Phase 8 perf audit |
| `@playwright/test` | Phase 9 E2E |
| `@upstash/ratelimit` + `ioredis` | ตอนตัดสินใจ deploy Vercel/serverless |
| `husky` + `lint-staged` | optional (ตอนทีมโต) |
| `prettier-plugin-tailwindcss` | optional (ใส่ตอนใดก็ได้) |

### 18.5 Libraries ที่ **ไม่ใช้** (และเหตุผล)

- `prisma` — มี Drizzle แล้ว (ไม่ต้อง runtime client, type-safe กว่า)
- `tRPC` — RSC + server action ครอบคลุมแล้ว
- `zustand` / `redux` / `jotai` — RSC + URL state + cookies เพียงพอ
- `axios` — `fetch` native + Next cache เพียงพอ
- `dayjs` / `date-fns` — `Intl.DateTimeFormat('th-TH')` มี locale ครบ
- `react-icons` — `lucide-react` มากับ shadcn แล้ว
- `tailwindcss-animate` — `tw-animate-css` ของ shadcn ทดแทน
- `t3-env` — `src/env.ts` ใช้ zod 20 บรรทัดพอ

---

## 19. Roadmap (เสนอ phase สั้น ๆ — ตัดสินใจตอนเริ่มแต่ละ phase)

| Phase | Scope | DoD |
|---|---|---|
| **0 — bootstrap** | รัน install command 4 ชุด (§18.1) + `shadcn init` + add base components (§18.2) + สร้างไฟล์ skeleton ทั้งหมด (§18.3) + ตั้ง CSP headers + Vitest config | `npm run build` ผ่าน, `npm run lint` 0 error, `npm test` รันได้ (แม้ยังไม่มีเทส) |
| **1 — auth + admin shell** | NextAuth Credentials, middleware gate, `/admin/login`, `create-admin` script, AdminNav | admin login ทำงาน, role check ใน server action ครบ |
| **2 — schema + drizzle** | tables (users, posts, works, tags, *_images, contact_inquiries), migrations, seed | `db:generate` + `db:migrate` ผ่าน, seed สร้าง 3 demo posts + 3 works |
| **3 — image upload** | `/api/upload`, sharp pipeline, MediaPicker UI | upload + เลือก cover ได้, sharp สร้าง 3 variants ถูก path |
| **4 — blog** | `/blog`, `/blog/[slug]`, admin PostEditor (MDX + preview), tag filter | บทความแสดงได้, JSON-LD Article ผ่าน rich result test, lighthouse SEO ≥ 95 |
| **5 — portfolio (works)** | `/works`, `/works/[slug]`, filter (room/style), gallery (before/after) | work detail page render gallery + lightbox, JSON-LD CreativeWork |
| **6 — home + about + contact** | hero, featured works, latest posts, contact form (zod + server action → contact_inquiries) | LCP < 2.5s บน mobile, form submit สร้าง inquiry แล้ว redirect ไป thank-you |
| **7 — SEO polish** | sitemap, robots, canonical, redirects, OG image generation (next/og), breadcrumb JSON-LD | sitemap.xml มีทุก URL, GSC submit สำเร็จ |
| **8 — perf & a11y audit** | bundle analyze, image audit, Lighthouse mobile ≥ 95 ทุก metric, axe DevTools 0 violation | CWV ผ่านทั้ง LCP/INP/CLS |
| **9 — deploy** | Dockerfile (standalone output), CI (lint + test + build), backup script | production build ทำงานบน server, backup cron พร้อม |

---

## 20. Decisions log

ตัดสินใจร่วมกันแล้ว — ถ้าจะเปลี่ยนภายหลังต้องอัปเดต doc + bump version

| # | หัวข้อ | ตัดสินใจ | วันที่ |
|---|---|---|---|
| D1 | Blog content storage | **MDX-in-DB** + CodeMirror editor (admin) | 2026-05-11 |
| D2 | Deploy target | **ยังไม่ตัดสินใจ** — ใช้ `ImageStore` interface แบบ pluggable, เริ่มที่ `LocalImageStore`, swap เป็น `S3ImageStore` ได้ทีหลังโดยไม่แก้ที่อื่น | 2026-05-11 |
| D3 | Testing | **ลง Vitest ตั้งแต่ Phase 0** (Playwright รอ Phase 9) | 2026-05-11 |

## 21. Open questions (ยังไม่ตัดสินใจ)

ผม assume ตามนี้ใน doc — ถ้าผิดทิศบอกได้ จะปรับ:

1. **Brand name = "house-peach"** (จากชื่อ folder) — ถ้ามีชื่อจริง / โลโก้ ส่งมาให้ใส่
2. **Theme default = `peach`** (peach/cream/sage/ink) — ถ้าอยากได้สีอื่นเปลี่ยน palette ใน `themes.css`
3. **ภาษาเนื้อหา = TH primary, EN เฉพาะ chrome** — ถ้าต้อง bilingual full content ต้องเพิ่ม column `body_mdx_en`
4. **ผลงาน (works)** มี gallery แบบ before/after/process/detail — ถ้าไม่จำเป็นทุก kind ตัดบางตัวออกได้
5. **ไม่มี payment / quote workflow ใน V1** — ถ้าต้องการ quote estimate ค่อย add ใน V2

---

## 22. References

- โปรเจกต์พี่น้อง: `E:\tnp-ecommerce` — มี `.claude/rules/*` (stack, db, seo, a11y, security, validation, i18n, testing) ที่ port มาใช้ได้เลย
- Next.js docs (version ที่ลง): `node_modules/next/dist/docs/`
- Drizzle ORM: https://orm.drizzle.team/
- Auth.js v5 + Drizzle: https://authjs.dev/getting-started/adapters/drizzle
- shadcn/ui (Tailwind v4): https://ui.shadcn.com/
- next-themes: https://github.com/pacocoursey/next-themes
- next-mdx-remote (RSC): https://github.com/hashicorp/next-mdx-remote
- rehype-pretty-code + shiki: https://rehype-pretty.pages.dev/
- CodeMirror 6: https://codemirror.net/
- Schema.org (JSON-LD): https://schema.org/BlogPosting, https://schema.org/CreativeWork
- Core Web Vitals: https://web.dev/vitals/
