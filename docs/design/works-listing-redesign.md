# Design spec — Works listing page (`/works`)

**Version:** 1.0 — 2026-05-12
**Implementer:** fe-public
**Route:** `src/app/(public)/works/page.tsx` (does not exist yet)
**Depends on:** v2 editorial language locked in `docs/design/work-detail-redesign-v2.md`
**Data contract:** new `listPublishedWorks()` function (see §11 — be-data to implement)

---

## §1 Problem statement

A `grid-cols-3` of identical same-size cards treats every project as a commodity, indistinguishable from one another. Editorial portfolio indexes (Dezeen, AD, บ้านและสวน) break the grid: one anchor work runs large to establish the studio's voice, then supporting cards carry the reader forward. The goal is not to show more cards — it is to make the first three seconds feel like opening a magazine, not browsing a stock photo site. Typography, stat microdata, and deliberate grid rhythm do the work that a fancy filter UI would otherwise pretend to do.

---

## §2 Information architecture

| Element | Decision |
|---|---|
| Total count | Show as eyebrow beneath H1: "งาน 12 ชิ้น" — `text-xs text-muted uppercase tracking-widest` |
| Filter by | `roomType` + `style` — two filters only. Tags are too granular for V1 listing (long list, low value to homeowners). Revisit in V2 if analytics shows demand |
| Sort | `published_at DESC` always. No sort control exposed in V1. No `isFeatured` flag on `works` table — do not build featured-first sort now |
| Pagination | "Load more" button — 12 cards per page. Reasoning: portfolio stays small (≤50 works long-term), load-more avoids SEO duplicate-page issues of numbered pagination, keeps URL canonical clean |
| Breadcrumb | No — `/works` is top-level nav. Breadcrumb would read "หน้าแรก / ผลงาน" which adds no value |

**Filter URL encoding:** `?room=living&style=japandi`
- `room` = one of the 8 `RoomType` enum values (living, bedroom, kitchen, bathroom, office, outdoor, full_house, other)
- `style` = free varchar (max 60), URL-encoded
- Both are optional; absent = no filter on that axis
- Multi-select: single value per axis in V1 (one room type, one style). Simpler parsing, clear URL, good enough for ≤50 works
- Browser back button preserved: filter state lives entirely in URL search params (no client state that diverges from URL)

---

## §3 ASCII mockup — MOBILE 390px

```
┌─────────────────────────────────────────┐
│  AppHeader (logo + hamburger)           │  64px, from public layout
├─────────────────────────────────────────┤
│                                         │
│  ผลงาน · Works                          │  h1: font-serif text-5xl font-bold
│                                         │  tracking-tight leading-[1.05]
│                                         │  px-4 pt-10 text-ink
│                                         │
│  studio ตกแต่งบ้านแนว warm-tone        │  lead: text-base text-muted
│  minimalist — โชว์ผลงานจริงพร้อม        │  leading-[1.65] px-4 mt-3
│  ตัวเลขทุกโปรเจกต์                      │  max-w-prose
│                                         │
│  งาน 12 ชิ้น                            │  text-xs uppercase tracking-widest
│                                         │  text-muted px-4 mt-4
│                                         │
├─────────────────────────────────────────┤  mt-6
│  ┌─────────────────────────────────┐   │  FILTER STRIP
│  │ [ห้อง ▾]   [สไตล์ ▾]  [× ล้าง]│   │  sticky top-0 z-10
│  └─────────────────────────────────┘   │  bg-bg/90 backdrop-blur
│                                         │  px-4 py-3 border-b border-line
│                                         │  (× ล้าง appears only when any filter active)
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │  HERO CARD (WorkCard variant="hero")
│  │                                 │   │  full bleed: -mx-4
│  │   Cover image                   │   │  aspect-[3/2]
│  │   aspect 3:2                    │   │  No rounded corners (mirrors detail hero)
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ห้องนั่งเล่น · Japandi · 2024         │  eyebrow: text-[11px] uppercase
│                                         │  tracking-widest text-muted mt-4 px-4
│                                         │
│  ชื่อผลงานที่ยาวได้สองบรรทัด           │  title: font-serif text-3xl font-bold
│  สองบรรทัดก็ได้                         │  text-ink mt-2 px-4 leading-[1.2]
│                                         │
│  สรุปงาน 1–2 ประโยค บอก             │  summary: text-sm text-muted
│  บรรยากาศของโปรเจกต์นี้               │  mt-2 px-4 line-clamp-3
│                                         │
│  72 ตร.ม. · 2024 · 300k–700k          │  stat line: text-xs text-ink
│                                         │  font-medium px-4 mt-3
│                                         │  (null stats simply omitted)
│                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  divider: border-t border-line mx-4 mt-8
│                                         │
│  ┌─────────────┐  ┌─────────────┐     │  REGULAR GRID — 2-col mobile
│  │             │  │             │     │  gap-x-4 gap-y-8 px-4 mt-8
│  │  3:2 image  │  │  3:2 image  │     │  cards fill columns equally
│  │             │  │             │     │
│  └─────────────┘  └─────────────┘     │
│  ห้องนอน · 2024   ห้องครัว · 2023    │
│  ชื่องาน           ชื่องาน            │  title: text-base font-semibold text-ink
│                    line-clamp-2       │  mt-2 line-clamp-2
│  72 ตร.ม.·        52 ตร.ม.·          │  stat: text-xs text-muted mt-1
│  Japandi           Scandinavian       │
│                                        │
│  ┌─────────────┐  ┌─────────────┐     │  second row, same pattern
│  │             │  │             │     │
│  └─────────────┘  └─────────────┘     │
│  ...               ...                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     [ โหลดเพิ่มเติม ]          │   │  load-more: full-width button
│  └─────────────────────────────────┘   │  variant="outline" py-3 mx-4
│                                         │  (hidden when hasMore=false)
│                                         │
└─────────────────────────────────────────┘
```

---

## §4 ASCII mockup — DESKTOP ≥1024px

Grid approach chosen: **2-col hero anchor + 3-col regular grid with no mixed mosaic.**
Reason: mosaic grids require predictable image dimensions server-side to avoid CLS. The studio controls images but the implementation risk outweighs the benefit for V1. The hero card does the editorial heavy lifting; the 3-col grid beneath it has typographic credibility from the stat microdata.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  AppHeader — top nav (desktop)                                                │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  max-w-6xl mx-auto px-6                                                       │
│                                                                               │
│  ผลงาน · Works                                                                │  h1: font-serif
│                                                                               │  text-5xl md:text-7xl
│  studio ตกแต่งบ้านแนว warm-tone minimalist —                                 │  font-bold tracking-tight
│  โชว์ผลงานจริงพร้อมตัวเลขทุกโปรเจกต์                                         │  leading-[1.05] pt-12
│                                                                               │
│  งาน 12 ชิ้น                                                                  │  text-xs text-muted
│                                                                               │  uppercase tracking-widest
│                                                                               │  mt-4
├───────────────────────────────────────────────────────────────────────────────┤  sticky top-0 z-10
│  bg-bg/90 backdrop-blur py-3 border-b border-line                             │
│                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐        ┌─────────────────────┐  │  FILTER BAR
│  │  ห้อง: ทั้งหมด ▾  │  │  สไตล์: ทั้งหมด ▾│        │  × ล้างตัวกรอง      │  │  3 selects inline
│  └──────────────────┘  └──────────────────┘        └─────────────────────┘  │  (× appears only when active)
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤  mt-10
│                                                                               │
│  ┌────────────────────────────────────┐  ┌──────────────────────────────┐   │  HERO ROW
│  │                                    │  │                              │   │  2-col: left 60%, right 40%
│  │                                    │  │                              │   │  gap-8 items-center
│  │   Hero cover image — aspect 3:2   │  │  ห้องนั่งเล่น · Japandi · 2024│   │
│  │   (largest card, ~700px wide)      │  │                              │   │  LEFT: image
│  │   object-cover                     │  │  ชื่อผลงาน serif text-4xl   │   │  RIGHT: text column
│  │   rounded-md                       │  │  font-bold leading-[1.1]    │   │
│  │                                    │  │  text-ink mt-3              │   │
│  │                                    │  │                              │   │
│  │                                    │  │  สรุปงาน 2–3 ประโยค        │   │  summary: text-base
│  │                                    │  │  text-base text-muted       │   │  text-muted leading-[1.65]
│  │                                    │  │  leading-[1.65] mt-4        │   │  mt-4
│  │                                    │  │                              │   │
│  │                                    │  │  ┌────────────────────────┐ │   │
│  │                                    │  │  │  72      45     2024   │ │   │  STAT MINI-BAND
│  │                                    │  │  │  ตร.ม.   วัน    ปี     │ │   │  numbers: text-2xl font-bold
│  │                                    │  │  └────────────────────────┘ │   │  text-ink
│  │                                    │  │                              │   │  labels: text-[10px]
│  │                                    │  │  [ ดูผลงานนี้ → ]           │   │  uppercase text-muted
│  │                                    │  │  text-link text-accent mt-6 │   │
│  └────────────────────────────────────┘  └──────────────────────────────┘   │
│                                                                               │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  border-t border-line mt-12
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │  REGULAR GRID
│  │              │  │              │  │              │                       │  3-col gap-8 mt-12
│  │  3:2 image   │  │  3:2 image   │  │  3:2 image   │                       │
│  │  rounded-md  │  │  rounded-md  │  │  rounded-md  │                       │
│  │              │  │              │  │              │                       │
│  └──────────────┘  └──────────────┘  └──────────────┘                       │
│  ห้องนอน · 2024   ห้องครัว · 2023   Office · 2024                           │  eyebrow: text-[11px]
│                                                                               │  uppercase tracking-widest
│  ชื่อผลงาน        ชื่อผลงาน         ชื่อผลงาน                               │  text-muted mt-3
│  text-lg          font-semibold      text-ink                                 │
│  line-clamp-2     line-clamp-2       line-clamp-2                             │  title: text-lg font-semibold
│                                                                               │  text-ink mt-2 line-clamp-2
│  72 ตร.ม. · Japandi                                                          │  stat line: text-xs text-muted
│  52 ตร.ม. · Scand.                                                           │  mt-1
│  88 ตร.ม. · Modern                                                           │
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │  row 2, same pattern
│  └──────────────┘  └──────────────┘  └──────────────┘                       │
│  ...               ...               ...                                      │
│                                                                               │
│                    ┌──────────────────────┐                                   │
│                    │  โหลดเพิ่มเติม       │                                   │  load-more: centered
│                    └──────────────────────┘                                   │  variant="outline" px-8 py-3
│                                                                               │  (hidden when hasMore=false)
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Hero card desktop layout note:** The right text column is vertically centered against the image. This is purely CSS (`items-center` on the grid row). No JS required. On desktop the image stays ~700px wide; on tablet (768–1023px) it collapses to stacked (same as mobile hero card, full-bleed image above text).

---

## §5 WorkCard anatomy

### 5.1 `WorkCard` (regular — standard grid card)

Source file to create: `src/components/public/work/WorkCard.tsx`
Extract logic from: `WorkRelatedSection.tsx` `InlineWorkCard` — the anatomy matches exactly, adding the eyebrow meta and stat line this spec introduces.

**Props:**
```
slug: string
title: string
coverPath: string | null
coverAlt: string
roomType: RoomType
style: string | null
location: string | null
yearCompleted: number | null
areaSqm: string | null        — decimal string from DB, parsed to number for display
budgetRange: BudgetRange | null
```

**Mobile layout (single column stack):**
```
[ cover image — aspect 3:2, rounded-md, object-cover ]
[ eyebrow — text-[11px] uppercase tracking-widest text-muted mt-3 ]
  e.g. "ห้องนอน · Japandi"
[ title — text-lg font-semibold text-ink mt-1 line-clamp-2 ]
[ stat line — text-xs text-muted mt-1 ]
  e.g. "72 ตร.ม. · 2024" — only present stats, `·` separator
```

**States:**
- default: as above
- hover (desktop): `group-hover:scale-[1.02]` on image (0.3s, CSS transition), title `group-hover:text-brand-accent` color shift — no shadow, no translate (keeps calm aesthetic)
- focus-visible: `ring-2 ring-brand-accent ring-offset-2` on the wrapping `<Link>` — `rounded-md` to match card radius
- active: `scale-[0.99]` on the card wrapper (subtle press feel)
- loading: see `WorkCardSkeleton` in §12
- no-cover fallback: solid `bg-bg2` fill in the aspect container, no broken-image icon

**Image sizes attribute:** `(max-width: 768px) calc(50vw - 24px), (max-width: 1024px) calc(33vw - 24px), 380px`

### 5.2 `WorkCard` variant="hero" (anchor card — hero row only)

Not a separate component. A `variant` prop on `WorkCard` triggers the layout change. This avoids a third card component (clean-code rule of three — two card variants used ≥3 places each justifies 1 component with a prop).

**Additional prop:** `variant?: 'regular' | 'hero'` (default `'regular'`)

**Hero variant — mobile:**
- Cover: full-bleed (`-mx-4`), aspect 3:2, no border-radius (mirrors detail page hero)
- Eyebrow: `px-4 mt-4`
- Title: `font-serif text-3xl font-bold text-ink leading-[1.2] px-4 mt-2`
- Summary: `text-sm text-muted line-clamp-3 px-4 mt-2` — summary is shown (regular card has no summary)
- Stat mini-band: `text-xs text-ink font-medium px-4 mt-3` — inline list of present stats
- No "ดูผลงานนี้ →" link — the entire card is a link

**Hero variant — desktop:**
- 2-column layout: image left (~60%), text right (~40%), `items-center`
- Image: `rounded-md` (not full-bleed on desktop — contained within the grid)
- Title: `font-serif text-4xl font-bold` — the only place serif appears on a card (it is display typography for the hero, justified by its prominence)
- Stat mini-band: three cells side-by-side (area / duration / year), each with number `text-2xl font-bold text-ink` and label `text-[10px] uppercase text-muted`
- "ดูผลงานนี้ →" text link: `text-accent text-sm mt-6` — added on desktop because the right column has space

**Which card is the hero?** The first card from `listPublishedWorks` result. No admin-controlled "featured" flag needed. First = most recently published = freshest. Simple, deterministic, no new DB column.

**`WorkCardCompact`** in `WorkConceptSection` sidebar — leave completely untouched. Different component, different context, different props.

---

## §6 Filter UX

### Filters rendered
1. `roomType` — labeled "ห้อง" — select dropdown
2. `style` — labeled "สไตล์" — select dropdown

Tags are excluded from V1 filters. Tag chips are decorative on the listing for now (shown only on the detail page). The `tags` table data is not loaded on the listing route at all — no N+1 risk.

### UI form: `<Select>` dropdowns

**Why not chips:** Room type has 8 values + style is a free varchar with potentially many values collected from works. Chips would overflow on mobile and need horizontal scroll, which conflicts with `uxui.md §1` (calm, not busy). Dropdowns are compact, keyboard-friendly, and shadcn `<Select>` handles ARIA out of the box.

**Why not a sidebar filter rail:** Portfolio is small. A filter rail eats 25% of the viewport on desktop and adds visual weight. Inline dropdowns above the grid are lighter.

**Multi-select:** Single value per filter axis. Rationale: with ≤50 works, multi-select adds complexity (URL encoding, pill management, clear-per-axis) for marginal benefit.

### Filter bar composition (client component — `WorksFilterBar.tsx`)

```
[ Select: ห้อง (roomType) ]  [ Select: สไตล์ ]  [ × ล้างตัวกรอง (conditional) ]
```

- `WorksFilterBar` reads current URL params on mount, controls two `<Select>` from shadcn
- On selection change: `router.push('/works?' + newParams, { scroll: false })` — no client state; URL is single source of truth
- "× ล้างตัวกรอง" renders only when `room` or `style` param is present in URL; click = `router.push('/works', { scroll: false })`
- `scroll: false` prevents page-jump on filter change (the grid is below the fold on mobile)

### Sticky behavior

- Sticky `top-0` on scroll — `z-10`, `bg-bg/90 backdrop-blur-sm`
- `border-b border-line` separates filter bar from grid
- Must NOT overlap AppHeader (AppHeader is also sticky) — filter bar stacks below it. No CSS conflict because AppHeader is `z-20` and the filter bar is `z-10`.

### Select option lists

`roomType` options (static — derived from enum):
```
ทั้งหมด (value "")
ห้องนั่งเล่น (living)
ห้องนอน (bedroom)
ห้องครัว (kitchen)
ห้องน้ำ (bathroom)
ห้องทำงาน (office)
พื้นที่กลางแจ้ง (outdoor)
ทั้งบ้าน (full_house)
อื่น ๆ (other)
```

`style` options (dynamic — fetched from DB as `SELECT DISTINCT style FROM works WHERE status='published' ORDER BY style`): loaded in the page RSC and passed as props to `WorksFilterBar`. This avoids a separate client-side fetch and keeps the filter bar SSR-friendly.

### SEO: filter pages

Filter URLs (`/works?room=living`, `/works?style=japandi`) render with:
```
robots: { index: false, follow: true }
```
Per `seo.md` canonical rule — filter pages produce duplicate content. Base `/works` (no params) is the canonical and the only page submitted to sitemap.

The canonical `<link>` on filter pages points to `/works` (no params). This is set inside `generateMetadata` by checking `searchParams`.

### Empty filter result

```
┌──────────────────────────────────────────┐
│                                          │
│   🔍  (SearchX icon, size=48, text-muted)│
│                                          │
│   ยังไม่มีผลงานที่ตรงกับตัวกรองนี้       │
│   text-xl font-semibold text-ink         │
│                                          │
│   ลองเปลี่ยนตัวกรอง หรือ               │
│   text-sm text-muted                    │
│   [ดูผลงานทั้งหมด →]  (text-accent)     │
│                                          │
└──────────────────────────────────────────┘
```

Per `uxui.md §16` — lucide icon, Thai copy, CTA to clear filters.

---

## §7 Pagination

**Decision: "Load more" button, 12 cards per page.**

Justification:
- Portfolio unlikely to exceed 50 works; page numbers would show "1 2 3 4" at most and feel heavy
- Load-more keeps URL clean — no `/works?page=2` URLs to worry about indexing
- Simpler implementation: no page arithmetic, no active-page state

**How it works (RSC + URL param hybrid):**

The listing page is RSC. "Load more" uses a `count` URL param: `/works?count=24`. On click:
- `WorksFilterBar` (client) calls `router.push('/works?count=24&room=...&style=...', { scroll: false })`
- Page RSC fetches `listPublishedWorks({ limit: 24, ... })`
- All 24 cards render server-side in a single request (no client-side fetch, no server action)
- Browser scrolls to the newly added cards via a React `useEffect` in `WorksListing.tsx` that watches `count` param change

**Why not a server action or SWR:** Keeping it RSC means no hydration waterfall, no loading spinner during the grid update (Next Suspense handles it), and full HTML in the response for crawlers.

**SEO:** `?count=24` pages are `noindex` (same rule as filters — they are parameterized variants of the canonical `/works`).

**Button states:**
- Default: `variant="outline"` button, full text "โหลดเพิ่มเติม (N เหลืออยู่)"
- Loading: button shows `<Spinner size={16} />` + "กำลังโหลด" (Next page transition state via `useFormStatus` or `useTransition` in the client shell)
- No more results: button is hidden entirely (`hasMore === false`)

---

## §8 SEO + metadata

**`generateMetadata` logic:**

```
Base page (/works — no params):
  title: "ผลงาน — house-peach"
  description: "ผลงานตกแต่งบ้านแนว warm-tone minimalist จาก house-peach
                ห้องนั่งเล่น ห้องนอน ห้องครัว ทุกโปรเจกต์พร้อมตัวเลขจริง"
               (128 chars — within 80–160 rule)
  alternates.canonical: "/works"
  robots: { index: true }

Filter / paginated pages (?room=... or ?style=... or ?count=...):
  title: same
  robots: { index: false, follow: true }
  alternates.canonical: "/works"
```

**JSON-LD `CollectionPage`:**

Worth implementing — Google uses `CollectionPage` to understand portfolio/gallery pages. Lightweight: no per-item markup needed (individual `CreativeWork` JSON-LD lives on each `/works/[slug]` detail page already).

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "ผลงาน — house-peach",
  "description": "...(same as meta description)",
  "url": "https://house-peach.com/works",
  "publisher": {
    "@type": "Organization",
    "name": "house-peach",
    "url": "https://house-peach.com"
  }
}
```

No `hasPart` array — listing 50 works inline in JSON-LD bloats the page and provides diminishing SEO return versus the per-detail `CreativeWork` already there.

**Sitemap:** `/works` (no params) is included in `app/sitemap.ts`. Filter URLs are excluded. This is the current correct behavior — no change needed.

---

## §9 Motion plan

| Element | Animation | Notes |
|---|---|---|
| H1 + lead paragraph | `<FadeUp>` single block | 0.35s ease-out, y 8→0, opacity 0→1 |
| Work count eyebrow | Inside same `<FadeUp>` block | No separate animation |
| Filter bar | None | Chrome — no animation per `motion.md` |
| Hero card | `<FadeUp>` | 0.35s, delay 0.1s after H1 |
| Regular grid (first 6 cards) | `<Stagger>` | stagger 0.05s per child, ≤6 items total = 0.3s max |
| Regular grid (cards 7–12+) | `<FadeUp>` on the grid container | Do not stagger >6 items per `motion.md` budget |
| Load-more button | No animation — `<Spinner>` during pending state only | |
| Newly loaded cards (append) | No animation — new RSC response replaces the grid | The Suspense fallback handles the transition |

All motion respects `useReducedMotion()` inside wrappers — see `src/components/motion/FadeUp.tsx` and `Stagger.tsx` (existing implementations).

---

## §10 State coverage matrix

| State | Visual treatment |
|---|---|
| Loading (initial page) | `loading.tsx` skeleton — see §12 |
| Loading (load-more pending) | Load-more button shows `<Spinner>` + "กำลังโหลด", grid unchanged |
| Empty — no published works at all | `SearchX` icon (48px, text-muted) + "ยังไม่มีผลงาน" h2 + "ติดตามเราเร็ว ๆ นี้" subline — no CTA to admin (public page) |
| Empty — filter returns zero | `SearchX` icon + "ยังไม่มีผลงานที่ตรงกับตัวกรองนี้" + "ดูผลงานทั้งหมด →" link clears filters |
| Single result | Renders in grid normally — hero card takes the first slot, no regular grid below it. Consistent, no special layout |
| Load-more error | `sonner` toast: "โหลดเพิ่มเติมไม่สำเร็จ — ลองอีกครั้ง" with a retry action. Grid remains intact (no rollback needed — we haven't removed anything) |
| Filter select open (keyboard) | shadcn `<Select>` handles focus trap and `Esc` close |
| Hero card — no cover image | `bg-bg2` fill in the aspect container; summary and title still render normally |

---

## §11 Data layer needs (be-data)

The existing `listWorks()` in `src/lib/services/work.ts` is admin-shaped (returns all statuses, no pagination, no filter, includes `tagCount`). A new public function is required.

**New function signature:**

```ts
// src/lib/services/work.ts

export type WorkPublicListItem = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  roomType: RoomType;
  style: string | null;
  location: string | null;
  yearCompleted: number | null;
  areaSqm: string | null;       // decimal string — page parses to number
  budgetRange: BudgetRange | null;
  durationDays: number | null;
  coverPath: string | null;
  coverAlt: string | null;
};

export async function listPublishedWorks(input: {
  page: number;         // 1-based (for offset calculation only; URL uses `count` param — see §7)
  limit: number;        // 12 default
  roomType?: RoomType;
  style?: string;
}): Promise<{ items: WorkPublicListItem[]; total: number; hasMore: boolean }>
```

**Differences from `listWorks()`:**
- `status = 'published'` filter mandatory
- `roomType` and `style` optional filters
- Returns paginated slice (`limit` / `offset` from `page`)
- Excludes `tagCount` (not needed on listing)
- Excludes `bodyMdx`, `tone`, `accent`, `durationDays` beyond what is listed above — only fields needed by the card
- Returns `total` count (single aggregating query or `COUNT(*)` subquery)
- `hasMore = total > page * limit`

**Index coverage check:**
- `works_status_published_idx` on `(status, published_at DESC)` — covers the base `WHERE status='published' ORDER BY published_at DESC`
- `works_room_style_idx` on `(room_type, style)` — covers combined filter. For single-axis filter (`room_type` only or `style` only) MariaDB will use this index partially — acceptable for ≤500 rows
- No new index needed for V1

**`revalidateTag` on listing page:**
- Page uses `unstable_cache` or `fetch` tagged with `'works'`
- Already handled by `bumpWork()` in `work.ts` which calls `bumpTag(cacheTags.works)` on any create/update/delete — no change needed

**`style` options for filter `<Select>`:**

```ts
export async function listDistinctWorkStyles(): Promise<string[]>
// SELECT DISTINCT style FROM works WHERE status='published' AND style IS NOT NULL ORDER BY style
```

This is a simple query, result is tiny, can be cached aggressively with `revalidateTag('works')`.

---

## §12 Component decomposition

| File | RSC/Client | LOC est. | Justification |
|---|---|---|---|
| `src/app/(public)/works/page.tsx` | RSC | ~70 | Route — fetches `listPublishedWorks` + `listDistinctWorkStyles`, passes to children |
| `src/app/(public)/works/loading.tsx` | RSC | ~30 | Skeleton fallback — hero skeleton + grid skeletons (×6) |
| `src/components/public/work/WorkCard.tsx` | RSC | ~80 | NEW — extracted from `WorkRelatedSection.tsx` `InlineWorkCard`; adds `variant` prop, eyebrow, stat line |
| `src/components/public/work/WorksListing.tsx` | Client | ~90 | Grid wrapper — reads `count` URL param, renders hero card + regular grid, fires scroll-to-new on count change |
| `src/components/public/work/WorksFilterBar.tsx` | Client | ~70 | Filter selects + clear button — reads/writes URL params via `useRouter` + `useSearchParams` |

**`WorksListing.tsx` is Client** because it reads `useSearchParams()` (for the `count` param) and triggers `router.push()` on load-more click. The data itself is fetched server-side in `page.tsx` — `WorksListing` receives `items`, `total`, `hasMore`, and `styleOptions` as props. No client-side fetching.

**`WorkRelatedSection.tsx`** — after `WorkCard.tsx` is created, replace `InlineWorkCard` with `<WorkCard>`. This is a small cleanup task for fe-public; note in the PR.

**`loading.tsx` skeleton anatomy:**

```
[ Skeleton h-10 w-48 ]                        ← H1 placeholder
[ Skeleton h-4 w-full max-w-sm mt-3 ]         ← lead line 1
[ Skeleton h-4 w-3/4 mt-2 ]                   ← lead line 2
[ Skeleton h-4 w-20 mt-4 ]                    ← count eyebrow

[ Skeleton aspect-[3/2] w-full rounded-md mt-8 ]  ← hero image
[ Skeleton h-3 w-32 mt-4 ]                    ← hero eyebrow
[ Skeleton h-8 w-3/4 mt-2 ]                   ← hero title
[ Skeleton h-4 w-full mt-2 ]                  ← hero summary line
[ Skeleton h-4 w-2/3 mt-1 ]
[ Skeleton h-3 w-24 mt-3 ]                   ← hero stat line

[ grid 2-col (mobile) / 3-col (desktop) gap-6 mt-12 ]
  6 × [ Skeleton aspect-[3/2] + Skeleton h-4 mt-2 + Skeleton h-3 mt-1 ]
```

All skeletons wrapped in `<section aria-busy="true" aria-label="กำลังโหลดผลงาน">`.

---

## §13 Red-line list — DO NOT DO

1. **No infinite scroll** — breaks keyboard navigation, destroys URL shareability, complicates SEO. Load-more button only.
2. **No client-side data fetch** — all data fetched in RSC `page.tsx`. `WorksListing` and `WorksFilterBar` receive props, they do not fetch.
3. **No `<Tab>` component for roomType / style** — tabs consume full horizontal width, hide options. Use `<Select>` dropdowns.
4. **No filter-state in React state separate from URL** — URL params are the single source of truth. No `useState` holding filter values that could diverge from the URL.
5. **No carousel / auto-rotation** — static grid. The hero card is always the most recently published work.
6. **No third card variant** — `WorkCard` with `variant="hero"` covers both sizes. `WorkCardCompact` (sidebar) is untouched.
7. **No hardcoded hex** — all colors through tokens (`text-ink`, `bg-bg2`, `text-brand-accent`, etc.).
8. **No `outline-none` without `focus-visible:ring`** on `WorkCard` link wrapper.
9. **No `shadow-lg` on cards** — per `uxui.md §5`. Use `group-hover:scale-[1.02]` and color shift only.
10. **No mosaic / masonry grid** — CLS risk from unpredictable image dimensions. Uniform 3:2 aspect containers.
11. **No filter result pages in sitemap** — only canonical `/works`.
12. **No `aria-hidden` on stat numbers** — the numbers are meaningful content for screen readers; read naturally as "72 ตร.ม.".
13. **No `isFeatured` flag request** — there is no such column on `works`. Hero = first published. Don't add a new column for this.

---

## §14 Open questions

**Q1 — Hero card on desktop: image-left vs image-top?**
Spec proposes image-left / text-right 2-col layout for desktop hero. Alternative: image spans full width above, text below (same as mobile but wider). The 2-col layout is editorially stronger but requires the hero cover image to be at least 700px wide (all uploads are 1500px+ from the pipeline, so not a concern). **Recommend: 2-col.** User must confirm.

**Q2 — `style` filter options: from DB or hardcoded list?**
Spec proposes `listDistinctWorkStyles()` from DB so no maintenance as styles evolve. Alternative: hardcode a curated list of 5–8 common styles in a constant (simpler, predictable). The DB approach is cleaner but requires an extra query on every page load. With ISR and `revalidateTag('works')` the query is cached. **Recommend: DB approach.** User must confirm.

**Q3 — Work count display: total published works or filtered count?**
"งาน 12 ชิ้น" in the mockup shows total. When filters are active should it show filtered count ("งาน 4 ชิ้น ที่ตรงกัน") or always total? Filtered count is more informative; total is simpler. **Recommend: filtered count when filters active, total when no filters.** Confirm.

**Q4 — Lead paragraph: static copy or DB-driven?**
Spec uses static copy as a placeholder for the listing lead paragraph. The actual copy should come from brand voice (Thai, warm, 2–3 lines). Is this copy owned by the designer/copywriter, or should it be an admin-editable site setting (requires a new `settings` table)? **Recommend: static copy in V1, hardcoded in `page.tsx` as a constant. Admin-editable in V2 if needed.** Confirm.

**Q5 — `WorkRelatedSection.tsx` cleanup: replace `InlineWorkCard` with `WorkCard` immediately or in a follow-up PR?**
The `InlineWorkCard` in `WorkRelatedSection.tsx` is flagged for extraction. It is functionally identical to what `WorkCard` will be. The listing spec assumes `WorkCard` is created; the question is whether the fe-public implementer should also update `WorkRelatedSection` in the same PR. **Recommend: same PR — it is a small swap and removes the duplication flag.** Confirm.

---

## Copy

| Element | TH | EN |
|---|---|---|
| H1 | ผลงาน | Works |
| H1 bilingual | ผลงาน · Works | |
| Lead | "studio ตกแต่งบ้านแนว warm-tone minimalist — โชว์ผลงานจริงพร้อมตัวเลขทุกโปรเจกต์" | "Warm-tone minimalist interiors — real projects with real numbers" |
| Count | "งาน N ชิ้น" | "N works" |
| Filter label — room | ห้อง | Room |
| Filter label — style | สไตล์ | Style |
| Filter placeholder | ทั้งหมด | All |
| Clear filters | × ล้างตัวกรอง | × Clear filters |
| Load more | "โหลดเพิ่มเติม (N เหลืออยู่)" | "Load more (N remaining)" |
| Loading state | กำลังโหลด | Loading |
| Empty — no works | ยังไม่มีผลงาน | No works yet |
| Empty — filtered | ยังไม่มีผลงานที่ตรงกับตัวกรองนี้ | No works match this filter |
| Empty CTA | ดูผลงานทั้งหมด | View all works |
| Load-more error toast | "โหลดเพิ่มเติมไม่สำเร็จ — ลองอีกครั้ง" | |

All TH copy to be reviewed by a native Thai speaker before launch. EN copy is sentence case throughout.

---

## A11y notes

- Single `<h1>` per page: "ผลงาน · Works" — listing route owns it
- `<h2>` used nowhere on the listing itself (no sub-section headings) — filter bar is not a heading
- Works grid: `<ul>` / `<li>` list semantics — `list-none` removes bullet styling, semantic structure preserved
- Hero card and regular cards: entire card is a `<Link>` with descriptive `aria-label="ดูผลงาน: {title}"` (the visible title alone may be enough — confirm with a11y-reviewer)
- Filter bar: each `<Select>` has an associated `<label>` — shadcn `<Select>` provides `aria-labelledby` via Radix
- "× ล้างตัวกรอง" button: `aria-label="ล้างตัวกรองทั้งหมด"` (icon + short label combo)
- `loading.tsx` skeleton wrapper: `aria-busy="true"` + `aria-label="กำลังโหลดผลงาน"`
- Load-more button: `aria-busy={isPending}` when transition pending
- Skip link in public layout already covers "ข้ามไปยังเนื้อหา" — no additional skip link needed for filter bar
- Stat numbers: rendered as text, not as `<data>` value elements — sufficient for V1

---

## Hand-off

- **Implementer:** fe-public
- **Data layer:** be-data implements `listPublishedWorks()` and `listDistinctWorkStyles()` in `src/lib/services/work.ts`
- **Suggested skills:** `add-public-screen`, `seo-page-checklist`, `component-anatomy`, `page-states`
- **Review after implementation:** `a11y-review` (filter keyboard + list semantics), `seo-reviewer` (noindex on filter URLs, CollectionPage JSON-LD), `perf-auditor` (LCP on hero card image)
