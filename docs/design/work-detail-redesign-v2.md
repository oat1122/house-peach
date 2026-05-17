# Design spec — Work Detail page v2 (Editorial Magazine Direction)
# `/works/[slug]` — replaces the sticky-sidebar approach from v1

**v2.2 — 2026-05-12:** Closed out all open questions from v2.0/2.1.
Foundational decisions are now embedded in body sections (no more §23
open-question list). Sidebar issues from external review resolved:
column-flow fallback for short prose, single "see more" link, parallel
fetch (no Suspense), CSS-only mobile visibility switch. Phase-2 items
explicitly deferred — see §24 "Deferred to phase 3".

**Implementer:** fe-public
**Schema additions required:** be-data (5 new columns + 1 enum value)
**Depends on:** v1 components as base — see §15 for extend vs create decisions
**Historical reference:** `docs/design/work-detail-redesign.md` (v1 — do not delete)

---

## 1. Problem statement — what v1 does well, what gap v2 fills

V1 (currently shipped) solved the original problems correctly:

- It broke the monotone single-column with a sticky meta sidebar on desktop
- It surfaced `kind` groupings (before/after, process, detail) as named sections
- It shipped the masonry grid for detail + process images
- It left JSON-LD, metadata, and breadcrumb untouched

The gap v1 did not close: it still reads like a data-display page rather than an editorial story. Typography is functional (DM Serif h1, DM Sans body) but not expressive — there is no typographic hierarchy beyond the headline. Sections are separated by eyebrow labels but carry no sense of narrative progression. The sticky sidebar, while useful, signals "product page" to the reader's eye. There is no emotional midpoint (pull quote, designer note) between the images — the page has no intimacy.

V2 answers: what if this were a two-page spread in AD Thailand or บ้านและสวน?

---

## 2. Three pillars

### Pillar 1: Typography is the protagonist

Per `uxui.md §2`, DM Serif Display is restricted to h1 hero today. V2 extends its expressive role:
- The H1 gets `leading-[1.05]` and runs at `text-5xl md:text-7xl` — not the current `text-4xl md:text-5xl`. This is a deliberate one-step increase
- Chapter dividers use a sans-serif micro-label with flanking hairlines — a typographic device, not chrome
- Body prose upgrades to `text-lg leading-[1.75]` (currently `text-base`) — magazine body size
- Drop cap on the first paragraph of each chapter: `::first-letter` pseudo-element, 3-line height, `float-left`, accent color
- Pull quote: DM Serif Italic, `text-2xl md:text-3xl`, generous leading, left border rule in accent color

One rule from `uxui.md §2` to hold: `font-serif` stays off body paragraphs — the drop cap and pull quote are display typography, not body. Body remains DM Sans.

### Pillar 2: Numbers sell credibility

First-time homeowners come to this page asking "can they handle a project like mine?" before they care about aesthetics. Showing `45 วัน · 72 ตร.ม. · 2024` in large numerals at the top of the page answers that question in under three seconds without requiring the visitor to read a paragraph.

The stat band: four independent cells (area, duration, budget, year), each `null`-collapsible. Numbers rendered at `text-4xl md:text-5xl font-bold font-sans tracking-tight text-ink`. Labels at `text-xs uppercase tracking-widest text-muted`. Accent color is reserved for: drop cap first-letter, chapter number labels, CTA button background, and `WorkCardCompact` hover state — those four spots only.

### Pillar 3: Rhythm — verse-chorus-verse

The page is scored like music, not presented as a list of features. Loud sections (hero image, before/after chorus) are separated by quiet ones (brief prose, pull quote). The chapter divider is the breath-marker — `mt-24` before each chapter (not the current `mt-12 md:mt-16`). This is the most consequential layout change: the generous vertical air between sections is the brand feel made tangible.

References: `uxui.md §1` (generous whitespace), `uxui.md §12` (density = generous for public pages).

---

## 3. Schema additions

### 3.1 New columns on `works` table

All nullable, non-destructive to existing rows.

```
works.durationDays   int | null
works.clientQuote    text | null          (mediumtext in Drizzle: mediumtext('client_quote'))
works.clientName     varchar(80) | null
works.designerNote   text | null          (mediumtext in Drizzle: mediumtext('designer_note'))
works.materials      json | null          -- MariaDB JSON column (Drizzle: json('materials'))
```

`materials` JSON shape: `Array<{ name: string; colorHex: string }>`, max 8 items, validated in zod.
`colorHex` must match `/^#[0-9a-f]{6}$/i` — use the existing `HexColor` brand type from `lib/validation/common.ts`.

**MariaDB JSON column note:** Drizzle's `json()` maps to MariaDB's native JSON column type (MariaDB 10.2.7+). This project is on MariaDB 11 per `ARCHITECTURE.md` — native JSON is available. Store as text internally, no additional index needed. The max-8 rule is enforced at zod layer only.

**Backfill concern:** all nullable → `DEFAULT NULL` → zero migration risk for existing rows.

**No FK indexes needed** for any of these columns — they are scalar values on the `works` row, not foreign keys.

### 3.2 `work_images.kind` enum — add `'plan'` value

Current enum: `['before', 'after', 'process', 'detail']`
New enum: `['before', 'after', 'process', 'detail', 'plan']`

**Migration warning for db-migration-reviewer:** MariaDB `mysqlEnum` is implemented as `ENUM(...)` at the SQL layer. Adding a new value to an existing `ENUM` column requires an `ALTER TABLE ... MODIFY COLUMN` which on MariaDB 10.3+ is in-place and does not rebuild the table. Verify the exact MariaDB 11 version in production — `ALTER TABLE work_images MODIFY COLUMN kind ENUM('before','after','process','detail','plan') NOT NULL DEFAULT 'after'` should be safe but must be tested on staging first.

`isFeatured` on `work_images` is unaffected — it is a boolean column on a separate row, no relation to kind enum.

### 3.3 Zod schema additions

Add to `src/lib/validation/work.ts`:

```
WorkInsert adds:
  durationDays:  z.coerce.number().int().positive().max(3650).nullable().optional()
  clientQuote:   z.string().max(500).nullable().optional()
  clientName:    z.string().max(80).nullable().optional()
  designerNote:  z.string().max(1000).nullable().optional()
  materials:     z.array(z.object({
                   name: z.string().min(1).max(60),
                   colorHex: HexColor,
                 })).max(8).nullable().optional()
```

Add to `workImageKinds` array: `'plan'` value.

---

## 4. ASCII mockup — MOBILE 390px

```
┌─────────────────────────────────────────┐
│  หน้าแรก / ผลงาน / ชื่องาน             │  nav[breadcrumb] text-xs text-muted, pt-4 px-4
├─────────────────────────────────────────┤
│                                         │
│  บ้านเดี่ยว · ห้องนอน · 2024          │  eyebrow: text-[11px] uppercase tracking-widest
│                                         │  text-muted, px-4 mt-6
│                                         │
│  ห้องที่รู้สึก                          │  h1: font-serif text-5xl font-bold
│  เหมือนกอดอ้อน                         │  tracking-tight leading-[1.05]
│                                         │  px-4 mt-3 max-w-[14ch]
│  สรุปในหนึ่งหรือสองประโยค              │  p: text-base text-muted leading-[1.65]
│  เล่าบรรยากาศของงาน                    │  px-4 mt-3 max-w-prose
│                                         │
├─────────────────────────────────────────┤  (breathing space: mt-8)
│                                         │
│  ┌─────────────────────────────────┐   │  HERO IMAGE
│  │                                 │   │  full-bleed: -mx-4
│  │   Cover image — aspect [16/9]   │   │  aspect-[16/9] on mobile
│  │   (priority LCP)                │   │  (changed from v1's 3:2)
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│                                         │  STAT BAND — bg-bg2, full-bleed
│  ┌──────────────────────────────────┐  │  -mx-4, py-6 px-4
│  │  72       45      300k    2024   │  │  4-cell horizontal on mobile
│  │  ตร.ม.   วัน     – 700k   ปี   │  │  (if stat null: cell hides, grid shrinks)
│  │                                  │  │  Numbers: text-3xl font-bold text-ink
│  └──────────────────────────────────┘  │  Labels: text-[10px] uppercase tracking-widest
│                                         │  text-muted mt-1
├─────────────────────────────────────────┤
│                                         │
│  ──── 01 / โจทย์ ────────────────────  │  CHAPTER DIVIDER — see §7 for markup
│                                         │  mt-16 px-4
│                                         │
│  ┌ drop cap letter here ─────────────┐ │  BRIEF PROSE — px-4 mt-6
│  │ paragraph text at text-lg         │ │  font-sans text-lg leading-[1.75]
│  │ leading-[1.75], max-w-prose,      │ │  max-w-prose
│  │ first letter is drop cap          │ │  ::first-letter: 3-line float
│  └────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ──── 02 / การเปลี่ยนแปลง ───────────  │  CHAPTER DIVIDER — mt-16 px-4
│                                         │
│  ┌─────────────────────────────────┐   │  HERO BEFORE/AFTER — full-bleed -mx-4
│  │                                 │   │  (largest B/A pair = "chorus")
│  │   BeforeAfterCard               │   │  aspect from stored after image
│  │   full-bleed, rounded-none      │   │
│  │   (no rounded on chorus pair)   │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│  Caption if present                     │  text-xs text-muted px-4 mt-2 text-center
│                                         │  font-sans italic
│                                         │
│  ┌──────────────┐ ┌──────────────┐     │  Additional B/A pairs (smaller)
│  │ Before →     │ │ After        │     │  2-up with toggle (mobile) mt-4 gap-2 px-4
│  └──────────┘   └──────────────┘      │
│                                         │
│  ┌─────────────────────────────────┐   │  PULL QUOTE — mt-10 px-4
│  │ │                               │   │  left border: border-l-2 border-accent
│  │ │ "ทีม house-peach เข้าใจว่า   │   │  pl-4
│  │ │  เราต้องการอะไรจริงๆ"         │   │  font-serif italic text-2xl
│  │ │                               │   │  text-ink leading-[1.5]
│  │ │ — คุณสมศรี                   │   │  cite: text-xs text-muted mt-2
│  └─────────────────────────────────┘   │  (entire block skips if clientQuote null)
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ──── 03 / แนวคิดและวัสดุ ────────────  │  CHAPTER DIVIDER — mt-16 px-4
│                                         │
│  ■ Travertine  ■ Brass  ■ Linen         │  MATERIAL PALETTE — px-4 mt-6
│  [chip] [chip] [chip]                   │  horizontal scroll ul, gap-2
│                                         │  (skips if materials null/empty)
│                                         │
│  ┌─────────────────────────────────┐   │  FLOOR PLAN THUMB — px-4 mt-4
│  │  แปลนห้อง (kind='plan' image)   │   │  aspect-[4/3] rounded-md
│  └─────────────────────────────────┘   │  (skips if no plan image)
│  แปลนห้อง — Floor plan                 │  caption: text-xs text-muted text-center mt-2
│                                         │
│  [SIDEBAR RELATED CARDS NOT SHOWN]      │  ** MOBILE: sidebar related cards HIDDEN
│                                         │     entirely. Discovery = bottom related grid.
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ──── 04 / กระบวนการ ─────────────────  │  CHAPTER DIVIDER — mt-16 px-4
│                                         │
│  ① ─────────────────────────────────   │  PROCESS TIMELINE — vertical on mobile
│  │  ┌────────────────────────────┐     │  numbered steps, each step = image thumb
│  │  │ process image 1 (aspect    │     │  + caption text below. Step number:
│  │  │ from stored asset)         │     │  text-accent font-bold text-sm
│  │  └────────────────────────────┘     │  thumb: rounded-md, aspect from stored asset
│  │  Caption / step description         │  caption: text-sm text-muted mt-2
│  │                                     │  connector line: border-l-2 border-line ml-3
│  ② ─────────────────────────────────   │
│  │  ┌────────────────────────────┐     │
│  │  │ process image 2            │     │
│  │  └────────────────────────────┘     │
│  │  Caption                            │
│  │                                     │
│  ③ ─────────────────────────────────   │
│  │  ┌────────────────────────────┐     │  (only process images, each shown once)
│  │  │ process image 3            │     │  max recommended: 8 steps
│  │  └────────────────────────────┘     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ──── 05 / รายละเอียด ────────────────  │  CHAPTER DIVIDER — mt-16 px-4
│                                         │
│  ┌─────────────────────────────────┐   │  DETAIL MASONRY — full-bleed -mx-4
│  │  WorkMasonryGrid (existing)     │   │  (unchanged from v1 — do not modify)
│  │  featured tiles 2×2            │   │
│  │  non-featured auto-tiled       │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │  DESIGNER'S NOTE — px-4 mt-16
│  │ ─────────────────────────────── │   │  bg-bg2 rounded-xl p-6
│  │ "ใน project นี้เราตั้งใจให้     │   │  font-sans italic text-base
│  │  แสงธรรมชาติเป็นตัวเดินเรื่อง"  │   │  text-ink leading-[1.75]
│  │                                 │   │
│  │              — ทีม house-peach  │   │  attribution: text-xs text-muted
│  └─────────────────────────────────┘   │  text-right mt-3
│                                         │  (skips if designerNote null)
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │  CTA CARD — px-4 mt-16
│  │  ชอบผลงานนี้?                   │   │  bg-card border border-line rounded-xl
│  │  ปรึกษาฟรีไม่มีค่าใช้จ่าย       │   │  p-6 text-center
│  │                                 │   │
│  │  [นัดปรึกษาฟรี]                 │   │  button 1: full-width, bg-accent text-bg
│  │  [ดูผลงานสไตล์เดียวกัน →]       │   │  button 2: text-link, text-accent
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ผลงานที่เกี่ยวข้อง                     │  RELATED WORKS — px-4 mt-16
│  Related works                          │  h2: text-xl font-semibold
│                                         │
│  ┌──────────┐ ┌──────────┐             │  2-up grid on mobile (3-up on desktop)
│  │ WorkCard │ │ WorkCard │             │  (skips if 0 related results)
│  └──────────┘ └──────────┘             │
│                                         │
│  #japandi  #living  #bedroom            │  TAGS — mt-10 px-4 flex-wrap
│                                         │
└─────────────────────────────────────────┘
```

---

## 5. ASCII mockup — DESKTOP ≥1024px

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  หน้าแรก / ผลงาน / ชื่องาน                                                  │  pt-8 px-6
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────── max-w-4xl centered ──────────────────────────┐ │
│  │                                                                          │ │
│  │  บ้านเดี่ยว · ห้องนอน · 2024                                            │ │  eyebrow: 12px
│  │                                                                          │ │
│  │  ห้องที่รู้สึกเหมือนกอด                                                 │ │  h1: font-serif
│  │  อ้อนเข้าหาตัวเอง                                                       │ │  text-7xl (72px)
│  │                                                                          │ │  leading-[1.05]
│  │  สรุป 1-2 ประโยค: บรรยากาศและแนวคิดหลักของงาน                          │ │  tracking-tight
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │  HERO IMAGE
│  │                                                                     │    │  full-bleed -mx-6
│  │   Cover image — aspect [21/9] on desktop (cinematic)                │    │  aspect-[21/9]
│  │   rounded-none (full-bleed, no radius)                              │    │  priority LCP
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─── STAT BAND — full-bleed bg-bg2 ──────────────────────────────────────┐ │  -mx-6 py-8
│  │                                                                          │ │
│  │      72              45            300k – 700k           2024           │ │  4-col grid
│  │   ตร.ม.            วัน              งบประมาณ             ปีที่เสร็จ    │ │  max-w-3xl mx-auto
│  │                                                                          │ │  numbers: text-5xl
│  └──────────────────────────────────────────────────────────────────────────┘ │  font-bold text-ink
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │  CHAPTER 01
│  ─────────────────────  01 / โจทย์ — The Brief  ──────────────────────────  │  max-w-4xl mx-auto
│                                                                              │  mt-24
│  ┌─────────────────────────────────── max-w-prose ─────────────────────┐    │
│  │ [D]rop cap — paragraph body, first letter floats 3-line serif        │    │  text-lg leading-[1.75]
│  │ cap in accent color, rest of first paragraph continues               │    │  mx-auto
│  │ normally in font-sans. Second paragraph no drop cap.                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │  CHAPTER 02
│  ─────────────  02 / การเปลี่ยนแปลง — Before & After  ──────────────────  │  mt-24
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │  CHORUS pair
│  │                                                                       │  │  full-bleed -mx-6
│  │   BeforeAfterCard (pair 1 — CHORUS — largest, full container width)   │  │  no rounding
│  │   aspect from stored 'after' image                                    │  │  caption below
│  │                                                                       │  │  centered italic
│  └───────────────────────────────────────────────────────────────────────┘  │
│  Caption                                                          text-sm    │
│                                                                              │
│  ┌───────────────────────────┐  ┌───────────────────────────┐              │  Additional pairs
│  │ pair 2 — BeforeAfterCard  │  │ pair 3 — BeforeAfterCard  │              │  2-col grid
│  │ (smaller, max-w-2xl each) │  │                           │              │  max-w-5xl mx-auto
│  └───────────────────────────┘  └───────────────────────────┘              │  mt-8 gap-6
│                                                                              │
│  ┌──────────────────────────────── PULL QUOTE ──────────────────────────┐  │  max-w-2xl mx-auto
│  │                                                                      │  │  mt-16
│  │ ┃ "ทีม house-peach เข้าใจว่าเราต้องการอะไรจริงๆ และทำให้มันออกมา   │  │  left border:
│  │ ┃  ดีกว่าที่เราจินตนาการไว้"                                         │  │  border-l-4 border-accent
│  │                                                                      │  │  pl-8
│  │                            — คุณสมศรี, เจ้าของบ้าน                  │  │  font-serif italic
│  └──────────────────────────────────────────────────────────────────────┘  │  text-3xl leading-[1.4]
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │  CHAPTER 03
│  ───────────────  03 / แนวคิดและวัสดุ — Concept  ───────────────────────  │  mt-24
│                                                                              │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐      │  2-col: [1fr 280px]
│  │                               │   │                               │      │  max-w-5xl mx-auto
│  │  [left column reserved]       │   │  ■ Travertine #d4c5b0         │      │  gap-16 mt-8
│  │  When wordCount(bodyMdx) ≥250 │   │  ■ Brass #b8924a              │      │  sidebar: self-start
│  │  this column is empty (prose  │   │  ■ Linen #f0e6d0              │      │
│  │  already rendered in ch01).   │   │  (WorkMaterialPalette)        │      │
│  │  When wordCount < 250 the     │   │                               │      │
│  │  entire section is single-col │   │  ┌─────────────────────────┐  │      │
│  │  flow — see §S13c             │   │  │  แปลน (kind='plan')     │  │      │
│  │                               │   │  └─────────────────────────┘  │      │
│  │                               │   │  (WorkFloorPlanThumb)         │      │
│  │                               │   │                               │      │
│  │                               │   │  ─────────────────────────    │      │  divider only if
│  │                               │   │                               │      │  ≥1 related card
│  │                               │   │  ผลงานสไตล์เดียวกัน          │      │  h3: text-xs uppercase
│  │                               │   │  Similar works                │      │  tracking-widest text-muted
│  │                               │   │                               │      │
│  │                               │   │  ┌─────────────────────────┐  │      │  WorkCardCompact
│  │                               │   │  │ [60px] Title line 1     │  │      │  thumb: w-16 h-16
│  │                               │   │  │        Title line 2     │  │      │  object-cover rounded-sm
│  │                               │   │  │        style · year     │  │      │  title: text-sm font-medium
│  │                               │   │  └─────────────────────────┘  │      │  line-clamp-2
│  │                               │   │  ┌─────────────────────────┐  │      │  meta: text-xs text-muted
│  │                               │   │  │ [60px] Title line 1     │  │      │
│  │                               │   │  │        Title line 2     │  │      │  (up to 3 cards,
│  │                               │   │  │        style · year     │  │      │   fewer if < 3 matches)
│  │                               │   │  └─────────────────────────┘  │      │
│  │                               │   │  ┌─────────────────────────┐  │      │
│  │                               │   │  │ [60px] Title line 1     │  │      │
│  │                               │   │  │        style · year     │  │      │
│  │                               │   │  └─────────────────────────┘  │      │
│  └───────────────────────────────┘   └───────────────────────────────┘      │
│                                                                              │
│  Note: sidebar uses self-start — it does NOT height-match the prose column. │
│  If wordCount < 250, whole section renders as single-column flow (§S13c).   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │  CHAPTER 04
│  ─────────────────  04 / กระบวนการ — Process  ──────────────────────────  │  mt-24
│                                                                              │
│  ┌──────────────────────────── HORIZONTAL TIMELINE ─────────────────────┐  │  overflow-x-auto
│  │                                                                       │  │  max-w-5xl mx-auto
│  │  ①──────────②──────────③──────────④──────────⑤──────────⑥          │  │  horizontal: flex gap-8
│  │  │          │           │           │           │           │          │  │  connector: border-t-2
│  │  ┌────────┐ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ ┌──────┐ │  │  border-line mt-4
│  │  │ img 1  │ │ img 2  │  │ img 3  │  │ img 4  │  │ img 5  │ │ img 6│ │  │
│  │  └────────┘ └────────┘  └────────┘  └────────┘  └────────┘ └──────┘ │  │  Each step: w-48
│  │  Caption 1  Caption 2   Caption 3   Caption 4   Caption 5  Caption6  │  │  flex-none
│  └───────────────────────────────────────────────────────────────────────┘  │  img: aspect-[4/3]
│                                                                              │  rounded-md
│  (>6 steps: same horizontal layout, scroll container)                       │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │  CHAPTER 05
│  ─────────────────  05 / รายละเอียด — Details  ──────────────────────────  │  mt-24
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │  WorkMasonryGrid
│  │  (WorkMasonryGrid — unchanged from v1 — full-bleed -mx-6)              │ │  (no changes)
│  │  featured tiles 2×2, aspect-auto tiling                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────── DESIGNER'S NOTE ────────────────────────────────┐ │  max-w-2xl mx-auto
│  │                                                                          │ │  mt-24
│  │  "ใน project นี้เราตั้งใจให้แสงธรรมชาติเป็นตัวเดินเรื่อง               │ │  bg-bg2 rounded-xl p-8
│  │   พื้น Travertine ช่วยดักแสงให้กระจายทั่วห้อง"                         │ │  font-sans italic
│  │                                                                          │ │  text-base leading-[1.75]
│  │                                         — ทีม house-peach               │ │  attribution: text-right
│  └──────────────────────────────────────────────────────────────────────────┘ │  text-xs text-muted mt-4
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────── CTA CARD ───────────────────────────────────┐ │  max-w-lg mx-auto mt-24
│  │                                                                         │ │  bg-card border border-line
│  │              ชอบผลงานนี้? ปรึกษาทีมเราได้ฟรี                          │ │  rounded-xl p-8 text-center
│  │                                                                         │ │
│  │  [ นัดปรึกษาฟรี ]       ดูผลงานสไตล์เดียวกัน →                        │ │  btn1: full-width bg-accent
│  │                                                                         │ │  btn2: text-link text-accent
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ผลงานที่เกี่ยวข้อง  Related works                                          │  max-w-6xl mx-auto
│                                                                              │  mt-16 px-6
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │  grid-cols-3 gap-6
│  │  WorkCard    │  │  WorkCard    │  │  WorkCard    │                      │  (WorkCard: existing)
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
│                                                                              │
│  #japandi   #bedroom   #minimal                                              │  tags: px-6 mt-10
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Section-by-section breakdown

### S1: Breadcrumb
- **Component:** inline in page RSC (existing pattern, no extraction)
- **RSC:** yes
- **Null fallback:** always present
- **Motion:** none
- **Tokens:** `text-muted` links, `text-ink` current page
- **SEO:** `<nav aria-label="breadcrumb">`, unchanged from v1

### S2: Eyebrow
- **Component:** inline `<p>` in page RSC
- **Copy:** `{roomTypeLabel} · {work.style} · {work.yearCompleted}` — omit null fields
- **Null fallback:** if all three null, render `{roomTypeLabel}` only (roomType is required in DB)
- **Motion:** `<FadeUp>` wrapping eyebrow + h1 + summary as one unit
- **Tokens:** `text-muted` text-[11px] uppercase tracking-widest
- **Thai note:** Use `·` (middle dot U+00B7), not `/`

### S3: H1
- **Component:** `<h1>` inside existing `<header>`, same RSC page
- **Typography:** `font-serif text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]`
- **Change from v1:** bumped from `text-4xl md:text-5xl` — one scale step up
- **Null fallback:** `work.title` is required, never null
- **Motion:** shares `<FadeUp>` with eyebrow

### S4: Summary
- **Component:** `<p>` inside `<header>`, inline in page
- **Typography:** `text-base md:text-lg text-muted leading-[1.65] max-w-prose`
- **Null fallback:** `work.summary` is required (min 80 chars in zod), never null
- **Motion:** shares `<FadeUp>` with h1

### S5: Hero image
- **Component:** `WorkHero` (existing) — extend with new aspect classes
- **Change from v1:** mobile `aspect-[16/9]` (was `aspect-[3/2]`), desktop `aspect-[21/9]` (was `aspect-[2/1]`). Cinematic crops, no rounding (`rounded-none` replaces `rounded-2xl`). The aspect ratio change is DECIDED — no per-work override field is added in v2.2. Admin should review existing portrait-format cover images before this ships and re-crop as needed via the media library. No schema change needed for this.
- **Extend or new:** extend `WorkHero` with optional `aspectClass` prop defaulting to v1 values; page passes v2 values. LOC stays under 40 lines
- **RSC:** yes
- **Motion:** none — LCP element, never animate
- **Null fallback:** if no cover image, this section is skipped. Page still has breadcrumb + h1 + summary + stats + chapters

### S6: Stat band
- **Component:** `WorkStatBand` — new component
- **RSC:** yes
- **Location:** `src/components/public/work/WorkStatBand.tsx`
- **Props sketch:**
  ```
  {
    areaSqm: number | null
    durationDays: number | null
    budgetRange: BudgetRange | null
    yearCompleted: number | null
  }
  ```
- **Rendering rule:** each cell is independently conditional. The grid uses `grid-cols-[repeat(auto-fit,minmax(80px,1fr))]` so it collapses gracefully from 4-up to 3-up to 2-up as cells disappear. Never show placeholder dashes for null cells — the cell is simply absent. If all four are null, the entire band (`<section>`) returns `null`.
- **durationDays formatting:** admin enters raw integer days. Display logic:
  - `< 30` → `{n} วัน`
  - `30–89` → `{Math.round(n/7)} สัปดาห์`
  - `≥ 90` → `{Math.round(n/30)} เดือน`
  This is a pure utility function in `src/lib/utils/formatDuration.ts` (new, ~15 lines)
- **budgetRange formatting:** reuse `resolveBudgetLabel` from existing `lib/utils/workLabels.ts`
- **Motion:** `<FadeUp>` on the whole band
- **Tokens:** numbers `text-ink` (≥ 7:1 contrast on all 4 presets), labels `text-muted`, band `bg-bg2` (full-bleed), `text-3xl md:text-5xl` numbers. Accent is NOT used for stat numbers — see Pillar 2 in §2.

### S7: Chapter 01 divider — "โจทย์"
See §7 for markup pattern. `mt-24` before every chapter divider.

### S8: Brief prose
- **Component:** `WorkChapterBody` — new, wraps a body text string with drop cap class
- **RSC:** yes
- **Source:** `work.bodyMdx` — the single MDX body field. This field renders ONCE, here, in chapter 01. Chapter 03 does NOT re-render the MDX body. The chapter structure is a page-level framing around the single MDX body, not separate database fields. No second prose field is added to the schema for v2.2.
- **Drop cap:** applied to the first visible `<p>` inside `.chapter-body` via CSS `.chapter-body > p:first-child::first-letter` — see §7
- **Motion:** `<FadeUp>` wrapping `WorkChapterBody`
- **Thai drop cap warning:** see §21 red-line item

### S9: Chapter 02 divider — "การเปลี่ยนแปลง"

### S10: Hero before/after pair (CHORUS)
- **Component:** `WorkChorusBeforeAfter` — new wrapper around existing `BeforeAfterCard`
- **RSC:** yes (inner `BeforeAfterCard` is client for interaction)
- **Logic:** takes the first before/after pair from `beforeAfterClusters`. If no pairs, the chorus renders nothing (section disappears)
- **Visual distinction from v1:** no `rounded-2xl` — full-bleed to container edges. Caption centered below, italic sans
- **Additional pairs:** pairs 2+ render at `max-w-2xl` side-by-side (desktop 2-col, mobile stacked), with `rounded-2xl`
- **Motion:** no motion on `BeforeAfterCard` (same as v1 rule)
- **Null fallback:** entire chapter 02 is skipped if no before/after pairs exist

### S11: Pull quote
- **Component:** `WorkPullQuote` — new
- **RSC:** yes
- **Props:**
  ```
  {
    quote: string
    clientName: string | null
  }
  ```
- **Null fallback:** if `clientQuote` is null → section returns `null` entirely
- **If `clientName` null but quote exists:** renders quote without attribution line
- **Markup:** `<figure><blockquote>...</blockquote>{clientName && <figcaption><cite>— {clientName}</cite></figcaption>}</figure>`
- **Motion:** `<FadeUp>`
- **Tokens:** `border-accent` left rule, `text-ink` quote text, `text-muted` attribution

### S12: Chapter 03 divider — "แนวคิดและวัสดุ"

### S13: Concept section (prose column + chapter-03 sidebar)
- **Component:** `WorkConceptSection` — new
- **RSC:** yes
- **Location:** `src/components/public/work/WorkConceptSection.tsx`
- **Chapter 03 prose:** the left column on desktop is EMPTY (no prose field). The MDX body was already rendered in S8. Chapter 03 shows only the sidebar content on desktop — palette, floor plan, related cards. The left column `<div>` is present in the DOM as a grid cell for spacing only; it has no visible content. On mobile single-column, there is no left column.
- **Layout (wordCount ≥ 250):** desktop `grid grid-cols-[1fr_280px] gap-16 items-start`. Both grid children have `self-start`. The left cell is an empty `<div>` providing the grid gutter. The sidebar `<aside>` occupies the right cell.
- **Layout (wordCount < 250 — column-flow fallback):** see §S13c.
- **Right column / sidebar (desktop only):** rendered inside `<aside aria-label="วัสดุ แปลน และผลงานที่เกี่ยวข้อง">`. Top-to-bottom order:
  1. `WorkMaterialPalette` — chip strip, vertical stack on desktop (see §9)
  2. Floor plan thumb — first `work_images` row with `kind='plan'`, `aspect-[4/3] rounded-md`. Caption below. If null, this slot is skipped.
  3. `<hr>` divider (`border-t border-line mt-6 pt-6`) — only rendered if the related cards section below has ≥ 1 match
  4. Section heading — `<h3 class="text-xs uppercase tracking-widest text-muted mb-4">ผลงานสไตล์เดียวกัน</h3>` — only rendered if ≥ 1 related card
  5. `WorkCardCompact` list — up to 3 cards (see §S13b). `<ul role="list" class="space-y-4">` with `<li>` per card
- **No "ดูทั้งหมด" link in the sidebar.** The `WorkCardCompact` cards are the discovery affordance. The CTA card at the bottom of the page (S19) is the contract-level "ดูผลงานสไตล์เดียวกัน" link.
- **Mobile behaviour:** the sidebar `<aside>` uses `hidden md:block`. Palette and floor plan are rendered in a SECOND slot in the single-column flow using `block md:hidden`. See §S13d for the dual-slot pattern.
- **Sidebar data flow:** the page RSC calls `listSimilarWorks(workId, roomType, style, 3)` and passes the result array as a prop into `WorkConceptSection` as `relatedWorks: WorkCompact[]`.

### S13b: WorkCardCompact (new component)

**Component:** `WorkCardCompact`
**File:** `src/components/public/work/WorkCardCompact.tsx`
**RSC:** yes
**Approx LOC:** ~50

**Justification:** `WorkCard` is a layout-level component (fills a grid column, 3:2 cover, tag chips, excerpt). `WorkCardCompact` is a horizontal thumb + text pair for narrow sidebar use. The visual contracts differ enough that merging them would require branches that reduce clarity.

**Props:**
```
{
  slug: string
  title: string
  coverPath: string      // lowest-variant webp path, e.g. /uploads/works/<uuid>/400.webp
  roomType: RoomType
  style: string | null
  yearCompleted: number | null
}
```

Component builds the alt string internally:
```
coverAlt = `${title} — ${resolveRoomTypeLabel(roomType)}${style ? ', สไตล์ ' + style : ''}`
```
Use `resolveRoomTypeLabel` from `src/lib/utils/workLabels.ts` (already exists).

**Anatomy (desktop only — this component is never rendered on mobile):**
```
<li>
  <Link href={`/works/${slug}`} className="flex items-start gap-3 group
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm">
    <Image
      src={coverPath} alt={coverAlt}
      width={64} height={64}
      className="w-16 h-16 object-cover rounded-sm flex-none"
    />
    <div>
      <p className="text-sm font-medium text-ink line-clamp-2
        group-hover:text-accent transition-colors">
        {title}
      </p>
      <p className="text-xs text-muted mt-0.5">
        {style ? style : null}{style && yearCompleted ? ' · ' : null}{yearCompleted ?? null}
      </p>
    </div>
  </Link>
</li>
```

**States:**
- default — `text-ink` title, `text-muted` meta
- hover (desktop) — `group-hover:text-accent` on title only. No translate/lift class is applied — the compact size makes a lift effect feel out of place. Color shift is the sole hover signal.
- focus-visible — `ring-2 ring-accent ring-offset-2` on the `<Link>` wrapper
- Image loading — `next/image` handles lazy. No Skeleton (compact size, fast load)
- `style` null — meta line renders `yearCompleted` only; if both null, meta `<p>` is omitted

**Image sizes:** `sizes="80px"`

**Tokens:** `text-ink`, `text-muted`, `text-accent` (hover only). `rounded-sm` for image.

**No tag chips, no excerpt, no budget.** Information hierarchy: image → title → style + year. Nothing else.

---

### S13c: Concept section — column-flow fallback for short prose

**The problem:** chapter 03 left column is empty (prose rendered in chapter 01). When `bodyMdx` is very short, the empty left column creates an awkward visual gap on desktop.

**The rule:** the page RSC computes `estimateWordCount(work.bodyMdx)` before rendering.

- **If `wordCount < 250`:** `WorkConceptSection` renders as **single-column flow** — palette → floor plan → (divider if related) → related cards. The sidebar `<aside>` collapses into the column; the two-column grid is not used. Mobile layout is unchanged (always single column).
- **If `wordCount >= 250`:** desktop two-column grid as spec'd above. The empty left cell fills the gutter naturally.

**Threshold note:** 250 is a soft heuristic. Document it in `WordConceptSection.tsx` as a JSDoc comment. Admin can influence this by writing more or less concept text in chapter 01 (the same `bodyMdx` field). No UI control or config field for the threshold — it is a layout heuristic, not a product feature.

**New utility:** `estimateWordCount(mdx: string): number` in `src/lib/utils/wordCount.ts`, isomorphic, ~20 lines. Strip MDX syntax tokens (JSX tags, frontmatter, code fences) then count whitespace-separated runs as Latin words; add `Math.ceil(thaiChars / 5)` as a rough Thai word proxy (Thai word boundary detection is complex; approximate is acceptable for a layout heuristic).

---

### S13d: Mobile palette/floor-plan — CSS-only dual-slot pattern

**Problem:** palette and floor plan belong visually inside the sidebar on desktop, but below the prose on mobile. React renders once into the DOM — we cannot physically move elements.

**Solution:** render palette + floor plan in TWO `<div>` slots within `WorkConceptSection`:
- Slot A (desktop): inside `<aside class="hidden md:block">` — visible only on md+
- Slot B (mobile): a `<div class="block md:hidden">` placed after the MDX prose in the single-column flow — visible only below md

Both slots render in the DOM. CSS `display: none` removes the hidden slot from the accessibility tree on modern screen readers (NVDA, VoiceOver) — verified behaviour for `display:none`. The implementer must confirm this during NVDA/VoiceOver testing. `aria-hidden` is not required because `display: none` already achieves the same effect, but may be added defensively.

**Rejected alternative:** rendering palette + floor plan once outside the grid and using CSS `order` / `grid-template-areas` to move them. This works but the responsive JSX is harder to read. The dual-slot approach is more explicit.

---

### S14: Chapter 04 divider — "กระบวนการ"

### S15: Process timeline
- **Component:** `WorkProcessTimeline` — new
- **RSC:** yes
- **Location:** `src/components/public/work/WorkProcessTimeline.tsx`
- **Desktop:** horizontal scroll container `overflow-x-auto`, flex row, each step `w-48 flex-none`
- **Mobile:** vertical stack, step number + connector line on left (see mockup §4)
- **Step anatomy:** number badge (circle, `bg-bg2 text-accent font-bold`, 32×32px) + image (aspect `[4/3]`, `rounded-md`) + caption text from `images.caption`
- **Caption absent:** if admin did not enter a caption for a process image, the step renders image + step number only. No placeholder text. Silent absence is correct.
- **Max steps:** no hard cap in the component. Timeline remains legible at up to 8 steps. Admin should be warned in the UI if process images exceed 10 (UX note, not a DB constraint).
- **Motion:** `<Stagger>` wrapping steps if ≤ 6 steps. `<FadeUp>` on whole timeline if > 6 steps. Per `motion.md` stagger cap.
- **Null fallback:** if no `kind='process'` images, chapter 04 and its divider are both skipped entirely
- **Ordering:** images sorted by `sort` column (existing field). Admin sets order via drag in gallery editor

### S16: Chapter 05 divider — "รายละเอียด"

### S17: Detail masonry
- **Component:** `WorkMasonryGrid` (existing) — no changes
- **Wrapping:** `WorkGallerySection` with `displayMode="detail-editorial"` still routes here per current implementation
- **Full-bleed:** `-mx-4 md:-mx-6` unchanged from v1
- **Null fallback:** chapter 05 and divider skipped if no `kind='detail'` images

### S18: Designer's note
- **Component:** `WorkDesignerNote` — new
- **RSC:** yes
- **Props:** `{ note: string | null }`
- **Null fallback:** returns `null` if `designerNote` is null
- **Markup:** `<aside aria-label="หมายเหตุจากนักออกแบบ">` — `<aside>` is correct because this is supplementary to the main article content
- **Attribution:** fixed string `— ทีม house-peach` (not from users table). Works have no per-person author; the organisation is always the creator per `content.md`.
- **Typography:** `font-sans italic text-base leading-[1.75]`. Not serif — the note should feel intimate but not display-scale
- **Motion:** `<FadeUp>`
- **Tokens:** `bg-bg2` card, `text-ink` body, `text-muted` attribution

### S19: CTA card
- **Component:** `WorkCTACard` — new
- **RSC:** yes (no interactivity beyond links)
- **Copy (TH · EN):**
  - Heading: "ชอบผลงานนี้?" / "Like this work?"
  - Subheading: "ปรึกษาทีมเราได้ฟรี ไม่มีข้อผูกมัด" / "Free consultation, no obligation"
  - Button 1: "นัดปรึกษาฟรี" → `/contact`
  - Button 2: "ดูผลงานสไตล์เดียวกัน →" → `<Link href={`/works?style=${encodeURIComponent(work.style)}`}>`
- **"ดูผลงานสไตล์เดียวกัน" behaviour:** the link targets `/works?style={work.style}`. If the listing page does not yet read the `style` query param, it shows all works — this is an acceptable graceful fallback. The link is ALWAYS rendered; no conditional rendering on whether the filter is implemented. If `work.style` is null, the link falls back to `/works`.
- **Motion:** `<FadeUp>`
- **Tokens:** `bg-card border border-line rounded-xl`, button 1 `bg-accent text-bg`, button 2 `text-accent underline`
- **a11y:** both elements are `<a>` links (navigation), not `<button>`

### S20: Related works (bottom grid — page end)
- **Component:** `WorkRelatedSection` — new (RSC, receives data from page RSC via props)
- **RSC:** yes
- **Purpose:** broad post-reading discovery — "งานล่าสุดจาก house-peach". This is distinct from the sidebar's style-matched block. Sidebar = confidence during reading; bottom grid = discovery after reading.
- **Query:** `listLatestOtherWorks(workId, excludeIds, limit=3)`. See §14b.
- **Null fallback:** if 0 results (portfolio has only this one published work), section returns `null`.
- **Card count:** 1–3. If fewer than 3 results after exclusion, render what exists. Do not re-show sidebar items (the fallback in §14b re-includes them only when truly necessary — see §14b). Showing < 3 cards is acceptable; the grid is not forced to 3.
- **Render:** existing `WorkCard` component — NOT `WorkCardCompact`
- **Grid:** mobile 2-col, desktop 3-col — same as listing page
- **Motion:** `<Stagger>` on cards, 3 cards max, total 0.21s

### S21: Tags row
- **Component:** inline `<ul>` in page RSC (existing pattern)
- **Visibility:** always at page bottom (mobile and desktop — remove v1's `md:hidden` since sidebar no longer holds tags)
- **Null fallback:** if no tags, renders nothing

---

## 7. Typography system

### Type tokens for v2

| Element | Tailwind classes | Notes |
|---|---|---|
| Eyebrow | `text-[11px] uppercase tracking-widest font-sans text-muted` | 11px not in Tailwind default scale — use `text-[11px]` |
| H1 | `font-serif text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]` | bumped from v1's `text-4xl md:text-5xl` |
| H2 (chapter header) | `font-sans text-xs tracking-widest uppercase text-muted` | flanked by `<hr>` lines — semantic `<h2>` with visual decoration |
| Body prose | `font-sans text-lg leading-[1.75]` | bumped from v1's `text-base` — magazine body size |
| Drop cap (first-letter) | CSS `::first-letter` pseudo | see below |
| Pull quote | `font-serif not-italic text-2xl md:text-3xl leading-[1.4] text-ink` | DM Serif Display — apply `font-style: italic` via CSS directly (DM Serif Display has a true italic cut) |
| Caption | `font-sans italic text-xs md:text-sm text-muted text-center` | |
| Stat number | `font-sans text-3xl md:text-5xl font-bold text-ink tracking-tight` | text-ink for contrast safety across all 4 presets |
| Stat label | `font-sans text-[10px] uppercase tracking-widest text-muted` | |
| Designer note | `font-sans text-base leading-[1.75] text-ink` | + CSS `font-style: italic` on wrapper |
| Chapter number | `font-sans text-xs text-muted` | rendered as plain span, not serif |

### Drop cap implementation

Use CSS `::first-letter` via a scoped class `.chapter-body`. Add to `src/styles/themes.css`:

```css
.chapter-body > p:first-child::first-letter {
  font-family: var(--font-serif);
  font-size: 3.5em;       /* ~3 lines tall relative to body font */
  line-height: 0.8;       /* pull it up flush with text cap-height */
  float: left;
  margin-right: 0.08em;
  margin-top: 0.05em;
  color: var(--brand-accent);
  font-weight: 700;
}
```

**Thai drop cap rule (CRITICAL — see also §21):**
`::first-letter` is unreliable on Thai characters that begin with above-base vowel marks (`เ`, `แ`, `โ`, `ใ`, `ไ`). The pseudo-element selects only the first Unicode code point, but Thai rendering engines associate the vowel mark visually with the following consonant. On webkit, `เ` alone may be floated, visually detaching it from its consonant — broken rendering.

Solution: check the first character of the first paragraph in RSC before rendering. If `firstChar.codePointAt(0)` is in the range U+0E40–U+0E44 (above-base Thai vowels), add class `no-drop-cap` to `<div.chapter-body>` — which disables the `::first-letter` rule via `.no-drop-cap > p:first-child::first-letter { all: unset }`. This is a pure RSC string check, no client JS needed.

### Chapter divider markup pattern

```
<h2 aria-label="{number} — {th-label} · {en-label}">
  <span aria-hidden="true" class="chapter-divider">
    <span class="chapter-divider__line" />
    <span class="chapter-divider__number">{number}</span>
    <span class="chapter-divider__separator">/</span>
    <span class="chapter-divider__th">{thLabel}</span>
    <span class="chapter-divider__en">— {enLabel}</span>
    <span class="chapter-divider__line" />
  </span>
</h2>
```

CSS: `.chapter-divider` = `flex items-center gap-3`. `.chapter-divider__line` = `flex-1 h-px bg-line`. The `<h2>` carries the accessible label via `aria-label` because the visual rendering has decorative lines.

Add to `themes.css`:
```css
.chapter-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.chapter-divider__line {
  flex: 1;
  height: 1px;
  background: var(--line);
}
```

Component: `WorkChapterDivider` with props `{ number: string; th: string; en: string }`. RSC. ~25 lines.

### DM Serif Display Thai numerals

DM Serif Display includes lining numerals (ASCII `0-9`) and basic Latin. It does not include Thai numeral codepoints (U+0E50–U+0E59). The chapter numbers (`01`, `02`, etc.) are ASCII — safe. The stat band numbers (`72`, `45`) are also ASCII. No Thai numeral rendering issue.

---

## 8. Stat band rendering rule

**4-cell grid:** `areaSqm`, `durationDays`, `budgetRange`, `yearCompleted`

Each cell is independent — if null, the cell `<div>` is not rendered. The grid uses `grid-cols-[repeat(auto-fit,minmax(80px,1fr))]`:
- 4 non-null → 4-col
- 3 non-null → 3-col
- 2 non-null → 2-col
- 1 non-null → 1-col (centered, `max-w-xs mx-auto`)
- 0 non-null → `<section>` returns `null`

**No placeholder dashes.** Empty cell = hidden.

**durationDays formatting:**

```
formatDuration(days: number): string
  if days < 30: return `${days} วัน`
  if days < 90: return `${Math.round(days / 7)} สัปดาห์`
  else: return `${Math.round(days / 30)} เดือน`
```

Admin enters integer days (e.g., 45). The function auto-converts to weeks/months for readability. The raw integer is stored — the display rule can change without migration. File: `src/lib/utils/formatDuration.ts`, isomorphic, ~15 lines.

---

## 9. Material palette component

**Component:** `WorkMaterialPalette` (inline in `WorkConceptSection`, not a standalone file — under 40 lines combined)

**Props:** `{ materials: Array<{ name: string; colorHex: string }> | null }`

**Null / empty fallback:** if `materials` is null or an empty array, the component returns `null`.

**Rendering:**
- `<ul role="list" aria-label="วัสดุที่ใช้">` with `<li>` per chip
- Each chip: `<div class="inline-flex items-center gap-2 rounded-full bg-bg2 px-3 py-1.5 text-sm">` containing a color swatch and name
- Color swatch: `<span class="size-4 rounded-sm flex-none border border-line" style={{ backgroundColor: item.colorHex }} aria-hidden />`
- If `colorHex` missing/invalid for one item (defensive): render chip without swatch (just text)

**Overflow:** max 8 items enforced at zod layer. On mobile, chips wrap (`flex flex-wrap gap-2`). On desktop right column, vertical list (`flex flex-col gap-2`).

---

## 10. Pull quote — anatomy + fallback

| State | Behavior |
|---|---|
| `clientQuote` null | Entire pull quote section skipped — `WorkPullQuote` returns `null` |
| `clientQuote` filled, `clientName` null | `<blockquote>` renders, `<figcaption>` omitted |
| Both filled | Full anatomy: `<figure>` > `<blockquote>` + `<figcaption><cite>— {clientName}</cite></figcaption>` |

**Semantic:** `<blockquote>` for the quote, `<cite>` for the attribution per HTML spec.

**Quote marks:** do not add `"` or `"` in the component — admin enters raw text. CSS `::before`/`::after` may add decorative opening mark if desired (visual only). The `aria-label` on `<figure>` should be `"คำพูดจากลูกค้า"`.

---

## 11. Designer's note — anatomy

**Plain text, not MDX.** `designerNote` is `mediumtext` in DB. The component renders it as a single `<p>` inside `<aside>`. No markdown parsing. Line breaks via `whitespace-pre-line` CSS.

**Attribution:** constant `— ทีม house-peach`. Not from `users` table. Works have no per-person author per `content.md`.

**Markup:**
```
<aside aria-label="หมายเหตุจากนักออกแบบ" class="...">
  <p class="font-sans text-base leading-[1.75] text-ink" style="font-style:italic">
    {designerNote}
  </p>
  <p class="text-xs text-muted text-right mt-3">— ทีม house-peach</p>
</aside>
```

**`<aside>` justification:** HTML5 spec defines `<aside>` as content tangentially related to the surrounding content. A designer's commentary on their own work is supplementary to the primary article. `<aside>` is semantically correct. The "author voice" argument for `<section>` was considered and rejected — supplementary semantic prevails.

---

## 12. Process timeline — responsive pattern

**Mobile (< md):** vertical list. Each step is a row: `[number-badge] [flex-col: image + caption]`. The number badge and connector line are in a left column `w-8 flex-none`. A vertical `border-l-2 border-line ml-3` connects steps. The last step omits the connector.

**Desktop (≥ md):** horizontal flex row inside `overflow-x-auto` container. Each step is `w-48 flex-none`. A horizontal `border-t-2 border-line` sits above the images. The step number badge sits above the connector line, centered.

**Max steps before horizontal scroll on desktop:** at `w-48` per step with `gap-8`, 5 steps ≈ 1040px. At 8 steps ≈ 1600px — scrolls. Horizontal scroll is intentional (editorial film-strip pacing). No scroll-jacking; native browser scroll.

**Step count ≤ 6:** `<Stagger>` wrapper with `staggerChildren: 0.07s` — total for 6 = 0.42s (under 0.5s budget).

**Step count > 6:** `<FadeUp>` on the whole `<ol>` container.

**No per-step lightbox.** Process images are documentary. `cursor-pointer` is not applied. Per brand-feel: calm, observational.

---

## 13. CTA card — copy + buttons

| Element | TH | EN |
|---|---|---|
| Heading | ชอบผลงานนี้? | Like this work? |
| Subheading | ปรึกษาทีมเราได้ฟรี ไม่มีข้อผูกมัด | Free consultation, no strings attached |
| Button 1 | นัดปรึกษาฟรี | Book a free call |
| Button 2 | ดูผลงานสไตล์เดียวกัน → | See similar works → |

**Button 1:** `<Link href="/contact">` — full-width on mobile, `min-w-[180px]` on desktop. `bg-accent text-bg` via shadcn `<Button variant="default">`.

**Button 2:** `<Link href={`/works?style=${encodeURIComponent(work.style ?? '')}`}>` — text-link, no background. If `work.style` is null, href is `/works`. Always rendered — no conditional on filter implementation status.

**Position:** both in one row on desktop (`flex gap-4 justify-center`), stacked on mobile.

---

## 14. Related works — two algorithms

There are two distinct related works surfaces on the page with different intents and queries. They are NOT interchangeable.

---

### 14a. Sidebar related cards — `listSimilarWorks` (chapter 03)

**Function signature:** `listSimilarWorks(workId: number, roomType: RoomType, style: string | null, limit: number): Promise<WorkCompact[]>` in `src/lib/services/work.ts`.

**Intent:** "งานที่เหมือนกันมาก" — high-confidence style + room type match. Surfaced during reading to build confidence before the CTA.

**Algorithm (in order of priority):**

1. **Primary:** `status='published' AND id != {workId} AND room_type = {roomType} AND style = {style} ORDER BY published_at DESC LIMIT {limit}`
2. **Fallback 1** (if primary < 3): relax to `room_type = {roomType} OR style = {style}` — union instead of intersection
3. **Fallback 2** (if fallback 1 still < 3): tags overlap ≥ 1 — `JOIN work_tags` where `tag_id IN (SELECT tag_id FROM work_tags WHERE work_id = {workId})` — aggregate and order by shared tag count DESC
4. **Fallback 3** (if all fallbacks still < 3): render whatever exists. 1 or 2 cards is acceptable.
5. **Zero results:** sidebar related block (heading + list) collapses. Palette + floor plan still render in the right column.

**Return shape `WorkCompact`:**
```
{
  id: number
  slug: string
  title: string
  coverPath: string      // smallest webp variant path
  roomType: RoomType
  style: string | null
  yearCompleted: number | null
}
```

Component (`WorkCardCompact`) builds `coverAlt` internally from `title + roomType + style`. No separate `coverAlt` field needed in `WorkCompact`.

**Service function constraints:** ≤ 50 lines (the function with the most complex aggregate — fallback-2 tag query — justifies the bump from 30). Sequential queries per fallback chain: query 1 → if `results.length < limit`, query 2, etc. Drizzle ORM, no raw SQL.

**Cache:** `revalidatePath` on work mutations already wired. The `bumpWorkPaths()` helper in `lib/cache-tags.ts` (current implementation) handles cache-bust for work detail pages. No additional `unstable_cache` wrapping needed for v2.2.

**Data fetch:** page RSC calls `listSimilarWorks(...)` in a `Promise.all` with other queries. No Suspense boundary — see §14c.

---

### 14b. Bottom grid — `listLatestOtherWorks` (page end)

**Function signature:** `listLatestOtherWorks(workId: number, excludeIds: number[], limit: number): Promise<Work[]>` in `src/lib/services/work.ts`.

**Intent:** "งานล่าสุดจาก house-peach" — broad discovery, latest published, shown after the user finishes reading.

**Algorithm:**

1. **Primary:** `status='published' AND id NOT IN ({workId, ...excludeIds}) ORDER BY published_at DESC LIMIT {limit}`
2. **Fallback** (if primary < 3 after exclusion): `status='published' AND id != {workId} ORDER BY published_at DESC LIMIT {limit}` — allow sidebar items to appear again rather than show < 3 cards. This is intentional: better to show the same work twice across a page than show an empty spot.
3. **Zero results:** `WorkRelatedSection` returns `null`.

**Show < 3 (small portfolio):** render 1 or 2 cards if that is all that exists. Do not force 3.

**Caller:** page RSC calls `listSimilarWorks` first, collects ids, then passes `excludeIds` to `listLatestOtherWorks` as a serial await (see §14c). `WorkRelatedSection` receives the pre-fetched array as props.

**Service function constraints:** ≤ 30 lines.

---

### 14c. Fetch pattern — parallel page-level Promise.all (no Suspense)

The page RSC uses parallel fetch with one serial step:

```
const [work, images, tagNames, sidebarRelated] = await Promise.all([
  getPublishedWorkBySlug(slug),
  listWorkImages(work.id),         // note: need work.id → move inside Promise.all or use slug
  listTagNamesForWork(work.id),
  listSimilarWorks(work.id, work.roomType, work.style, 3),
]);
const sidebarIds = sidebarRelated.map(w => w.id);
const bottomGrid = await listLatestOtherWorks(work.id, sidebarIds, 3);
```

**Note on `images` and `tagNames`:** these depend on `work.id` from the first query. In practice, use `slug` to fetch work first, then fire the remaining three in parallel:

```
const work = await getPublishedWorkBySlug(slug);
if (!work) notFound();
const [images, tagNames, sidebarRelated] = await Promise.all([
  listWorkImages(work.id),
  listTagNamesForWork(work.id),
  listSimilarWorks(work.id, work.roomType, work.style, 3),
]);
const sidebarIds = sidebarRelated.map(w => w.id);
const bottomGrid = await listLatestOtherWorks(work.id, sidebarIds, 3);
```

**`bottomGrid` serial await:** this is acceptable because (a) the user is blocked on the page anyway — the RSC is server-streamed as a unit, (b) the alternative — fetching both `sidebarRelated` and `bottomGrid` in parallel then JS-filtering by `sidebarIds` — adds code complexity without saving round-trip time (same datacenter, sub-ms latency). If full parallelism is preferred as a variant: fetch both in `Promise.all`, then filter `bottomGrid = allBottomCandidates.filter(w => !sidebarIds.includes(w.id)).slice(0, 3)` — this is an acceptable implementation choice for fe-public.

**No Suspense boundary.** No `<WorkConceptSectionSkeleton />`. The page renders as one RSC unit. The `loading.tsx` route segment fallback handles the initial skeleton at the route level.

---

## 15. Component decomposition

### Components to CREATE (new files)

| Component | File | RSC/Client | Approx LOC | Justification |
|---|---|---|---|---|
| `WorkChapterDivider` | `components/public/work/WorkChapterDivider.tsx` | RSC | ~25 | Pure presentational, used 5× — rule-of-three satisfied |
| `WorkStatBand` | `components/public/work/WorkStatBand.tsx` | RSC | ~60 | Domain-specific layout, no shadcn equivalent |
| `WorkChorusBeforeAfter` | `components/public/work/WorkChorusBeforeAfter.tsx` | RSC (inner Client) | ~50 | Wraps BeforeAfterCard with chorus-specific layout logic |
| `WorkPullQuote` | `components/public/work/WorkPullQuote.tsx` | RSC | ~30 | Semantic `<blockquote>` + fallback logic |
| `WorkConceptSection` | `components/public/work/WorkConceptSection.tsx` | RSC | ~120 | 2-col layout + material palette + floor plan + sidebar related cards + dual-slot mobile pattern + word-count branch |
| `WorkCardCompact` | `components/public/work/WorkCardCompact.tsx` | RSC | ~50 | Horizontal thumb + title + meta. Sidebar-only compact variant. Visual contract differs significantly from `WorkCard` (see §S13b) |
| `WorkProcessTimeline` | `components/public/work/WorkProcessTimeline.tsx` | RSC | ~90 | Horizontal/vertical responsive timeline |
| `WorkDesignerNote` | `components/public/work/WorkDesignerNote.tsx` | RSC | ~30 | `<aside>` + plain text display |
| `WorkCTACard` | `components/public/work/WorkCTACard.tsx` | RSC | ~40 | CTA links, no interactivity |
| `WorkRelatedSection` | `components/public/work/WorkRelatedSection.tsx` | RSC | ~55 | Receives pre-fetched data via props + renders WorkCard grid |

New utility files:

| File | LOC | Purpose |
|---|---|---|
| `src/lib/utils/formatDuration.ts` | ~15 | durationDays → Thai display string |
| `src/lib/utils/wordCount.ts` | ~20 | `estimateWordCount(mdx)` — layout heuristic for §S13c |
| `src/lib/services/work.ts` (extend) | +70 | `listSimilarWorks` (~50 lines) + `listLatestOtherWorks` (~30 lines) — replaces single `listRelatedWorks` from v2.0 |

### Components to EXTEND (modify existing files)

| Component | Change | Reason |
|---|---|---|
| `WorkHero` | Add `aspectClass?: string` prop — default keeps v1 values; page passes v2 values | Avoid duplication — same image logic, different CSS |
| `WorkGallerySection` | Label strings are passed as props from page RSC; no code change | Backward compatible |

### Components that are REPLACED in the page (but not deleted)

`WorkMetaSidebar` — no longer used on this page (no sticky sidebar in v2). The file remains. If unused after v2 ships, `simplify-reuse` skill should flag it.

### Components unchanged

`BeforeAfterCard`, `BeforeAfterSlider`, `BeforeAfterToggle`, `BeforeAfterEmbed`, `WorkMasonryGrid`, `WorkProseSection` — do not touch these.

---

## 16. Admin UI implications

All new fields appear in `src/components/admin/works/WorkForm.tsx`.

### Form field placement

Add a new accordion section "เนื้อหาเพิ่มเติม · Editorial" below the existing "รายละเอียดโปรเจกต์" section:

```
[ Section: เนื้อหาเพิ่มเติม · Editorial ]

  ระยะเวลา (วัน)    [number input, placeholder: "เช่น 45"]
  ── จะแสดงเป็น "45 วัน" หรือ "3 เดือน" อัตโนมัติ

  คำพูดจากลูกค้า    [textarea, max 500, placeholder: "ใส่คำพูดโดยไม่ต้องมีเครื่องหมายคำพูด"]
  ชื่อลูกค้า         [text input, max 80, placeholder: "เช่น คุณสมศรี หรือ เจ้าของบ้าน"]
  ── ทั้งสองช่องนี้จะแสดงเป็น Pull Quote กลางหน้า

  หมายเหตุจากนักออกแบบ  [textarea, max 1000]
  ── จะแสดงก่อน CTA พร้อมลายเซ็น "ทีม house-peach"

  วัสดุที่ใช้ (สูงสุด 8)
  [ + เพิ่มวัสดุ ]
  ┌─────────────────────────────────────────┐
  │ ชื่อวัสดุ [text]   สี [color picker]  [×] │
  │ ชื่อวัสดุ [text]   สี [color picker]  [×] │
  └─────────────────────────────────────────┘
```

### Materials UI pattern

Use a dynamic list: `useFieldArray` from React Hook Form. Each item has `name` (text input) and `colorHex` (HTML `<input type="color">`). Shadcn `<FormField>` wraps each item. Max 8 items enforced by disabling the "+ เพิ่มวัสดุ" button when `fields.length >= 8`.

No new shadcn component needed — `useFieldArray` + `<input type="color">` + `<Input>` + existing shadcn `<Button>` for add/remove.

### Plan image kind

The `kind` selector in `WorkGalleryEditor.tsx` adds `'plan'` as a new option in the select/radio group. Single change to the kind options array.

---

## 17. Migration strategy

### Nullable columns — safe

All 5 new `works` columns are nullable. MariaDB `ALTER TABLE ... ADD COLUMN ... DEFAULT NULL` is non-blocking for InnoDB tables on MariaDB 11. No backfill needed. Existing rows get `NULL` for all new columns.

### `works.materials` — JSON column type

Use Drizzle `json('materials')` mapping to `JSON` in MariaDB 11. MariaDB JSON columns store as UTF-8 text internally with validation. The zod schema validates shape at the application layer. No index needed — never queried with WHERE.

### `work_images.kind` enum — MODIFY COLUMN

```sql
ALTER TABLE work_images
  MODIFY COLUMN kind ENUM('before','after','process','detail','plan')
  NOT NULL DEFAULT 'after';
```

On MariaDB 10.3+, adding an ENUM value is in-place, metadata-only — no table rebuild. MariaDB 11 supports this. Test on staging first. The `db-migration-reviewer` should verify that `drizzle-kit generate` produces the correct `MODIFY COLUMN` diff and does not drop/recreate the table. The `DEFAULT 'after'` is unchanged — existing rows unaffected.

---

## 18. Theme contrast verification

### Background token

The page uses `bg-bg` token throughout. The peach preset's `--bg: #faf7f2` is the warm paper-white token. Do not override the global token and do not add a 5th preset. The 3-point hex difference between `#faf7f2` and a proposed `#FAFAF7` is invisible to the eye and not worth breaking the theme system.

If the product team wants exactly `#FAFAF7`, the correct path is to adjust the peach preset's `--bg` value in `themes.css` — one line change, all 4 presets remain consistent.

### Stat band numbers

Stat numbers use `text-ink` (not `text-accent`). `text-ink` on `bg-bg2` is ≥ 7:1 on all 4 presets — passes WCAG AA for all text sizes. This decision is locked. Accent color is limited to: drop cap, chapter number labels (small text), CTA button background, `WorkCardCompact` hover title — and no other spots.

### Drop cap accent color

`var(--brand-accent)` on `var(--bg)` for the drop cap first-letter. Drop cap renders at approximately 3× body size (~54px) — WCAG large text threshold is 18px. The peach preset accent on `--bg` is approximately 2.8:1. At 54px this is large text category, and 2.8:1 is borderline. The a11y reviewer should check this specifically in staging. If it fails: change `.chapter-body > p:first-child::first-letter { color: var(--ink) }` — one CSS line.

---

## 19. Motion plan

| Element | Wrapper | Duration | Notes |
|---|---|---|---|
| Eyebrow + H1 + Summary (one block) | `<FadeUp>` | 0.35s | On viewport enter, `once: true` |
| Hero image | None | — | LCP element, never animate |
| Stat band | `<FadeUp>` | 0.35s | Whole band as unit |
| Chapter divider (each) | `<FadeUp>` | 0.35s | Independent — each divider fades as it enters |
| Brief prose (WorkChapterBody) | `<FadeUp>` | 0.35s | |
| Hero BeforeAfterCard | None | — | Internal drag motion already exists |
| Additional B/A pairs | `<FadeUp>` on each | 0.35s | No stagger — 2 items max, not a list |
| Pull quote | `<FadeUp>` | 0.35s | |
| Concept 2-col section | `<FadeUp>` | 0.35s | Whole section |
| Material chips | None | — | Inside concept section's FadeUp |
| Process timeline (≤6 steps) | `<Stagger>` | 0.07s per step | Total ≤ 0.42s |
| Process timeline (>6 steps) | `<FadeUp>` | 0.35s | Whole `<ol>` |
| Detail masonry | `<FadeUp>` | 0.35s | Unchanged from v1 |
| Designer note | `<FadeUp>` | 0.35s | |
| CTA card | `<FadeUp>` | 0.35s | |
| Related works cards (bottom grid) | `<Stagger>` | 0.07s per card | 3 cards max, total 0.21s |
| Sidebar `WorkCardCompact` list | None — static | — | Cards appear with FadeUp of whole concept section |

### Stat band counter-up animation

**Decision: NOT ALLOWED.** Animating numeric values from 0 to their final value is decorative motion with no state-communication purpose (`motion.md` § "Decorative motion"). It also requires `'use client'` on `WorkStatBand`. The numbers render server-side, are statically visible, and are SEO-indexed correctly. Counter animation would exceed the 0.5s budget. Use `<FadeUp>` on the band instead.

---

## 20. SEO impact

- **H1 invariant:** maintained — `work.title` is the only `<h1>`. Chapter headers are semantic `<h2>` elements
- **Chapter headings:** render as `<h2>` — contribute to document outline. No heading level skipping. H2 chapter headers → H3 inside MDX body (if any) → correct hierarchy
- **Pull quote:** `<blockquote>` + `<cite>` — correct HTML. Search engines read `<blockquote>` as quotation content, which may surface in featured snippets
- **Designer note:** `<aside aria-label="หมายเหตุจากนักออกแบบ">` — search engines treat `<aside>` as supplementary content
- **Material chips:** `<ul role="list">` with `<li>` per chip — machine-readable list; color names may appear in search index
- **JSON-LD, metadata, canonical, breadcrumb JSON-LD:** unchanged — do not touch

---

## 21. Red-line list — DO NOT DO

1. **No drop cap on Thai paragraphs beginning with above-base vowels** (`เ`, `แ`, `โ`, `ใ`, `ไ`) — use the `no-drop-cap` class escape hatch described in §7
2. **No stat counter animation** — banned per motion budget analysis in §19
3. **No parallax on hero image** — banned per `motion.md` (scroll-linked transform on LCP element)
4. **No auto-rotating before/after slider** — banned per `motion.md` (auto-playing loops)
5. **No rounded corners on the hero chorus BeforeAfterCard** — first pair is full-bleed without `rounded-2xl`
6. **No `<img>` raw tags** — all images use `next/image`. Process timeline needs `sizes` attribute: `"(max-width: 768px) calc(100vw - 2rem), 192px"`
7. **No removal of breadcrumb** — WCAG 2.1 AA navigation landmark and JSON-LD BreadcrumbList anchor
8. **No changing H1 to anything other than `work.title`** — single H1 invariant
9. **No hardcoded hex** — all colors via tokens
10. **No `shadow-lg` or `shadow-2xl`** per `uxui.md §5`
11. **No infinite scroll for related works** — 3 cards, static query
12. **No font-serif in body paragraphs** — DM Serif Display restricted to H1, drop cap, and pull quote
13. **No `outline-none` without `focus-visible:ring`** — every new interactive element must have focus ring
14. **No sticky sidebar** — `WorkMetaSidebar` is not used on this page
15. **No emoji in body or buttons** per `uxui.md §15`
16. **No "→ ดูทั้งหมด" link inside the sidebar** — the CTA card (S19) is the single discovery CTA link
17. **No rendering `bodyMdx` twice** — renders once in chapter 01 (S8). Chapter 03 shows palette + floor plan only

---

## 22. State coverage matrix

| Field / scenario | null / absent / zero | filled / present |
|---|---|---|
| `durationDays` | Stat band cell hidden | Renders formatted value ("45 วัน" / "6 สัปดาห์") in stat band |
| `clientQuote` | Entire pull quote section skipped | Pull quote renders in chapter 02 |
| `clientName` | Pull quote renders without `<figcaption>` | Renders with `— {clientName}` cite |
| `designerNote` | Designer's note section skipped | Renders in `<aside>` with fixed attribution |
| `materials` | Palette returns null; sidebar shows floor plan only (or single-col if floor plan also absent) | Chip strip renders in sidebar |
| Both `materials` AND `floorPlanImage` null, 0 sidebar related matches | Concept section renders as single-column prose area; sidebar `<aside>` not rendered | At least one sidebar item → right column present |
| All 5 new fields null | Stat band hides; no pull quote; no designer note; no chips. Floor plan from images if available | Clean minimal page — not broken |
| `work.style` null | CTA button links to `/works`. Sidebar query uses roomType-only for initial match | Links to `/works?style={style}` |
| No `kind='plan'` images | Floor plan thumb absent from sidebar | Renders above related cards in sidebar |
| No before/after pairs | Chapter 02 (divider + chorus + pull quote) all skip | Chapter 02 renders |
| No process images | Chapter 04 (divider + timeline) skips | Timeline renders |
| No detail images | Chapter 05 (divider + masonry) skips | Masonry renders |
| `listSimilarWorks` returns 0 (all fallbacks exhausted) | Sidebar related block (heading + list) collapses. Divider line also hidden. Palette + floor plan render normally | Related block renders with 1–3 cards |
| Mobile viewport, any related match count | Sidebar related cards hidden (`hidden md:block`). Palette + floor plan in Slot B (mobile-only div). Bottom grid handles discovery | N/A — sidebar is desktop-only |
| Sidebar shows 2 works, bottom grid `excludeIds` removes them, portfolio has 5 total | Bottom grid queries latest 3 excluding current + those 2 → may yield 1. Falls back to latest excluding current only → re-shows those 2 at bottom rather than show < 3 | Normal deduplication: bottom shows 3 not yet seen |
| `wordCount(bodyMdx) < 250` | `WorkConceptSection` renders single-column flow: palette → floor plan → divider → related cards. Two-column grid not used on any viewport | `wordCount >= 250`: desktop two-col grid as spec'd |

---

## 23. Implementation order (appendix)

Follow this sequence to avoid blocked work:

| Step | Owner | Task | Depends on |
|---|---|---|---|
| 1 | be-data | Add 5 nullable columns to `works` table (`durationDays`, `clientQuote`, `clientName`, `designerNote`, `materials`) | nothing |
| 2 | be-data | Add `'plan'` to `work_images.kind` enum | nothing |
| 3 | be-data | Extend zod schemas in `src/lib/validation/work.ts` | steps 1–2 |
| 4 | be-data | Add `listSimilarWorks` + `listLatestOtherWorks` to `src/lib/services/work.ts` | step 3 |
| 5 | be-data | Add `estimateWordCount` to `src/lib/utils/wordCount.ts` | nothing |
| 6 | be-data | Add `formatDuration` to `src/lib/utils/formatDuration.ts` | nothing |
| 7 | fe-admin | Add Editorial fields to `WorkForm.tsx` accordion | step 3 |
| 8 | fe-admin | Add `'plan'` option to `WorkGalleryEditor.tsx` kind selector | step 2 |
| 9 | fe-public | Create all new components (§15 CREATE list) | steps 4–6 |
| 10 | fe-public | Extend `WorkHero` with `aspectClass` prop | step 9 (can parallelize) |
| 11 | fe-public | Wire up new page RSC at `app/(public)/works/[slug]/page.tsx` | steps 9–10 |
| 12 | fe-public | Add CSS rules to `src/styles/themes.css` (drop cap, chapter divider) | nothing |
| 13 | db-migration-reviewer | Review generated migration for steps 1–2 | steps 1–2 complete |
| 14 | a11y-reviewer | Verify NVDA/VoiceOver dual-slot behaviour, focus order, drop cap contrast | step 11 in staging |

---

## 24. Deferred to phase 3

These items were considered and explicitly deferred. They are not "won't do" — they require a separate implementation window.

| Item | Rationale for deferral |
|---|---|
| Cache strategy via `unstable_cache` | Current `revalidatePath` on mutation (via `bumpWorkPaths()` in `lib/cache-tags.ts`) is adequate for ISR; granular tag caching adds complexity without traffic justification at current scale |
| Analytics event hooks (scroll depth, CTA click, time on chapter) | Separate concern; Vercel Analytics plug-in is the planned vehicle — defer until analytics platform is chosen |
| Process timeline scroll-discoverability (fade gradient at right edge) | UX polish indicating horizontal scrollability; not a launch blocker; implement after baseline ships |
| Materials JSON → separate `materials` table | Migration path is zero-data-loss; defer until "filter by material" feature is explicitly requested by product |
| Thai below-base vowel drop cap (`ุ ู ฺ`) — additional edge case | Test in staging; the §7 `no-drop-cap` escape hatch covers above-base vowels; below-base vowels may render correctly on webkit — verify, then add to red-line only if broken |
| `<aside>` vs `<section>` for designer note | Kept as `<aside>` (editorial spread convention); "author voice as `<section>`" argument noted but supplementary semantic prevails — no action needed |

---

## 25. Chapter numbering stability

Chapter numbers are stable and do not renumber when a chapter is skipped. If a work has no before/after pairs, chapter 02 does not render — and the visible sequence on the page is "01 / 03 / 04 / 05" (with a gap at 02). This is intentional: stable numbering is honest about content holes, and renumbering would hide information from the admin who is trying to understand why the page feels sparse. The chapter divider component always receives the same number string regardless of which other chapters rendered.

---

## 26. Reviewer rebuttals

These reviewer suggestions were considered. Each was either adopted or rejected with rationale.

| Suggestion | Decision |
|---|---|
| Sidebar `aria-label` change from `"ข้อมูลเพิ่มเติม"` to `"วัสดุ แปลน และผลงานที่เกี่ยวข้อง"` | **Adopted.** More specific is strictly better for screen reader users. §S13 updated. |
| State matrix: show < 3 cards vs re-show sidebar items at bottom | **Adopted: show < 3 (do not force re-show).** §22 updated. Bottom grid can have 1–3 cards; showing fewer than 3 is acceptable on a small portfolio. The §14b fallback only re-includes sidebar items when the portfolio is genuinely tiny. |
| §14a function LOC budget: bump from ≤ 30 to ≤ 50 | **Adopted.** The fallback-2 tag query adds justified complexity. §14a updated. `clean-code.md` permits ≤ 50 lines for service functions with complex aggregate logic. |
| Drop cap on `ุ ู ฺ` (below-base Thai vowels) | **Deferred to phase 3** (§24). The existing red-line covers above-base vowels. Below-base case needs staging verification before adding to red-line. |
| Removing Suspense boundary | **Adopted.** §14c fully specifies parallel fetch pattern instead. |
| CSS-only dual-slot for mobile palette/floor-plan | **Adopted.** §S13d specifies the pattern. |
