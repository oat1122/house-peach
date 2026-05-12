# Plan — `/admin/works` + Before/After renderer

> สร้างระบบโพสต์ผลงาน (portfolio works) ในแอดมิน + public detail page ที่รองรับ
> ภาพ before/after 2 เทคนิค: **Slider drag** (desktop) + **Tap toggle** (mobile)
>
> สถานะ: **approved — phased rollout**
> วันที่: 2026-05-12

อิงจาก:

- Schema เดิม: [`src/lib/db/schema/works.ts`](src/lib/db/schema/works.ts) — `work_images.kind` enum + `pair_id` FK to `media_pairs`
- Skill: [`add-portfolio-work`](.claude/skills/add-portfolio-work/SKILL.md), [`motion-patterns`](.claude/skills/motion-patterns/SKILL.md), [`shared-zod-schema`](.claude/skills/shared-zod-schema/SKILL.md)
- Rules: [`uxui.md §9.5`](.claude/rules/uxui.md), [`accessibility.md`](.claude/rules/accessibility.md), [`loading-states.md`](.claude/rules/loading-states.md), [`database.md`](.claude/rules/database.md), [`seo.md`](.claude/rules/seo.md)

---

## 1. State of the codebase (verified 2026-05-12)

### มีแล้ว (no work needed)

| Layer           | สิ่งที่พร้อม                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema          | `works`, `work_images` (kind enum + `pair_id` FK), `work_tags`, `media_assets`, `media_pairs`                                                     |
| Validation      | [`src/lib/validation/work.ts`](src/lib/validation/work.ts) — `WorkInsert` + `WorkUpdate` พร้อม roomType / style / budgetRange enums               |
| Media library   | upload + pair management ใช้งานได้ที่ `/admin/media`                                                                                              |
| Seed            | 3 demo works (ไม่มีรูปจริง — รอ admin attach หลัง upload เข้า library)                                                                            |
| Toast / Confirm | `<Toaster>` + `useConfirm()` ทำงานใน admin scope ([Toast helper](src/lib/toast.ts), [ConfirmProvider](src/components/common/ConfirmProvider.tsx)) |
| Loading         | `<Skeleton>` + `<Spinner>` + `useDeferredLoading` มีพร้อม ([rules](.claude/rules/loading-states.md))                                              |
| Motion          | `<FadeUp>` / `<Stagger>` / `<FadeSwap>` มีพร้อม                                                                                                   |
| Cache tags      | `bumpTag` + `cacheTags.works` / `cacheTags.work(id)` / `cacheTags.sitemap`                                                                        |
| useIsMobile     | `useSyncExternalStore`-based hook, 768px breakpoint                                                                                               |

### ขาด (this plan)

- ❌ `/admin/works` route ทั้งหมด (list / new / edit)
- ❌ MediaPicker dialog (parked จาก Phase 3 plan §8)
- ❌ Server actions / services สำหรับ work + work_images
- ❌ Public `(public)` route group และ `/works/[slug]`
- ❌ `<BeforeAfterSlider>` + `<BeforeAfterToggle>` + `<BeforeAfterCard>` components
- ❌ MDX `<BeforeAfter>` whitelist entry + `lib/mdx/components.tsx` ทั้งโมดูล (ยังไม่ถูกสร้าง)
- ❌ JSON-LD `CreativeWork` builder

---

## 2. Decisions (locked 2026-05-12)

| #   | คำถาม                            | คำตอบ                                                                                                                             |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Slider กับ Toggle ใครเลือกใช้    | **Auto-detect** — `useIsMobile()` ตัดสินใจ default + user toggle mode ได้ทุกเมื่อ ผ่านปุ่มเล็กที่มุมล่างขวาของ card               |
| D2  | Drag reorder a11y                | **Drag + keyboard fallback** — `motion/react drag="y"` + `aria-keyshortcuts="ArrowUp ArrowDown"` (`<accessibility.md>` mandatory) |
| D3  | MDX embed                        | **มี** `<BeforeAfter pairId={number} />` ใน whitelist (Phase C) — pairId only (number), ไม่รับ raw URL กัน XSS                    |
| D4  | Auto-render pair vs explicit MDX | **ทั้งคู่** — `WorkGallery` (RSC) auto-render pairs ที่ admin attach ผ่าน UI + MDX embed สำหรับ admin ที่อยากวาง pair กลางบทความ  |

---

## 3. Schema impact

**No migration needed** — schema เดิมรองรับครบ:

- `work_images(work_id, media_asset_id)` PK พร้อม `pair_id` (nullable) FK to `media_pairs`
- 2 rows ที่มี `pair_id` ตรงกัน + อยู่ใน work เดียวกัน = renderer แสดงเป็น pair
- `works.cover_media_asset_id` FK to `media_assets` (SET NULL on delete)

> Verify: index `work_images_pair_idx` มีอยู่แล้ว ✓ ([migrations/0000_cultured_silver_samurai.sql](src/lib/db/migrations/0000_cultured_silver_samurai.sql) line 115)

---

## 4. Phased rollout

### ✅ Phase A — Admin works CRUD (~2.5 ชม.)

**Goal:** สร้าง/แก้/ลบ/publish work ผ่าน UI ได้ (ยังไม่มี gallery composition + public render)

**Files ใหม่:**

| Path                                              | บทบาท                                                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/lib/services/work.ts`                        | service: `listWorks` / `getWorkById` / `getWorkBySlug` / `createWork` / `updateWork` / `setWorkStatus` / `deleteWork` |
| `src/lib/actions/work.ts`                         | server actions wrap services + `requireRole()` + zod parse                                                            |
| `src/app/(admin)/admin/works/page.tsx`            | RSC: list table — cover thumb + title + roomType + status + tags + publishedAt + actions                              |
| `src/app/(admin)/admin/works/loading.tsx`         | table skeleton ตรง shape                                                                                              |
| `src/app/(admin)/admin/works/new/page.tsx`        | RSC + `<WorkForm mode="new">`                                                                                         |
| `src/app/(admin)/admin/works/[id]/edit/page.tsx`  | RSC fetch + `<WorkForm mode="edit" defaultValues={...}>`                                                              |
| `src/components/admin/works/WorkForm.tsx`         | client RHF + zodResolver                                                                                              |
| `src/components/admin/works/WorkListSkeleton.tsx` | row skeletons                                                                                                         |

**Form fields (ตรงกับ `WorkInsert` schema):**

| field             | UI                                                      |
| ----------------- | ------------------------------------------------------- |
| `title`           | `<Input>` required, on-blur auto-slug                   |
| `slug`            | `<Input>` พร้อมปุ่ม regenerate                          |
| `summary`         | `<Textarea>` 40-280 chars                               |
| `bodyMdx`         | `<Textarea>` (Phase 4 จะเปลี่ยนเป็น CodeMirror)         |
| `roomType`        | shadcn `<Select>` enum 8 options                        |
| `style`           | `<Input>` free text                                     |
| `yearCompleted`   | number input (1990-2100)                                |
| `location`        | `<Input>` 120 chars                                     |
| `areaSqm`         | number input                                            |
| `budgetRange`     | `<Select>` enum 5 options + null option                 |
| `tone` / `accent` | `<input type="color">` พร้อม preview swatch             |
| `status`          | `<Select>` draft/published/archived                     |
| `tagIds`          | multi-select chip (เลือกจาก tags ที่ kind ∈ work, both) |

**Sticky bottom action bar** (ตาม `uxui.md §13 Admin form`):

- ซ้าย: `< กลับไป list`
- ขวา: `บันทึก draft` + `เผยแพร่` (publish status flow) + `ลบ` (ถ้า mode=edit)
- ทุกปุ่มมี `<Spinner>` + `aria-busy` ระหว่าง action

**Cache invalidation per service call** (ตาม `database.md § Cache invalidation invariant`):

| Action                        | bumpTag                         |
| ----------------------------- | ------------------------------- |
| createWork(status=draft)      | `works`, `sitemap`              |
| createWork(status=published)  | `works`, `work:<id>`, `sitemap` |
| updateWork(any status change) | `works`, `work:<id>`, `sitemap` |
| deleteWork                    | `works`, `sitemap`              |

**DoD:**

- [ ] สร้าง work draft → DB row + redirect ไป `/admin/works/<id>/edit`
- [ ] publish → `published_at` ถูกตั้ง + revalidateTag ครบ
- [ ] slug uniqueness — ถ้าซ้ำ → Thai error message ผ่าน RHF
- [ ] delete → confirm dialog + cascade junction rows
- [ ] list page เปิดบน `/admin/works` + sortable by `publishedAt DESC`
- [ ] build / lint / test ผ่าน

---

### 🅑 Phase B — Gallery composition + MediaPicker (~3 ชม.)

**Goal:** admin compose gallery ของ work ได้ — pick assets จาก library, attach as singles หรือ pairs, reorder, set cover

**Files ใหม่:**

| Path                                               | บทบาท                                                                                                                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/admin/media/MediaPicker.tsx`       | modal dialog: ค้นหา title/alt, grid เลือก asset, multi-select. props: `open`, `onClose`, `onPick(items)`, `mode: 'single' \| 'multiple'`, `filter?: 'asset' \| 'pair'`            |
| `src/components/admin/works/WorkGalleryEditor.tsx` | list ของ `work_images` ของ work นั้น + actions                                                                                                                                    |
| `src/lib/services/workImage.ts`                    | service: `listWorkImages`, `attachAssetsToWork`, `attachPairToWork`, `reorderWorkImages`, `updateWorkImageKind`, `updateWorkImageCaption`, `setWorkCoverAsset`, `removeWorkImage` |
| `src/lib/actions/workImage.ts`                     | server actions + `requireRole()`                                                                                                                                                  |
| `src/lib/validation/workImage.ts`                  | zod schemas (`WorkImageInsert`, `ReorderInput`, `KindUpdate`)                                                                                                                     |

**WorkGalleryEditor UX:**

```
┌─────────────────────────────────────────────────┐
│ Gallery (5)                                      │
│  [+ เพิ่มรูป]  [+ เพิ่ม pair before/after]      │
├─────────────────────────────────────────────────┤
│  ⋮⋮  [thumb]  kind▼ [after]   ⭐ปก  ✏️caption  🗑  │
│  ⋮⋮  [thumb]  kind▼ [before]                     │
│        └─ paired with #2                          │
│  ⋮⋮  [thumb]  kind▼ [after]                      │
│        └─ paired with #1                          │
│  ⋮⋮  [thumb]  kind▼ [process]                    │
│  ⋮⋮  [thumb]  kind▼ [detail]                     │
└─────────────────────────────────────────────────┘
```

**Drag reorder (D2):**

- `motion/react` `drag="y"` + `dragConstraints` + `onDragEnd` คำนวณ new index
- keyboard: row มี `tabIndex={0}` + `aria-grabbed` + `aria-keyshortcuts="ArrowUp ArrowDown"`. Up = swap up, Down = swap down. Cmd/Ctrl+Up/Down = move to top/bottom
- ทุก reorder commit → `reorderWorkImagesAction(workId, orderedIds[])` → server update + `revalidateTag`
- visual feedback: `<Spinner>` overlay บน row ระหว่าง pending; ใช้ optimistic UI

**Add pair workflow:**

1. คลิก "+ เพิ่ม pair before/after"
2. MediaPicker filter='pair' เปิด → list pairs จาก library
3. คลิก pick → onPick(pairId) → server action `attachPairToWork(workId, pairId)` → insert 2 work_images rows:
   - row A: media_asset_id=pair.before_asset_id, kind='before', pair_id=pairId
   - row B: media_asset_id=pair.after_asset_id, kind='after', pair_id=pairId
4. router.refresh()

**Set cover:**

- toggle button ต่อแถว — clicking sets `works.cover_media_asset_id` to row's `media_asset_id`
- visual: ⭐ icon + "ปก" label, exclusive (one cover per work)

**DoD:**

- [ ] เพิ่ม single assets ผ่าน MediaPicker mode=multiple
- [ ] เพิ่ม pair ผ่าน MediaPicker mode=single filter=pair → 2 rows ถูก insert พร้อม pair_id
- [ ] drag reorder ผ่าน mouse — server commit + UI sync
- [ ] keyboard reorder ผ่าน arrow keys
- [ ] เปลี่ยน kind ต่อ row + update caption
- [ ] set cover toggle ทำงาน
- [ ] ลบ row → cascade ออกจาก work_images แต่ media_asset ยังอยู่ library
- [ ] a11y test: screen reader อ่าน row order + drag instructions

---

### 🅒 Phase C — Public renderer + BeforeAfter components (~2 ชม.)

**Goal:** `/works/<slug>` ใช้งานได้ + 2 เทคนิคของ before/after render สมบูรณ์

**Files ใหม่:**

| Path                                               | บทบาท                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/app/(public)/layout.tsx`                      | minimal AppHeader + Footer placeholder (Phase 6 ทำ full design)                            |
| `src/app/(public)/works/[slug]/page.tsx`           | RSC: fetch + render hero + body MDX + WorkGallery + JSON-LD                                |
| `src/app/(public)/works/[slug]/loading.tsx`        | detail skeleton (hero + meta + body lines + gallery placeholder)                           |
| `src/app/(public)/works/[slug]/not-found.tsx`      | 404 page (work not found / archived)                                                       |
| `src/components/public/work/WorkGallery.tsx`       | RSC: group images by pair → render pairs as BeforeAfterCard, singles as MDXImage           |
| `src/components/public/work/BeforeAfterCard.tsx`   | client wrapper auto-pick mode + UI toggle                                                  |
| `src/components/public/work/BeforeAfterSlider.tsx` | **Technique 1** — drag divider                                                             |
| `src/components/public/work/BeforeAfterToggle.tsx` | **Technique 2** — tap to flip                                                              |
| `src/components/public/work/BeforeAfterEmbed.tsx`  | client MDX entry point (resolves pairId → fetches pair data)                               |
| `src/components/mdx/MDXImage.tsx`                  | reusable next/image wrapper for MDX                                                        |
| `src/lib/mdx/components.tsx`                       | whitelist mapping + register BeforeAfter                                                   |
| `src/lib/mdx/compile.ts`                           | MDX compile pipeline (next-mdx-remote/rsc + remark-gfm + rehype-slug + rehype-pretty-code) |
| `src/lib/seo/jsonld.ts`                            | `buildCreativeWorkLd(work)`                                                                |
| `src/lib/seo/metadata.ts`                          | `buildMetadata({ work })`                                                                  |
| `src/lib/i18n/labels.ts`                           | เพิ่ม "ก่อน" / "หลัง" / "เปรียบเทียบภาพ" labels                                            |

---

#### Spec: `<BeforeAfterSlider>` (Technique 1)

```tsx
type Props = {
  before: { src: string; alt: string; width: number; height: number };
  after: { src: string; alt: string; width: number; height: number };
  initial?: number; // 0-100, default 50
  className?: string;
};
```

**Render:**

```
┌──────────────────────────────────────────┐
│  <img src=after alt={after.alt} />        │  ← bottom (object-cover)
│  ┌────────────┐                           │
│  │ <img       │       clip-path:          │
│  │   src=     │       inset(0 X% 0 0)     │  ← top, clipped from right
│  │   before/> │                           │
│  └────────────┘                           │
│            ╎    ← handle (vertical line + drag dot 44px)
└──────────────────────────────────────────┘
```

**State + math:**

- `pct: number` — controlled by pointer/keyboard
- `clip-path: inset(0 ${100 - pct}% 0 0)` บน wrapper ของ before image
- handle: `transform: translateX(${pct}%)`

**Pointer events:**

- `onPointerDown` → setIsDragging + `setPointerCapture`
- `onPointerMove` → `pct = (e.clientX - rect.left) / rect.width * 100` (clamp 0-100)
- `onPointerUp` → release capture

**A11y (WAI-ARIA slider pattern):**

- container `role="slider"`, `aria-valuemin={0}` / `aria-valuemax={100}` / `aria-valuenow={pct}` / `aria-valuetext="${pct}% เผยภาพหลังแต่ง"` / `aria-label="เปรียบเทียบภาพก่อน/หลัง"`
- `tabIndex={0}` + `onKeyDown`:
  - ArrowLeft/Right → pct ± 2
  - Shift+Arrow → ± 10
  - Home → 0, End → 100
- `focus-visible:ring-2 focus-visible:ring-ring`
- ทั้ง 2 รูปมี real `<img alt>` — handle เป็น `aria-hidden`

**Performance:**

- `next/image` ทั้ง 2 รูป, `sizes` ตาม wrapper width
- container `aspect-ratio` กัน CLS
- animate `transform` + `clip-path` เท่านั้น

**Reduced motion:** fallback ไป Toggle mode อัตโนมัติ (slider drag = motion-based, ไม่เหมาะกับ vestibular sensitivity)

---

#### Spec: `<BeforeAfterToggle>` (Technique 2)

```tsx
type Props = {
  before: { src: string; alt: string; width: number; height: number };
  after: { src: string; alt: string; width: number; height: number };
  initial?: "before" | "after"; // default 'after'
  className?: string;
};
```

**Render:**

- 2 images absolute stacked, active = `opacity-100`, inactive = `opacity-0`
- `transition: opacity 300ms ease-out` (ตรงตาม `uxui.md §14 motion language`)
- full-area `<button>` overlay ที่ toggle state
- badge มุมบนซ้าย ("ก่อน" / "หลัง") เปลี่ยนตาม state

**A11y:**

- `<button>` ครอบทั้ง card, `aria-pressed={state === 'after'}`, `aria-label="แตะเพื่อสลับภาพก่อน/หลัง — ตอนนี้แสดง<state>"`
- Enter/Space toggle (native button behavior ✓)
- inactive image `aria-hidden="true"`

**Reduced motion:** opacity transition กลายเป็น `duration-0` (CSS fallback ครอบให้แล้ว) — flip ทันที ไม่ fade

---

#### Spec: `<BeforeAfterCard>` (wrapper auto-pick + user toggle)

```tsx
type Mode = "slider" | "toggle";

type Props = {
  before: ImageData;
  after: ImageData;
  /** default mode if user hasn't overridden. 'auto' = decide by viewport. */
  mode?: Mode | "auto";
};
```

**Logic:**

- internal state: `userMode: Mode | null` (null = follow auto)
- `effectiveMode = userMode ?? (mode === 'auto' ? (isMobile ? 'toggle' : 'slider') : mode)`
- reduced motion → force `'toggle'`
- บนมุมล่างขวา: ปุ่ม icon เล็กสลับ mode (`aria-label="สลับโหมดเป็น<mode>"`, lucide `Move`/`Eye` icon)

**Persistence:** preference เก็บใน localStorage key `beforeAfter:mode` (optional, defer)

---

#### Spec: `<BeforeAfterEmbed>` (MDX entry point)

```tsx
type Props = { pairId: number };
```

**Render (Phase C v1):**

- client component
- รับ `pairId`, fetch pair data via context that the work detail page sets up (pre-loaded in RSC and passed via React context provider) — กัน N+1 query
- ถ้าไม่เจอ pair / pairId ไม่ valid → render `<aside>` warning ที่ admin เห็นเฉพาะใน dev (production silently noop)

**Security:**

- prop schema: `pairId: z.coerce.number().int().positive()` validated ตอน compile
- ไม่รับ raw URLs — `BeforeAfter` ใน MDX whitelist รับเฉพาะ pairId
- pair lookup limited to pairs ที่ผูกกับ work นี้ใน `work_images` (กัน admin ใส่ pairId ของ work อื่น)

---

#### `<WorkGallery>` (RSC) layout

```
1. Cover image (hero, full-width, aspect 2:1 desktop / 3:2 mobile)
2. body MDX (max-w-prose, includes inline <BeforeAfter pairId> if any)
3. Gallery section:
   - Pairs (grouped by pair_id) — render as <BeforeAfterCard>
   - Process + detail singles — grid
4. Tags row at bottom
5. JSON-LD <CreativeWork> at root
```

---

### Whitelist + MDX compile

**`src/lib/mdx/components.tsx`:**

```ts
export const mdxComponents = {
  img: MDXImage,
  h2: H2WithAnchor,
  h3: H3WithAnchor,
  MDXImage,
  BeforeAfter: BeforeAfterEmbed, // ⭐ NEW
  Quote,
  Aside,
  Gallery,
  CodeBlock,
};
```

> ⚠️ Security review (security-auditor agent) ต้อง sign-off ก่อน merge Phase C — ตาม `mdx-component-add` skill

---

## 5. Components dependency graph

```
Phase A
├── lib/services/work.ts          (depends on: db, schema, cache-tags)
├── lib/actions/work.ts           (depends on: services/work, auth-guard, validation/work)
├── components/admin/works/WorkForm.tsx
└── app/(admin)/admin/works/{page,new,[id]/edit,loading}.tsx

Phase B (depends on Phase A)
├── lib/services/workImage.ts     (depends on: db, schema, cache-tags)
├── lib/actions/workImage.ts
├── components/admin/media/MediaPicker.tsx   (depends on: services/media)
└── components/admin/works/WorkGalleryEditor.tsx  (depends on: MediaPicker + actions/workImage)

Phase C (depends on Phase A, somewhat Phase B for sample data)
├── lib/mdx/compile.ts            (NEW — bootstraps MDX pipeline)
├── lib/mdx/components.tsx         (whitelist)
├── lib/seo/jsonld.ts + metadata.ts
├── components/public/work/{BeforeAfterSlider,Toggle,Card,Embed,Gallery}.tsx
└── app/(public)/{layout,works/[slug]/{page,loading,not-found}}.tsx
```

---

## 6. Out of scope (parked)

- Lightbox / fullscreen modal ของ gallery — `yet-another-react-lightbox` ตอน Phase 5+
- CodeMirror MDX editor — Phase 4
- MDX preview pane live render ใน editor — Phase 4
- Pinch-zoom slider บน mobile — defer
- Saving slider position default % per pair (admin set) — defer
- Animated transition ระหว่าง slider ↔ toggle mode switch — defer
- localStorage persistence ของ user mode preference — defer (read above; nice-to-have)
- Public works listing `/works` — Phase 5 (`add-portfolio-work` skill กำหนด)
- Filter by room/style on `/works` — Phase 5
- OG image dynamic generation ผ่าน `next/og` — Phase 7

---

## 7. Per-phase verification checklist

### Phase A

```
[ ] npm run build / lint / test pass
[ ] Create work draft → row + redirect
[ ] Publish flow → publishedAt + tags revalidated
[ ] Slug uniqueness error in Thai
[ ] Delete via confirm dialog
[ ] /admin/works lists works sorted by publishedAt DESC
[ ] Loading skeleton matches table shape
[ ] Color picker for tone/accent saves valid hex
```

### Phase B

```
[ ] Add single asset via MediaPicker
[ ] Add pair → 2 work_images rows with shared pair_id
[ ] Drag reorder via mouse (server commit)
[ ] Drag reorder via keyboard (Arrow / Cmd+Arrow)
[ ] Change kind + caption per row
[ ] Set cover toggle (exclusive)
[ ] Remove row → media_asset stays in library
[ ] a11y: screen reader announces row order changes
[ ] aria-keyshortcuts on row, dnd-kit-style instructions panel
```

### Phase C

```
[ ] /works/<slug> renders for a published work
[ ] /works/<slug> 404s for non-existent slug
[ ] /works/<slug> noindex for archived work (still renders)
[ ] Cover image is LCP candidate (priority hint)
[ ] BeforeAfterSlider works with pointer + keyboard
[ ] BeforeAfterToggle works with click + Enter/Space
[ ] BeforeAfterCard auto-picks mode by viewport
[ ] User can toggle mode via corner button
[ ] Reduced motion → forces toggle mode
[ ] MDX <BeforeAfter pairId={...} /> renders in body
[ ] JSON-LD CreativeWork passes Rich Results Test
[ ] Sitemap.xml includes /works/<slug>
[ ] Lighthouse perf ≥ 90 on /works/<slug>
[ ] Security auditor reviewed MDX whitelist diff
```

---

## 8. Effort estimate

| Phase     | งาน                                                                                           | เวลา         |
| --------- | --------------------------------------------------------------------------------------------- | ------------ |
| A         | service + action + list + new + edit + form                                                   | 2.5 ชม.      |
| B         | MediaPicker + WorkGalleryEditor + drag reorder + a11y                                         | 3 ชม.        |
| C         | (public) layout + detail page + MDX bootstrap + 3 BA components + Embed + JSON-LD + whitelist | 2 ชม.        |
| **Total** |                                                                                               | **~7.5 ชม.** |

---

## 9. Status tracker (update after each phase)

| Phase | สถานะ      | PR / commit | หมายเหตุ                                                                                                                |
| ----- | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| A     | ✅ done    | 2026-05-12  | CRUD + list/new/edit, sticky bar, color picker, tag chips · React Compiler bailout on RHF `watch()` (warning ยอมรับได้) |
| B     | ✅ done    | 2026-05-12  | MediaPicker + WorkGalleryEditor + drag (`motion/react Reorder`) + keyboard `↑/↓` + per-row kind/caption/cover/delete    |
| C     | ✅ done    | 2026-05-12  | Public `/works/[slug]` + BeforeAfter (Slider/Toggle/Card auto) + MDX whitelist with pair closure + JSON-LD CreativeWork |

**Legend:** ⬜ pending · 🟡 in progress · ✅ done · 🔴 blocked

### Phase A — done notes

**Files shipped:**

- service: [`src/lib/services/work.ts`](src/lib/services/work.ts)
- actions: [`src/lib/actions/work.ts`](src/lib/actions/work.ts)
- form: [`src/components/admin/works/WorkForm.tsx`](src/components/admin/works/WorkForm.tsx)
- skeleton: [`src/components/admin/works/WorkListSkeleton.tsx`](src/components/admin/works/WorkListSkeleton.tsx)
- routes: [`src/app/(admin)/admin/works/{page,loading,new/page,[id]/edit/page}.tsx`](<src/app/(admin)/admin/works/>)

**Schema/validation tweaks:**

- [`src/lib/validation/work.ts`](src/lib/validation/work.ts) — renamed `coverImageId` → `coverMediaAssetId` ให้ตรง schema ใหม่ (Phase 3.5)

**Notable patterns:**

- `useTransition` 3 ตัว (saving / publishing / deleting) — แยก spinner state ต่อปุ่ม
- `sticky bottom action bar` ตาม `uxui.md §13 Admin form`
- `assertSlugAvailable` ใน service throw `WorkSlugTakenError` → action map ลง RHF `setError('slug', ...)` ให้ user เห็น inline
- `setWorkStatus` ใช้ `COALESCE(publishedAt, NOW())` กัน overwrite วันที่ publish เดิมเวลา flip กลับมา
- Cache invalidation ครบ: `works` + `work:<id>` + `sitemap` ตาม `database.md §invariant`

**Known TODO (Phase B parking):**

- WorkForm มี note "Phase B (gallery composition) จะมาเร็ว ๆ นี้" ใต้ section สุดท้าย — admin จะรู้ว่าอัปโหลดรูป + ผูก pair ทำหลังจากนี้
- `coverMediaAssetId` ยังไม่มี UI picker ใน form — set ผ่าน gallery editor (Phase B)

### Phase B — done notes

**Files shipped:**

- validation: [`src/lib/validation/workImage.ts`](src/lib/validation/workImage.ts) — `AttachAssetsInput` / `AttachPairInput` / `ReorderInput` / `UpdateKindInput` / `UpdateCaptionInput` / `SetCoverInput` / `RemoveInput`
- service: [`src/lib/services/workImage.ts`](src/lib/services/workImage.ts) — 7 ตัวครบ + cache invalidation per mutation
- actions: [`src/lib/actions/workImage.ts`](src/lib/actions/workImage.ts) — 7 server actions + `requireRole()` + zod parse
- picker: [`src/components/admin/media/MediaPicker.tsx`](src/components/admin/media/MediaPicker.tsx) — generic dialog (assets/pairs mode, search, multi-select)
- editor: [`src/components/admin/works/WorkGalleryEditor.tsx`](src/components/admin/works/WorkGalleryEditor.tsx) — `Reorder.Group` + per-row chrome
- routes: [`src/app/(admin)/admin/works/[id]/edit/page.tsx`](<src/app/(admin)/admin/works/[id]/edit/page.tsx>) — server-fetch library snapshot + pass to client editor

**Notable patterns:**

- **Drag reorder** ใช้ `motion/react` `Reorder.Group` + `useDragControls` — drag handle เป็นปุ่มแยก (`dragListener={false}` บน item, `onPointerDown={dragControls.start}` บน handle) ทำให้ keyboard focus สอบผ่าน
- **Keyboard fallback** — handle เป็น `<button>` ที่รับ `ArrowUp` / `ArrowDown` + `aria-keyshortcuts="ArrowUp ArrowDown"` + descriptive `aria-label` ที่บอกอันดับปัจจุบัน/ทั้งหมด
- **Optimistic reorder** — UI update ทันที, server commit ใน `startTransition`, rollback ถ้า fail
- **Pair sentinel cleanup** — เวลาลบ row ที่อยู่ใน pair → service strip `pair_id` ออกจาก partner row อัตโนมัติ (กัน renderer พยายาม pair กับ row ที่หายไป)
- **Sort compaction** — หลังลบ row, service re-write `sort` ของ rows ที่เหลือให้ continuous (0, 1, 2…) — เลี่ยง gap
- **Library snapshot** — edit page server-fetch `listMediaAssets({ limit: 500 })` + `listMediaPairs(500)` ครั้งเดียวแล้ว pass เป็น props ไปให้ MediaPicker — filter client-side
- **Cover toggle** — ถ้า row เป็น cover อยู่ → click = clear (set null); ถ้ายังไม่ใช่ → set เป็น cover

**Known TODO (Phase C parking):**

- WorkForm ของฟิลด์ `coverMediaAssetId` ใน /admin/works/new ยังคงเป็น input null — admin ต้องสร้าง work → save → ค่อยใช้ gallery editor ใน edit page ตั้ง cover (chain นี้ตั้งใจ — Phase A note ก็ระบุไว้แล้ว)

### Phase C — done notes

**Files shipped:**

- MDX pipeline: [`src/lib/mdx/compile.ts`](src/lib/mdx/compile.ts) + [`src/lib/mdx/components.tsx`](src/lib/mdx/components.tsx) — base whitelist (a → Link, h2/h3/p/blockquote/ul/ol/li/code/pre/img/MDXImage)
- Image renderer: [`src/components/mdx/MDXImage.tsx`](src/components/mdx/MDXImage.tsx) — next/image wrapper, default 1200×800, alt required
- BeforeAfter trio:
  - [`src/components/public/work/BeforeAfterSlider.tsx`](src/components/public/work/BeforeAfterSlider.tsx) — drag clip-path, pointer + keyboard, WAI-ARIA slider pattern
  - [`src/components/public/work/BeforeAfterToggle.tsx`](src/components/public/work/BeforeAfterToggle.tsx) — opacity crossfade 300ms, full-area button, aria-pressed
  - [`src/components/public/work/BeforeAfterCard.tsx`](src/components/public/work/BeforeAfterCard.tsx) — auto-pick by `useIsMobile()` + reduced-motion gate via `useSyncExternalStore` + user toggle corner button
- MDX embed factory: [`src/components/public/work/BeforeAfterEmbed.tsx`](src/components/public/work/BeforeAfterEmbed.tsx) — `composeBeforeAfterEmbed(pairs)` closes over the work's pair map (defense in depth — embed can only reference pairs of this work)
- Public gallery: [`src/components/public/work/WorkGallery.tsx`](src/components/public/work/WorkGallery.tsx) — RSC groups by `pair_id`, renders pairs as cards, singles as figures, skips cover (rendered separately)
- SEO: [`src/lib/seo/jsonld.ts`](src/lib/seo/jsonld.ts) (`CreativeWork` + `BreadcrumbList`), [`src/lib/seo/metadata.ts`](src/lib/seo/metadata.ts) (`buildWorkMetadata`)
- Routes:
  - [`src/app/(public)/layout.tsx`](<src/app/(public)/layout.tsx>) — minimal AppHeader (logo + nav + ThemeToggle) + footer
  - [`src/app/(public)/works/[slug]/page.tsx`](<src/app/(public)/works/[slug]/page.tsx>) — RSC, `revalidate=60`, generateMetadata, fetch work + images + tags, compile MDX with `BeforeAfter` injected, render breadcrumb + hero + body + gallery + 2x JSON-LD scripts
  - [`src/app/(public)/works/[slug]/loading.tsx`](<src/app/(public)/works/[slug]/loading.tsx>) — skeleton matching hero + body shape
  - [`src/app/(public)/works/[slug]/not-found.tsx`](<src/app/(public)/works/[slug]/not-found.tsx>) — empty-state with link to /works

**Notable patterns:**

- **MDX whitelist hardened** — base whitelist exports only safe tags. `BeforeAfter` is per-page-injected via factory that captures a Map of valid pair ids; embedding `<BeforeAfter pairId={99}>` for a pair not in this work just renders null (dev shows a red error aside)
- **Slider clip-path** — `inset(0 ${100 - pct}% 0 0)` on the top "before" layer; handle uses `transform: translateX(pct%)` so animation = GPU only
- **Reduced-motion gate** in `BeforeAfterCard` uses `useSyncExternalStore` to subscribe to `(prefers-reduced-motion: reduce)` reactively → forces toggle mode + hides the mode-switcher button so vestibular-sensitive users don't see motion-coded UI
- **MDX compile** decoupled from page — `compileWorkMdx(source, { BeforeAfter })` reusable for blog posts later
- **Pair lookup pre-built server-side** — page builds `Map<pairId, EmbedPairData>` from images list once; MDX embed reads from closure (no extra DB query per embed)
- **Cover excluded from gallery** — `WorkGallery` filters out `coverAssetId` so the hero image (rendered above) isn't duplicated
- **JSON-LD 2 scripts** — `CreativeWork` (work metadata) + `BreadcrumbList` (3-level breadcrumb) per `seo.md §8.3`
- **ISR 60s** + tag-based invalidation — admin save → `bumpTag(cacheTags.work(id))` → next visit re-validates
- **noindex for archived works** — `buildWorkMetadata` returns `robots: { index: false }` if status=archived (URL still works for backlinks per `content.md` § Status flow)

**Known TODO (parked):**

- Public works listing `/works` — needs separate page (Phase 5)
- OG image generation via `next/og` — Phase 7
- Lightbox / fullscreen view of gallery — Phase 5+
- Slider pinch-zoom on mobile — defer
- `/works/[slug]` Lighthouse audit — defer until real images upload

---

## 10. References

- Schema: [`src/lib/db/schema/works.ts`](src/lib/db/schema/works.ts)
- Validation: [`src/lib/validation/work.ts`](src/lib/validation/work.ts)
- Media library service: [`src/lib/services/media.ts`](src/lib/services/media.ts)
- Skill — add-portfolio-work: [`.claude/skills/add-portfolio-work/SKILL.md`](.claude/skills/add-portfolio-work/SKILL.md)
- Skill — motion-patterns (drag handle): [`.claude/skills/motion-patterns/SKILL.md`](.claude/skills/motion-patterns/SKILL.md)
- Skill — mdx-component-add (whitelist procedure): [`.claude/skills/mdx-component-add/SKILL.md`](.claude/skills/mdx-component-add/SKILL.md)
- Rule — uxui §9.5 detail page layout: [`.claude/rules/uxui.md`](.claude/rules/uxui.md)
- Rule — accessibility (focus, keyboard, ARIA): [`.claude/rules/accessibility.md`](.claude/rules/accessibility.md)
- Rule — loading-states (Skeleton + Spinner): [`.claude/rules/loading-states.md`](.claude/rules/loading-states.md)
- Rule — database (transactions + revalidateTag): [`.claude/rules/database.md`](.claude/rules/database.md)
- Rule — seo (JSON-LD CreativeWork): [`.claude/rules/seo.md`](.claude/rules/seo.md)
- Rule — security (MDX XSS + file upload): [`.claude/rules/security.md`](.claude/rules/security.md)
