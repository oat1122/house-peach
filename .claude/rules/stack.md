# Stack & framework rules

หลักการระดับ framework / language ที่ใช้ตลอดโปรเจกต์ ทุก agent อ่านก่อนแก้โค้ด

## Next.js 16 awareness

repo นี้ใช้ Next.js **16** ซึ่งมี breaking changes จากเวอร์ชันที่ Claude/LLM training data เคยเห็น
ก่อนเขียนหรือแก้ Next.js API ใดๆ (`use server`, route handlers, metadata, caching, middleware,
`generateMetadata`, `cookies()`, `headers()`, etc.) **ต้องเปิดอ่าน** `node_modules/next/dist/docs/`
โดยเฉพาะ `01-app/` (App Router) และ `03-architecture/` ก่อน อย่า assume API จากความรู้เดิม

ถ้าไม่แน่ใจว่า API ตัวไหนเปลี่ยนหรือเปล่า ให้ grep ใน docs ก่อน — การเดาแล้วผิดทำให้ build แตกและ debug ยาก

## TypeScript discipline

- `strict: true` (อยู่แล้วใน `tsconfig.json`) — ห้ามผ่อน
- ห้ามใช้ `any` ที่ไหนทั้งสิ้น ถ้าไม่รู้ type ให้ใช้ `unknown` แล้ว parse ผ่าน zod
- ห้าม `@ts-ignore` / `@ts-expect-error` — ถ้าจำเป็นต้องเขียน comment อธิบาย **ทำไม** และต้องมีลายเซ็นใน code review
- export type จากไฟล์เดียวกับที่ define value: `export type Product = z.infer<typeof Product>` ถ้าใช้ zod

เหตุผล: stack มี zod ตรวจ runtime อยู่แล้ว — ถ้าจุดไหนต้อง `any` แสดงว่าน่าจะใช้ zod schema แทนได้

## React Compiler

`next.config.ts` เปิด `reactCompiler: true` แล้ว — **ห้ามใส่ `useMemo` / `useCallback` แบบ defensive**
React Compiler ทำให้แล้ว ใส่เองจะกลายเป็น noise

ใช้เมื่อ:
- มี dependency ของ effect ที่ต้อง stable identity จริงๆ (rare)
- มี library ภายนอกที่ assume reference equality

## Component sourcing — shadcn first, custom last

โปรเจกต์นี้ใช้ **shadcn/ui (Radix-based)** เป็น primitive layer หลัก — ทุก UI ใหม่ ต้องตรวจก่อนว่ามี
component พร้อมใช้ ใน [shadcn registry](https://ui.shadcn.com/docs/components) ก่อนเขียนเอง

### ลำดับความสำคัญ (priority order)

1. **shadcn primitive ที่มีแล้วใน repo** — `src/components/ui/*` (Button, Card, Dialog, Sheet, DropdownMenu, Input, Label, Tabs, Sonner, Skeleton, ...) — ใช้ก่อน
2. **shadcn primitive ที่ยังไม่ install** — ถ้าพบใน registry → install ผ่าน CLI:
   ```bash
   npx shadcn@latest add <component>
   ```
   ดู skill [`shadcn-add-component`](../skills/shadcn-add-component/SKILL.md) สำหรับ procedure (install + theme tokens + a11y check)
3. **shadcn block / pattern** — สำหรับ pattern ที่ใหญ่กว่า primitive (ฟอร์ม, sidebar, dashboard) ดู `https://ui.shadcn.com/blocks` — ใช้เป็น starting point แล้ว customize
4. **Radix primitive ตรง ๆ** — ถ้า shadcn ไม่ครอบ feature ที่ต้องการ ใช้ Radix `@radix-ui/react-*` แล้ว wrap ด้วย style ของเราเอง (จะกลายเป็น shadcn-style component ใหม่ใน `components/ui/`)
5. **เขียนเอง (custom)** — **ทางเลือกสุดท้าย** เฉพาะ component ที่:
   - มี business logic / domain เฉพาะของ house-peach (PostCard, WorkGallery, BeforeAfterSlider, FilterBar) — อยู่ใน `components/public/` หรือ `components/admin/` ไม่ใช่ `components/ui/`
   - ไม่มี equivalent ใน shadcn / Radix
   - ต้องเหตุผลใน PR description ว่าทำไมไม่ใช้ของที่มี

### ห้ามทำ

- ห้าม `npm install` UI library คู่แข่ง (Material UI, Chakra, Mantine, Ant Design, daisyUI ฯลฯ) — stack เลือก shadcn+Radix แล้ว
- ห้ามทำ Dialog/Sheet/Tooltip/Popover/Combobox/Dropdown **ใหม่จาก zero** — Radix มีแล้ว ทำเองได้ a11y bug แน่ ๆ (focus trap, ESC, ARIA)
- ห้าม copy-paste shadcn component source ตรง ๆ จากเว็บ — ใช้ CLI `npx shadcn@latest add` ให้มัน sync version + theme ให้
- ห้ามแก้ `components/ui/*` แบบทำให้ upstream upgrade ยาก — ถ้าต้อง customize ให้:
  - แก้ผ่าน CSS variable / theme tokens (`var(--accent)`, `bg-card`) เท่านั้น
  - หรือ wrap เป็น component ใหม่ใน `components/public/` / `components/admin/`

### Theme tokens integration

shadcn component ทุกตัวต้องใช้ project theme tokens (peach/cream/sage/ink) ผ่าน CSS var ใน `src/styles/themes.css` — ไม่ใช่ default shadcn color (`zinc`, `slate`)
ตรวจหลัง install: เปลี่ยน theme ผ่าน switcher → component ยัง contrast ดีทั้ง 4 preset (ดู `accessibility.md` § Color contrast)

### When deciding

ก่อนเขียน component ใหม่ถาม:

1. มีใน `src/components/ui/` แล้วหรือเปล่า? → ใช้เลย
2. มีใน shadcn registry / blocks หรือเปล่า? → install
3. Radix มี primitive ที่ wrap ได้หรือเปล่า? → wrap + add to `components/ui/`
4. ถ้าไม่ — เขียนเองใน `components/public/` หรือ `components/admin/` พร้อมเหตุผล

เหตุผล: shadcn/Radix มี a11y (keyboard, focus trap, ARIA) ที่ทำเองได้ buggy + sync upstream upgrade ได้ง่าย + ลด custom code maintenance

## Theme tokens only — no hardcoded colors

ห้ามฮาร์ดโค้ด hex/rgb ใน component (ยกเว้น `claude-design-housepeach/` ซึ่งเป็น read-only design source)

ใช้:
- CSS variable ที่ define ใน `src/styles/themes.css`: `var(--ink)`, `var(--bg)`, `var(--accent)` ฯลฯ
- หรือ Tailwind alias ที่ map ผ่าน `@theme inline { --color-ink: var(--ink) }`: `text-ink`, `bg-card`

ทุกสีต้อง map ครบทั้ง 4 presets (peach / cream / sage / ink) ถ้าเพิ่มสีใหม่ต้องใส่ครบ — ไม่งั้น
preset บางตัวจะแตก contrast

เหตุผล: theme switcher กับ dark mode (`ink`) ทำงานผ่าน CSS vars เท่านั้น hex ตรงๆ จะไม่เปลี่ยนตามธีม

## Mobile-first conventions

ทุก component ออกแบบที่ viewport 390×844 (iPhone 14) ก่อน — Tailwind breakpoint ค่อยใช้ scale up

- **Min tap target 44×44px** (Apple HIG) — ปุ่มเล็กกว่านี้ใช้ padding ขยาย hit area
- **Sticky bottom bars** ต้อง `pb-[env(safe-area-inset-bottom)]` กัน iOS notch
- **Tab bar** (bottom nav) เห็นเฉพาะ ≤ md; desktop เปลี่ยนเป็น top nav
- **Status bar spacer** (54px ใน design) ใช้เฉพาะถ้า PWA standalone mode — เว็บปกติไม่ต้อง

## Motion budget

- ใช้ `motion/react` (ตัวสืบทอด framer-motion) เท่านั้น
- ทุก animation ต้องเช็ค `prefers-reduced-motion` — ใช้ `useReducedMotion()` หรือ CSS `@media (prefers-reduced-motion)`
- Wrapper component อยู่ใน `src/components/motion/` — ใช้ซ้ำ ไม่ inline animation ทุกที่
- 4 keyframes หลักจาก design: `fadeUp` (0.35s), `slideUp` (sheet), `pop` (badge), `fade` (image swap)

เหตุผล: motion ทำให้ bundle ใหญ่และทำให้ user ที่ไวต่อ motion sickness ใช้งานยาก — สมดุล UX กับ performance

## Server vs client components

- **Default = Server Component (RSC)** — ทุก component เริ่มต้นเป็น server เว้นแต่จำเป็น
- ใส่ `'use client'` เฉพาะเมื่อต้องใช้: `useState`, `useEffect`, event handlers, browser API, `motion/react`
- File ที่มี `'use client'` ห้าม import server-only utilities (จะ runtime error ตอน build)
- File ที่ใช้ใน server context ต้องมี `import 'server-only'` ที่หัวไฟล์ — ป้องกันการ leak โดยไม่ตั้งใจ

## Build hygiene

ก่อน commit ต้องผ่าน:
- `npm run build` (ไม่ใช่แค่ `dev`) — `dev` ไม่จับ type error ในบาง path
- `npm run lint`
- ถ้าแตะ `lib/db/schema/*` ต้อง `npm run db:generate` แล้ว commit migration ใหม่ด้วย

## When in doubt

เปิด `node_modules/next/dist/docs/` หรือ `ARCHITECTURE.md` อ่านก่อนเดา — เขียนผิดแล้วต้องย้อนแก้แพงกว่ามาก
