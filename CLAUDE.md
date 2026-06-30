@AGENTS.md

# house-peach — project index

เว็บไซต์ studio ตกแต่งบ้าน warm-tone minimalist · Next 16 + Tailwind v4 + shadcn + Drizzle/MariaDB + NextAuth v5
**Mobile-first, SEO-first, content-first.** ไม่ใช่ e-commerce — ไม่มี cart/checkout/register

ก่อนแก้โค้ด: อ่าน `AGENTS.md` (Next 16 warning + critical invariants) → อ่าน rules ที่เกี่ยวข้องด้านล่าง → spawn agent ตามต้องการ

---

# Project rules

อ่าน rules เหล่านี้ก่อนเริ่มแก้โค้ด — แต่ละไฟล์เป็น invariant ของ stack/practice ที่ห้ามผิด

@.claude/rules/stack.md
@.claude/rules/folder-structure.md
@.claude/rules/database.md
@.claude/rules/validation.md
@.claude/rules/security.md
@.claude/rules/seo.md
@.claude/rules/accessibility.md
@.claude/rules/i18n.md
@.claude/rules/testing.md
@.claude/rules/content.md
@.claude/rules/uxui.md
@.claude/rules/motion.md
@.claude/rules/loading-states.md
@.claude/rules/clean-code.md

---

# Project docs

| File | Purpose |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | โครงสถาปัตยกรรม + ER diagram + theme tokens + library checklist (§18) + decisions log (§20) |
| [`README.md`](./README.md) | getting started |
| [`AGENTS.md`](./AGENTS.md) | Next 16 warning + project identity + critical invariants |

---

# Agent team

มี agent definitions ใน `.claude/agents/` รวม 12 ตัว แบ่ง 3 กลุ่ม

## Coordination layer

| Agent | Role |
|---|---|
| [`mp`](./.claude/agents/mp.md) | **Manager / Project Manager** — รับ task → ตัดสินใจว่าใคร (agent) ทำ + ใช้ skill ไหน + ลำดับงาน. Read-only dispatcher — ไม่เขียนโค้ดเอง |

เรียก `mp` เป็น **ขั้นแรก** เมื่อ task spans หลาย folder / agent หรือไม่ชัดว่าใครควรทำ

## Implementation team (แก้โค้ด, ทำงานคู่ขนานได้)

| Agent | Owns |
|---|---|
| [`designer`](./.claude/agents/designer.md) | `docs/design/*` specs, `src/styles/themes.css` — ผลิต ASCII mockup + component anatomy spec ก่อน fe-* เริ่ม implement |
| [`fe-public`](./.claude/agents/fe-public.md) | `app/(public)/`, `components/public/`, `components/motion/`, `components/mdx/`, `styles/` |
| [`fe-admin`](./.claude/agents/fe-admin.md) | `app/(admin)/`, `components/admin/` (CodeMirror MDX editor, ImageUploader) |
| [`be-data`](./.claude/agents/be-data.md) | `lib/db/`, `lib/services/`, `lib/validation/`, `lib/mdx/`, `scripts/seed*` |
| [`be-auth-api`](./.claude/agents/be-auth-api.md) | `app/api/`, `middleware.ts`, `lib/auth.ts`, `lib/services/image.ts` |

## Review subagents (one-shot, read-only)

| Agent | Reviews |
|---|---|
| [`security-auditor`](./.claude/agents/security-auditor.md) | auth, file upload, MDX whitelist, secrets, OWASP Top 10 |
| [`seo-reviewer`](./.claude/agents/seo-reviewer.md) | metadata, JSON-LD (Article/CreativeWork), canonical, sitemap |
| [`a11y-reviewer`](./.claude/agents/a11y-reviewer.md) | WCAG 2.1 AA — semantic HTML, ARIA, contrast, keyboard, reduced motion |
| [`perf-auditor`](./.claude/agents/perf-auditor.md) | Lighthouse CWV, bundle size, RSC/client split, cache strategy |
| [`db-migration-reviewer`](./.claude/agents/db-migration-reviewer.md) | Drizzle schema diffs, FK indexes, destructive ops, charset |
| [`qa-tester`](./.claude/agents/qa-tester.md) | unit (zod), service (testcontainers MariaDB), MDX whitelist, E2E (Playwright) |

ก่อน spawn team อ่าน [agent-teams guide](https://code.claude.com/docs/en/agent-teams) — เริ่ม 3-5 teammates, file ownership ใน [`.claude/rules/folder-structure.md`](./.claude/rules/folder-structure.md)

---

# Project skills

มี 15 skills ใน `.claude/skills/` — เรียกใช้เมื่อ task match keyword ใน `description` ของ SKILL.md

## Implementation skills

| Skill | When to use |
|---|---|
| [`add-blog-post`](./.claude/skills/add-blog-post/SKILL.md) | ship a new MDX blog post end-to-end (schema → editor → publish → SEO) |
| [`add-portfolio-work`](./.claude/skills/add-portfolio-work/SKILL.md) | ship a new portfolio work (gallery composition + JSON-LD CreativeWork) |
| [`mdx-component-add`](./.claude/skills/mdx-component-add/SKILL.md) | add a new whitelisted MDX render component (security review required) |
| [`design-mockup`](./.claude/skills/design-mockup/SKILL.md) | produce design spec + ASCII mockup + component breakdown ก่อนเริ่ม implement (designer agent) |
| [`add-public-screen`](./.claude/skills/add-public-screen/SKILL.md) | create a new public route (RSC + metadata + a11y baseline) |
| [`add-server-action`](./.claude/skills/add-server-action/SKILL.md) | server action pattern (auth check + zod + tx + revalidateTag) |
| [`drizzle-add-table`](./.claude/skills/drizzle-add-table/SKILL.md) | add a new MariaDB table (schema + relations + migration + zod + service + test) |
| [`shared-zod-schema`](./.claude/skills/shared-zod-schema/SKILL.md) | zod conventions (Insert/Update/Select/Public, brand types, TH error messages) |
| [`image-upload-pipeline`](./.claude/skills/image-upload-pipeline/SKILL.md) | sharp + 3 webp variants + pluggable `ImageStore` interface |
| [`shadcn-add-component`](./.claude/skills/shadcn-add-component/SKILL.md) | install + theme-tokens integration (test on all 4 presets) |
| [`component-anatomy`](./.claude/skills/component-anatomy/SKILL.md) | copy-paste templates for Hero / PostCard / WorkCard / Listing / Detail / Header / Footer / ContactForm |
| [`page-states`](./.claude/skills/page-states/SKILL.md) | loading (Skeleton) / empty (EmptyState) / error (`error.tsx` + `not-found.tsx`) / success (toast) templates |
| [`motion-patterns`](./.claude/skills/motion-patterns/SKILL.md) | `<FadeUp>` / `<Stagger>` / `<SlideUpSheet>` / `<FadeSwap>` wrappers + reduced-motion enforcement |

## Review skills

| Skill | When to use |
|---|---|
| [`seo-page-checklist`](./.claude/skills/seo-page-checklist/SKILL.md) | metadata + JSON-LD (Article / CreativeWork / BreadcrumbList) + sitemap + canonical |
| [`a11y-review`](./.claude/skills/a11y-review/SKILL.md) | WCAG 2.1 AA self-check + Lighthouse + axe + WAVE |
| [`perf-audit`](./.claude/skills/perf-audit/SKILL.md) | Lighthouse + bundle analyzer + cache strategy + image audit |
| [`simplify-reuse`](./.claude/skills/simplify-reuse/SKILL.md) | self-review for duplication / dead code / oversized files / shadcn-replaceable custom UI — run before PR |

---

# Decisions log (lock-in)

ตัดสินใจแล้ว — ถ้าจะเปลี่ยนต้อง update doc + bump architecture version

| # | หัวข้อ | ตัดสินใจ |
|---|---|---|
| D1 | Blog/work content storage | **Tiptap (ProseMirror) JSON-in-DB** (`posts.body` / `works.body`, physical column ยังชื่อ `body_mdx`) + Tiptap WYSIWYG editor ใน admin (`components/admin/posts/TiptapEditor.tsx`) render ผ่าน `lib/tiptap/render.tsx` whitelist. *(เดิม: MDX-in-DB + CodeMirror)* |
| D2 | Deploy target | **ยังไม่ตัดสินใจ** — ใช้ `ImageStore` interface แบบ pluggable (`LocalImageStore` default, swap เป็น `S3ImageStore` ทีหลัง) |
| D3 | Testing | **Vitest ตั้งแต่ Phase 0**, Playwright Phase 9 |
| D4 | Theme presets | **4 presets**: peach (default) / cream / sage / ink (dark) |
| D5 | Auth | **NextAuth v5 Credentials** (admin/editor), **ไม่มี register** — เพิ่ม user ผ่าน `scripts/create-admin.ts` |

---

# Common commands

```bash
# Development
npm run dev                       # Next dev server (Turbopack)
npm run build                     # Production build
npm run lint                      # ESLint

# Database (Drizzle)
npm run db:generate               # generate migration from schema diff
npm run db:migrate                # apply migrations (production-safe)
npm run db:push                   # push schema directly (dev only — never on prod)
npm run db:studio                 # Drizzle Studio (DB GUI)
npm run db:seed                   # seed demo data

# Admin bootstrap
npm run admin:create              # bcrypt + insert admin user

# Testing
npm test                          # Vitest run
npm run test:watch                # Vitest watch

# Bundle analysis (Phase 8+)
ANALYZE=true npm run build
```

---

# Common pitfalls — เจอบ่อย

- **ลืม `await params` / `await searchParams`** ใน page (Next 16 ทำให้เป็น `Promise`) → type error ที่ build time
- **ลืม `revalidateTag()`** หลัง mutation → stale page ค้าง ISR cache
- **`'use client'` ที่ไม่จำเป็น** → ดึง code ไป client bundle, bundle บวม + SEO อ่อนลง (default ควรเป็น RSC)
- **`<img>` raw แทน `next/image`** → CLS + LCP เสีย Lighthouse
- **ฮาร์ดโค้ด hex** → 1 theme อาจสวย แต่ดาร์กโหมด `ink` แตก contrast
- **`outline-none` ไม่มี `focus-visible:ring`** → ผู้ใช้ keyboard มองไม่เห็นโฟกัส
- **JSON-LD ไม่ตรงเนื้อหา** → Google ลงโทษ misleading structured data
- **Content body = Tiptap JSON** (ไม่ใช่ MDX แล้ว) → render ผ่าน `lib/tiptap/render.tsx` whitelist; node/mark ที่ไม่รู้จักถูก drop เงียบ ๆ. ไม่มี raw `<script>` node ใน ProseMirror JSON

---

# When in doubt

- ปัญหา security / auth / upload → เรียก `security-auditor`
- ปัญหา DB schema / migration → เรียก `db-migration-reviewer`
- ปัญหา SEO / metadata / JSON-LD → เรียก `seo-reviewer` + ใช้ skill `seo-page-checklist`
- ปัญหา performance / bundle / LCP → เรียก `perf-auditor` + ใช้ skill `perf-audit`
- ปัญหา accessibility → เรียก `a11y-reviewer` + ใช้ skill `a11y-review`
- กำลังเพิ่ม table → ใช้ skill `drizzle-add-table` + ขอ `db-migration-reviewer` review
- กำลังเพิ่ม MDX component → ใช้ skill `mdx-component-add` + ขอ `security-auditor` review
