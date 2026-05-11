<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (**Next.js 16**) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (เฉพาะ `01-app/` + `03-architecture/`) before writing any Next.js API. Heed deprecation notices.

ตัวอย่าง breaking changes ที่ training data เก่ามักผิด:
- `params` / `searchParams` ใน page เป็น **`Promise<...>`** ต้อง `await` — ไม่ใช่ object ตรง ๆ
- `cookies()`, `headers()` คืน `Promise` — ต้อง `await` ทุกครั้ง
- Caching default behavior + `fetch()` cache semantics เปลี่ยน — อ่าน docs ก่อนพึ่ง memory
<!-- END:nextjs-agent-rules -->

---

# Project: house-peach

**คืออะไร:** เว็บไซต์ studio ตกแต่งบ้านแนว warm-tone minimalist — โชว์ผลงาน (portfolio) + บทความ (blog)
เน้น **SEO + Core Web Vitals + mobile-first**

**ไม่ใช่อะไร:** ไม่ใช่ e-commerce — ไม่มี cart / checkout / payment / customer register

## ก่อนแก้โค้ด ต้องอ่าน

1. `CLAUDE.md` — root index ของ project rules + agent + skill (มี `@`-references ลง `.claude/rules/*` ทั้งหมด)
2. `ARCHITECTURE.md` — โครงสถาปัตยกรรม + data model + library checklist
3. `.claude/rules/<หัวข้อ>.md` — invariants per topic (stack, db, validation, security, seo, a11y, i18n, testing, content)

ถ้าจะ spawn agent team อ่าน `.claude/agents/<agent>.md` แต่ละตัวก่อน — มี ownership map ว่าใครแก้ folder ไหนได้บ้าง (`.claude/rules/folder-structure.md` § Ownership)

## Critical invariants — ห้ามผ่อน

ทุก agent ทุก PR ต้องผ่านห้าข้อนี้:

1. **No public register / customer signup** — admin/editor login เท่านั้น ผ่าน NextAuth Credentials provider, เพิ่ม user ใหม่ผ่าน `scripts/create-admin.ts` เท่านั้น
2. **Defense in depth auth** — middleware เป็น first gate; server action / route handler ต้อง re-check `session.user.role` เองอีกครั้งเสมอ
3. **MDX whitelist** — content body render ผ่าน `lib/mdx/components.tsx` whitelist เท่านั้น ห้ามเปิด `<script>`, `<iframe>`, `<style>`, `<form>`, `<input>` — XSS vector
4. **`revalidateTag` ทุก mutation** — เปลี่ยน post/work/tag → ต้อง invalidate cache tags ที่กระทบ (ดู `.claude/rules/database.md` § Cache invalidation invariant)
5. **Theme tokens only** — ใช้ CSS vars (`var(--ink)`, `var(--accent)`) หรือ Tailwind aliases (`text-ink`, `bg-card`) เท่านั้น ห้ามฮาร์ดโค้ด hex ใน component (ยกเว้นใน `src/styles/themes.css` ที่เป็น token source)

## Stack ที่ใช้

Next.js 16 (App Router + RSC + React Compiler) · TypeScript strict · Tailwind v4 · shadcn/ui · next-themes (4 preset: peach / cream / sage / ink) · motion/react · React Hook Form + zod · NextAuth v5 + Drizzle adapter · Drizzle ORM + MariaDB · sharp · next-mdx-remote + CodeMirror 6 (admin editor) · pino · Vitest

Ownership/skill index อยู่ใน `CLAUDE.md`. ARCHITECTURE.md §18 มี install commands ครบ
