# Folder structure rules

โครงสร้างโฟลเดอร์ต้องคงรูปแบบนี้ตลอด — ทำให้ทุก agent หาไฟล์ได้โดยไม่ต้องเดา

## Top-level

```
house-peach/
├─ src/                  # source code ทั้งหมด
├─ public/               # static assets + uploads
├─ scripts/              # seed, create-admin, backup
├─ tests/                # E2E + fixtures
├─ .claude/              # agents, rules, skills
├─ ARCHITECTURE.md       # อ่านก่อนแก้สถาปัตย์
└─ AGENTS.md             # Next 16 warning — อ่านก่อนแก้ Next API
```

## src/ layout

```
src/
├─ env.ts                   # zod env validation (boot-time)
├─ app/
│  ├─ (public)/             # public routes — route group ไม่กระทบ URL
│  │  ├─ layout.tsx         # AppHeader + Footer (top nav desktop, sticky bottom mobile)
│  │  ├─ page.tsx           # Home — hero + featured works + latest posts
│  │  ├─ works/
│  │  │  ├─ page.tsx        # portfolio grid + filter (room/style/tag)
│  │  │  └─ [slug]/page.tsx # work detail — gallery + JSON-LD CreativeWork
│  │  ├─ blog/
│  │  │  ├─ page.tsx        # post listing (paginated, tag filter)
│  │  │  └─ [slug]/page.tsx # post detail — MDX render + JSON-LD Article
│  │  ├─ about/page.tsx
│  │  └─ contact/page.tsx   # lead form (zod + server action)
│  ├─ (admin)/admin/        # admin routes — require auth (middleware gate)
│  │  ├─ layout.tsx
│  │  ├─ page.tsx           # dashboard
│  │  ├─ login/page.tsx     # public sign-in (NextAuth credentials)
│  │  ├─ posts/{page,new,[id]/edit}
│  │  ├─ works/{page,new,[id]/edit}
│  │  ├─ tags/page.tsx
│  │  └─ media/page.tsx     # browse uploaded images
│  ├─ api/
│  │  ├─ auth/[...nextauth]/route.ts
│  │  └─ upload/route.ts    # multipart → sharp → /public/uploads
│  ├─ sitemap.ts
│  ├─ robots.ts
│  ├─ globals.css           # @import tailwindcss + @theme inline tokens
│  └─ layout.tsx            # ThemeProvider + fonts
├─ components/
│  ├─ ui/                   # shadcn primitives — generated
│  ├─ public/               # AppHeader, Footer, PostCard, WorkCard, FilterBar
│  ├─ admin/                # PostEditor (CodeMirror), WorkForm, ImageUploader
│  ├─ motion/               # FadeUp, SlideUpSheet, Stagger
│  └─ mdx/                  # MDX render components (Image, Quote, Aside, Gallery)
├─ lib/
│  ├─ db/
│  │  ├─ index.ts           # drizzle client (singleton)
│  │  ├─ schema/            # หนึ่งตาราง = หนึ่งไฟล์
│  │  ├─ relations.ts
│  │  └─ migrations/        # generated, do not edit by hand
│  ├─ auth.ts               # NextAuth config + Credentials provider
│  ├─ validation/           # zod schemas — isomorphic
│  ├─ services/             # server-only data access
│  ├─ actions/              # 'use server' wrappers (auth check + delegate to services)
│  ├─ mdx/
│  │  ├─ compile.ts         # next-mdx-remote/rsc + plugins
│  │  └─ components.tsx     # whitelist mapping tag → React component
│  ├─ seo/
│  │  ├─ metadata.ts        # buildMetadata helpers
│  │  └─ jsonld.ts          # Article, CreativeWork, BreadcrumbList builders
│  ├─ i18n/labels.ts        # bilingual TH/EN labels
│  ├─ log.ts                # pino instance
│  └─ utils/
│     ├─ slug.ts
│     ├─ readingTime.ts
│     └─ cn.ts
└─ styles/
   └─ themes.css            # 4 theme presets (peach/cream/sage/ink)
```

## Ownership rules (สำคัญสำหรับ agent team)

แต่ละ agent มี folder ที่ **owns** เท่านั้น — แก้นอกพื้นที่ตัวเองต้องแจ้งและประสาน

| Agent | Owns |
|---|---|
| `fe-public` | `app/(public)/`, `components/public/`, `components/motion/`, `components/mdx/`, `styles/` |
| `fe-admin` | `app/(admin)/`, `components/admin/` (รวม CodeMirror MDX editor) |
| `be-data` | `lib/db/`, `lib/services/`, `lib/validation/`, `lib/mdx/`, `scripts/seed*` |
| `be-auth-api` | `app/api/`, `middleware.ts`, `lib/auth.ts`, `lib/services/image.ts` |

`components/ui/` (shadcn primitives) เป็น **shared** — แก้ได้ทุก agent แต่ต้อง heads up ก่อน
`lib/seo/`, `lib/i18n/`, `lib/utils/` ก็เป็น shared — coordinate ก่อนเปลี่ยน contract

## File naming conventions

- React components: `PascalCase.tsx` (e.g., `PostCard.tsx`, `WorkGallery.tsx`)
- Utilities, hooks: `camelCase.ts` (e.g., `slugify.ts`, `useLocale.ts`, `readingTime.ts`)
- Drizzle schema files: `camelCase.ts` ตามชื่อตาราง (e.g., `posts.ts`, `workImages.ts`)
- Route segment files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts` (Next convention)
- Server actions: ไฟล์ใน `lib/actions/` หรือ inline ใน RSC พร้อม `'use server'`
- MDX render component: `PascalCase.tsx` ใน `components/mdx/` — ต้อง register ใน `lib/mdx/components.tsx` whitelist

## Import paths

ใช้ alias `@/*` (config ใน `tsconfig.json`) — ห้าม relative path ยาวกว่า 2 ระดับ (`../../foo`)

ตัวอย่างถูก:
```ts
import { db } from '@/lib/db';
import { PostCard } from '@/components/public/PostCard';
import { compileMdx } from '@/lib/mdx/compile';
```

ตัวอย่างผิด:
```ts
import { db } from '../../../lib/db';
```

## When adding a new top-level area

ปรึกษาก่อน — ทั้ง folder structure และ ownership อยู่ใน CLAUDE.md/ARCHITECTURE.md
ถ้าเพิ่ม folder ใหม่ ต้องอัปเดตเอกสารทั้งสองให้ตรงกัน
