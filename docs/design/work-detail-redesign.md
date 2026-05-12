# Design spec — Work Detail page redesign (`/works/[slug]`)

## Purpose

The work detail page is house-peach's primary proof-of-craft: a visitor arriving from Instagram or a Google search for "Japandi bedroom Bangkok" must feel the studio's sensibility in the first five seconds, long before they read a word. The current layout — a single centred column at `max-w-4xl`, all elements the same width, gallery appended below as an afterthought — reads like a form output rather than a portfolio. This spec replaces it with a story-driven editorial layout that integrates imagery into the narrative rather than queuing it at the bottom.

---

## Problem with the current layout

1. Every element is the same width (`max-w-4xl`, ~896px). Breadcrumb, title, summary, meta, cover image, MDX body, gallery — all share a single column. The eye has nowhere to travel; nothing signals "this image is important, that one is supporting."
2. The gallery is entirely detached from the MDX body. A before/after pair might be described in paragraph 2 of the body, but the actual slider sits three screens lower. The story is split.
3. `kind` metadata (`before`, `after`, `process`, `detail`) exists in the database but is invisible to the reader. All images look equal.
4. The meta row (room type, style, year, location, area, budget) is a low-contrast inline list that gets skimmed past. On desktop there is wasted white space next to the text that could hold this context persistently.

---

## Layout strategy — story-driven sections with a sticky meta sidebar on desktop

The chosen approach is a **hybrid**: on desktop, the reading zone uses a two-column asymmetric layout (prose body 65ch left, sticky meta sidebar right) for the top half; gallery sections break out of this column to fill up to `max-w-7xl` with varied image widths. On mobile the sidebar collapses below the header, and gallery sections stack full-width.

Why this approach and not the others:

- "Mosaic/masonry" is visually exciting but fragile at narrow widths and violates the content-first brand feel — it makes the grid itself the hero rather than the work.
- "Cinematic single-column with full-bleed punctuation" alone still has the monotony problem at desktop widths — you need the sidebar to break the uniformity without adding decorative chrome.
- "Pure editorial asymmetric" (à la a magazine spread) is too complex for works that may have only two images; the spec needs to degrade gracefully to a near-single-column for sparse works.
- The story-driven section model (Before / Process / After / Details) maps directly onto the `kind` enum already in the DB — no new fields required, and it rewards the admin who labels images carefully.

The result evokes "warm observation" and "intimate documentation" rather than "studio showreel."

---

## Mobile mockup (390px wide)

```
┌──────────────────────────────────────┐
│ [breadcrumb: หน้าแรก / ผลงาน / ...]  │  text-xs text-muted, pt-4 px-4
├──────────────────────────────────────┤
│                                      │
│  Headline serif h1                   │  font-serif text-4xl font-bold
│  over two lines if needed            │  px-4 mt-4 leading-tight
│                                      │
│  Summary paragraph                   │  text-base text-muted px-4 mt-3
│  one or two sentences                │  max-w-prose
│                                      │
├──────────────────────────────────────┤
│  ┌── Meta strip (horizontal scroll) ─┤  bg-bg2 px-4 py-3 mt-4
│  │ ประเภท: ห้องนั่งเล่น · สไตล์: ... │  text-xs text-muted, nowrap
│  └───────────────────────────────────┤  overflow-x-auto, -webkit-overflow-scroll
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │                                │  │  Cover / hero image
│  │   Cover image (aspect 3:2)     │  │  full-bleed (no horizontal px)
│  │   priority LCP                 │  │  aspect-[3/2] w-full
│  │                                │  │  mt-6
│  └────────────────────────────────┘  │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ── Before · ก่อน ──────────────── │  Section label (if before/after exists)
│                                      │  eyebrow: text-xs uppercase tracking-widest
│  ┌────────────────────────────────┐  │  text-muted px-4 mt-10
│  │                                │  │
│  │  BeforeAfterCard (full-width)  │  │  full-bleed, no px
│  │  slider on desktop, toggle on  │  │  aspect from stored width/height
│  │  mobile                        │  │
│  └────────────────────────────────┘  │
│  Caption if present                  │  text-xs text-muted px-4 mt-2
│                                      │
├──────────────────────────────────────┤
│                                      │
│  MDX body prose section              │  px-4 mt-10
│  (paragraphs, h2, h3, inline        │  prose max-w-prose
│   BeforeAfter embeds)               │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ── Process · กระบวนการ ─────────── │  eyebrow label px-4 mt-12
│  (if process images exist)          │
│                                      │
│  ┌──────────────┐ ┌──────────────┐  │  2-up grid px-4 gap-2
│  │ process img  │ │ process img  │  │  aspect-square (1:1)
│  └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐  │  continues...
│  │ process img  │ │ process img  │  │
│  └──────────────┘ └──────────────┘  │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ── Details · รายละเอียด ──────────  │  eyebrow label px-4 mt-12
│  (if detail images exist)           │
│                                      │
│  ┌────────────────────────────────┐  │  full-bleed single image
│  │ detail img (natural aspect)    │  │  (or 2-up if both narrow)
│  └────────────────────────────────┘  │
│  Caption                             │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  #tag1  #tag2  #tag3                 │  px-4 mt-10 flex flex-wrap gap-2
│                                      │  rounded-full bg-bg2 pill chips
│                                      │
└──────────────────────────────────────┘
```

---

## Desktop mockup (≥1024px, max-w-7xl container)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [หน้าแรก / ผลงาน / title]                                               │  breadcrumb
│                                                                          │  pt-8 px-6
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──── Content zone (max-w-3xl) ──────┐  ┌── Sticky sidebar (w-64) ──┐  │
│  │                                    │  │                            │  │
│  │  h1 serif 5xl                      │  │  ────────────────────────  │  │
│  │  "ห้องนั่งเล่น Japandi             │  │  ประเภท                    │  │
│  │   ย่านทองหล่อ"                     │  │  ห้องนั่งเล่น              │  │
│  │                                    │  │                            │  │
│  │  Summary text-lg text-muted        │  │  สไตล์                     │  │
│  │  max-w-prose                       │  │  Japandi                   │  │
│  │                                    │  │                            │  │
│  │  [FadeUp: 0.35s on viewport enter] │  │  ปีที่เสร็จ                │  │
│  │                                    │  │  2024                      │  │
│  └────────────────────────────────────┘  │                            │  │
│                                          │  สถานที่                   │  │
│                                          │  ทองหล่อ กรุงเทพ           │  │
│                                          │                            │  │
│                                          │  พื้นที่                   │  │
│                                          │  45 ตร.ม.                  │  │
│                                          │                            │  │
│                                          │  งบประมาณ                  │  │
│                                          │  300k – 700k               │  │
│                                          │                            │  │
│                                          │  ────────────────────────  │  │
│                                          │  #japandi  #living         │  │
│                                          │  #minimal                  │  │
│                                          └────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │   HERO IMAGE — full-bleed up to max-w-7xl                        │   │
│  │   aspect 2:1 (desktop) via aspect-[2/1]                          │   │
│  │   rounded-2xl  priority LCP                                      │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  px-6, mt-10                                                            │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ── Before & After · ก่อน/หลัง ─────────────────────────────────────── │  eyebrow
│  (only if before/after pair exists)                                     │  px-6 mt-16
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  BeforeAfterCard — full-bleed (max-w-7xl)                        │   │
│  │  slider on desktop, natural aspect stored on asset               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  Caption (if present)                text-sm text-muted mt-3 px-6       │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────┐  ← prose column max-w-prose     │
│  │  MDX body                         │     px-6, mt-16                 │
│  │  h2/h3 + paragraphs + inline      │                                  │
│  │  BeforeAfter embeds               │                                  │
│  │  (embeds break out to full-bleed  │                                  │
│  │   via negative margin technique)  │                                  │
│  └───────────────────────────────────┘                                  │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ── Process · กระบวนการ ──────────────────────────────────────────────  │  eyebrow px-6
│  (only if process images exist)                                         │  mt-16
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ process 1   │ │ process 2   │ │ process 3   │ │ process 4   │      │
│  │ (1:1 thumb) │ │ (1:1 thumb) │ │ (1:1 thumb) │ │ (1:1 thumb) │      │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │
│  grid-cols-4 gap-3 px-6                                                 │
│  (≤3 images: grid-cols-3; ≤2: grid-cols-2; 1: max-w-prose centered)    │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ── Details · รายละเอียด ──────────────────────────────────────────────  │  eyebrow px-6
│  (only if detail images exist)                                          │  mt-16
│                                                                          │
│  ┌────────────────────────────────────────────┐  ┌────────────────────┐ │
│  │  detail A                                  │  │  detail B          │ │
│  │  (wide if aspect > 1.5, col-span-2 of 3)  │  │  (portrait/square) │ │
│  └────────────────────────────────────────────┘  └────────────────────┘ │
│  See "Image-aspect strategy" §6 for col-span rules                      │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Tags row                      #japandi  #living  #minimal             │  px-6 mt-12
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Desktop sidebar: sticky behaviour

The sidebar uses `position: sticky; top: 6rem` (accounts for the fixed header height). It is present only if at least one meta field is non-null. The sidebar scrolls with the page until it reaches the viewport top offset, then pins while the prose column continues scrolling. Once the prose column ends (just before the gallery sections), the sidebar is no longer sticky — it stays in its natural flow position. Implementation: wrap the two-column zone in a `relative` container with a defined bottom boundary; the sidebar has `sticky top-24 self-start`.

### Full-bleed images within the 7xl container

Gallery sections (hero, before/after, process, detail) use the full `max-w-7xl` width with `px-6` gutter. The prose/sidebar two-column zone sits inside `max-w-5xl`. Both zones use `mx-auto` within the same page wrapper. This is achieved by making the page wrapper `max-w-7xl mx-auto px-6` and letting the prose zone apply its own `max-w-3xl` internally — not by nesting containers.

---

## Component decomposition

### Existing components — reuse without change

| Component | Location | Reuse note |
|---|---|---|
| `BeforeAfterCard` | `components/public/work/BeforeAfterCard.tsx` | Reuse as-is. Receives `before`, `after`, optional `caption`. Auto-detects mobile/desktop. Pass `className="rounded-2xl"` for the hero slot. |
| `BeforeAfterSlider` | `components/public/work/BeforeAfterSlider.tsx` | Used by `BeforeAfterCard` internally — no change needed. |
| `BeforeAfterToggle` | `components/public/work/BeforeAfterToggle.tsx` | Same — internal to `BeforeAfterCard`. |
| `BeforeAfterEmbed` | `components/public/work/BeforeAfterEmbed.tsx` | MDX inline embeds unchanged. The embed renders a full-bleed break-out via negative margin applied in the MDX prose wrapper, not inside the embed itself. |
| `FadeUp` | `components/motion/FadeUp.tsx` | Wrap headline+summary block, each gallery section heading, and the process/detail grids. |
| `Stagger` + `StaggerItem` | `components/motion/Stagger.tsx` | Wrap process grid items (≤6 items rule applies; if > 6 process images, wrap the whole grid in a single `FadeUp` instead per `motion.md`). |
| shadcn `Separator` | `components/ui/separator.tsx` | Optional visual rule between sections; use `bg-line` token. |

### Existing component — extend

**`WorkGallery`** (`components/public/work/WorkGallery.tsx`) — the current component renders a flat list of all non-cover images. The redesign needs it to understand `kind` groups and produce the section structure. Rather than creating a parallel component, extend `WorkGallery` by adding a `variant` prop:

```
WorkGallery
  props:
    images: WorkImageListItem[]
    coverAssetId: number | null
    variant: 'legacy' | 'sectioned'   // 'legacy' = current flat list (default, no regression)
```

When `variant="sectioned"` the component partitions images by kind and renders `<WorkGallerySection>` sub-components (see below). The page passes `variant="sectioned"` in the new layout; old rendering path untouched.

### New components — required

All in `src/components/public/work/`.

---

#### `WorkHero`

Responsibility: renders the cover image as the large hero element with responsive aspect ratio. On mobile: `aspect-[3/2]`. On desktop: `aspect-[2/1]`. Uses `next/image` with `priority` (LCP element). Accepts an optional `caption` from the asset's `alt` or the work title as fallback.

Props sketch:
```
{
  src: string
  alt: string
  width: number       // stored on mediaAssets
  height: number      // stored on mediaAssets
  title: string       // fallback alt
  className?: string
}
```

Justification: the page currently inlines this block with `style={{ aspectRatio }}`. Extracting it lets the responsive aspect override be co-located with the image and keeps the page RSC clean. Not a shadcn candidate — it is domain-specific (aspect switching by breakpoint + priority flag).

---

#### `WorkMetaSidebar`

Responsibility: renders the structured meta fields (room type, style, year, location, area, budget) as a labelled definition list in the desktop sidebar slot, and as a horizontally-scrollable chip strip on mobile. The component renders both DOM nodes; CSS controls which is visible at each breakpoint (the sidebar `div` is `hidden md:block`; the mobile strip is `block md:hidden`). Tags are also included at the bottom of the sidebar on desktop; on mobile tags appear at the page bottom as today.

Props sketch:
```
{
  roomType: string
  style: string | null
  yearCompleted: number | null
  location: string | null
  areaSqm: number | null
  budgetRange: string | null
  tagNames: string[]
  roomTypeLabel: string   // pre-resolved TH label, computed in page RSC
  budgetLabel: string | null
}
```

Justification: the page currently has an inline `<dl>` with a `<Meta>` helper. Extracting the sidebar wrapping + the mobile strip into one component avoids duplicating the label map and keeps responsive layout logic out of the page file. No shadcn primitive covers this layout concern.

---

#### `WorkGallerySection`

Responsibility: renders one named section of gallery images (one `kind` group: `before/after`, `process`, or `detail`). Accepts a section label (TH + EN), a list of clusters, and a `displayMode` that controls grid behaviour. Renders the eyebrow heading (`<h2>`) so the section contributes to heading hierarchy.

Props sketch:
```
{
  label: { th: string; en: string }
  clusters: Cluster[]              // Cluster type already in WorkGallery.tsx
  displayMode: 'before-after' | 'process-grid' | 'detail-editorial'
  className?: string
}
```

For `before-after`: renders only `BeforeAfterCard` clusters, full-bleed. Unpaired before/after images (orphaned by partner deletion) degrade to `detail-editorial` single images.

For `process-grid`: renders square-aspect thumbnails in a responsive grid (2-col mobile, 4-col desktop). Each image is wrapped in `<FadeUp>` if ≤ 6 items, or the whole grid in a single `<FadeUp>` if > 6. Caption, if present, appears below the grid as a single block caption (not per-image).

For `detail-editorial`: renders images using the aspect-based column-span rule (see §6). Uses a CSS grid with 3 equal columns at desktop; each image occupies 1 or 2 columns depending on its stored aspect ratio.

Justification: `WorkGallery` currently has no concept of sections. Rather than putting all this logic into one growing function, the `WorkGallerySection` keeps each display mode isolated and testable. No shadcn primitive maps to editorial image grid layouts.

---

#### `WorkProseSection`

Responsibility: wraps the compiled MDX body with the correct prose classes and handles the negative-margin technique for full-bleed inline `<BeforeAfter>` embeds. The embed component itself does not know whether it is inside a constrained prose column — the wrapper applies `.prose .full-bleed-child { margin-inline: calc(50% - 50vw) }` via a scoped CSS class.

Props sketch:
```
{
  body: ReactNode    // compiled MDX from compileWorkMdx()
  className?: string
}
```

Justification: the current page inlines `<div className="prose prose-stone mt-10 max-w-prose dark:prose-invert">`. The full-bleed break-out technique needs an extra wrapper class that the page file should not own. The component is thin but the scoped CSS class is load-bearing.

No new MDX whitelist components are added — the `<BeforeAfter>` component already exists. The full-bleed break-out is a CSS wrapper technique on the host, not a new MDX tag.

---

## Image-aspect strategy

The `mediaAssets` table stores `width` and `height` per asset. The computed aspect ratio `width / height` drives display rules without any new DB fields:

### Cover / hero slot

Always occupies the full container width. Aspect overridden by CSS:
- Mobile: `aspect-[3/2]` (hardware)
- Desktop (`md:`): `aspect-[2/1]` (hardware)
- `object-cover` fills the container. Stored dimensions are passed to `next/image` for correct `srcset` generation, not for the rendered aspect.

### Before/After pair slot

Use the stored aspect of the `after` image (the `BeforeAfterSlider` already does this — see `aspectStyle` in `BeforeAfterSlider.tsx`). No override. Full container width.

### Process images

Always rendered as `1:1` squares via `aspect-square object-cover`. This creates a uniform grid regardless of what the admin uploaded. The original crop is lost in presentation, which is acceptable for process shots (sketches, swatches, in-progress) where square framing reads naturally as documentation.

### Detail images (the editorial grid)

The `detail-editorial` display mode uses a 3-column CSS grid at desktop. Each image's column span is computed from its stored aspect ratio:

| Stored aspect (width ÷ height) | Desktop col-span | Mobile behaviour |
|---|---|---|
| ≥ 1.6 (landscape, e.g. 3:2, 2:1) | `col-span-2` of 3 | full-width single |
| 0.7 – 1.59 (near-square or portrait) | `col-span-1` of 3 | full-width single |
| < 0.7 (tall portrait) | `col-span-1` of 3 | full-width single |

The grid fills columns left-to-right by sort order. If two consecutive `col-span-1` images appear, they naturally pair. If a `col-span-2` appears and only 1 column remains in the row, it wraps to the next row (CSS grid handles this automatically with `grid-cols-3 auto-rows-auto`).

On mobile, all detail images are full-width stacked, each with its natural stored aspect ratio via `aspectRatio: width/height` inline style.

This rule is computed in `WorkGallerySection` (client-side via a helper `getDetailColSpan(width, height): 1 | 2`) — a pure function with no DB involvement.

---

## Motion plan

| Element | Motion | Wrapper | Notes |
|---|---|---|---|
| h1 + summary block | `FadeUp` on viewport enter | `<FadeUp>` | `once: true`, `delay=0`, `viewport={{ margin: '-10% 0px' }}` |
| Hero image | No motion — static | — | LCP element; motion delays perceived load |
| Before/After section heading | `FadeUp` on viewport enter | `<FadeUp>` | `delay=0` |
| `BeforeAfterCard` | No motion on the card itself | — | Internal drag/toggle already has motion; wrapping it adds complexity with no benefit |
| MDX prose section | `FadeUp` on viewport enter | `<FadeUp>` wrapping `<WorkProseSection>` | `delay=0` |
| Process grid heading | `FadeUp` | `<FadeUp>` | |
| Process grid items (≤ 6) | `Stagger` + `StaggerItem` | `<Stagger>` | Cap is enforced — if > 6 images, use single `<FadeUp>` on the whole grid per `motion.md` |
| Process grid items (> 6) | `FadeUp` on whole grid | `<FadeUp>` | |
| Detail section heading | `FadeUp` | `<FadeUp>` | |
| Detail grid | `FadeUp` on whole grid | `<FadeUp>` | Do not stagger — images have different col-spans, stagger looks disjointed |
| Sidebar | No motion | — | Sticky element; animating it on scroll would fight the sticky positioning |
| Tags row | No motion | — | Low-stakes, at page bottom |

All `FadeUp` calls use the defaults already in the component (`0.35s ease-out`, `y: 8 → 0`, `opacity: 0 → 1`). No new motion primitives needed. `useReducedMotion()` is enforced inside `FadeUp` and `Stagger` — no additional checks needed in `WorkGallerySection`.

---

## State coverage

### Work has only 1 image (the cover, no gallery)

`WorkGallery` (with `variant="sectioned"`) receives an empty list after filtering out the cover. It returns `null`. The page renders: breadcrumb + h1 + summary + meta (sidebar on desktop, strip on mobile) + hero image + MDX body (if any) + tags. This is a complete, non-broken page. The absence of a gallery section is not signalled to the user — there is simply no section, which is the correct silent degradation.

### Work has cover + 1 before/after pair only

`WorkGallerySection` for the before/after kind renders one full-bleed `BeforeAfterCard`. The process and detail sections are absent (empty kind groups = no section rendered). Result: breadcrumb + h1 + summary + meta + hero + before/after section + MDX body + tags. This is the most common minimal work and it looks complete.

### Work has 8+ images mixed kinds

The page renders all sections that have content: before/after section (pairs), then MDX prose, then process grid (if any), then detail editorial grid (if any). Each section fades up independently as the user scrolls. The sidebar remains sticky through all of them (it has a defined bottom boundary at the start of the gallery sections). The before/after section may contain multiple pairs — they stack vertically within the section, each full-bleed, separated by `mt-8`.

### Work has no before/after pairs at all

The before/after `WorkGallerySection` is not rendered (empty clusters list → early return). The page flows: hero + MDX + process grid (if any) + detail editorial (if any). No "empty state" message — the absence is invisible.

### MDX body is empty

`compileWorkMdx` returns a compiled empty fragment. `WorkProseSection` renders with no visible content. The `prose` wrapper has no content height. The page still has: breadcrumb + h1 + summary + meta + hero + gallery sections (if any) + tags. If the work also has no gallery images, the page shows only the hero image — which is valid for a minimal portfolio entry. No placeholder or "description coming soon" text should appear; the design intentionally supports image-only works.

---

## What NOT to do — red-line list

The following are explicitly rejected by this spec:

1. **No auto-playing carousel or auto-advance slideshow** — violates `motion.md` (no auto-loops). The user controls all navigation.
2. **No parallax on the hero image** — parallax requires `position: fixed` or `transform` on scroll, causes CLS, and is banned by `motion.md` (no scroll-jacking, no layout property animation).
3. **No masonry layout** — masonry requires JavaScript measurement or CSS `columns` which produces column-order (not row-order) reading sequence, breaks at narrow widths, and cannot guarantee stable CLS. The `detail-editorial` 3-column CSS grid with explicit `col-span` rules is the approved alternative.
4. **No overlay text on cover image** — title text over a photo fails contrast on light photos in all 4 themes, violates `accessibility.md` contrast requirement (4.5:1 ratio), and is fragile against light admin photo uploads. The title lives above or beside the image, never on top.
5. **No image hover zoom/scale effect** — `transform: scale()` on hover inside a constrained container causes content to overflow or be clipped unexpectedly. The approved hover state for images is `cursor-zoom-in` + lightbox (future Phase 5), not a CSS scale.
6. **No lazy section headings that create empty gaps** — every `WorkGallerySection` must return `null` (not an empty `<section>`) when its kind group is empty. An empty section with an eyebrow heading and no images is broken layout.
7. **No hardcoded hex values** — all colours use tokens (`bg-bg2`, `text-muted`, `border-line`, `bg-accent`). The `ink` dark theme must pass contrast checks. The meta sidebar background uses `bg-bg2`; the strip background on mobile uses `bg-bg2`.
8. **No `shadow-lg` or `shadow-2xl`** on gallery images — per `uxui.md § 5`, these shadows look dirty on warm-tone palettes. `rounded-2xl` on the hero and `rounded-lg` on gallery images provide separation without shadows.
9. **No `<img>` raw tags** — all images use `next/image` with explicit `sizes` attributes calibrated to the rendering slot (`"100vw"` for full-bleed, `"(max-width: 768px) 100vw, 896px"` for constrained).
10. **No sticky bottom bar or floating CTA** — this is an observation page, not a conversion page. A "start a project" CTA belongs in the footer of the entire site, not intruding on portfolio content.
11. **No font-serif in body text** — serif is restricted to h1 per `uxui.md § 2`. Section headings (`<h2>` eyebrow labels) use `font-sans text-xs uppercase tracking-widest text-muted`, not serif display.
12. **No `outline-none` on interactive elements** — `BeforeAfterCard` already has `focus-visible:ring-2 focus-visible:ring-ring`. Any new interactive element must maintain this pattern.

---

## Schema additions needed

None required for this redesign. All display logic derives from existing fields:

- `kind` enum: `before | after | process | detail` — drives section grouping
- `pairId`: identifies before/after pairs — already used by `WorkGallery`
- `sort`: determines image order within each kind group
- `asset.width` / `asset.height`: drives aspect ratio rules
- `caption`: displayed under sections or per-image where relevant
- `isCover`: excludes hero image from gallery sections

The only computation added is `getDetailColSpan(width, height)`, a pure client-side function — no DB changes.

---

## Copy

Section eyebrow labels (TH · EN):

| Section | TH label | EN label |
|---|---|---|
| Before/After | ก่อน/หลัง | Before & After |
| Process | กระบวนการ | Process |
| Details | รายละเอียด | Details |

Meta field labels (for sidebar and mobile strip):

| Field | TH label |
|---|---|
| roomType | ประเภทห้อง |
| style | สไตล์ |
| yearCompleted | ปีที่เสร็จ |
| location | สถานที่ |
| areaSqm | พื้นที่ (ตร.ม.) |
| budgetRange | งบประมาณ (บาท) |

These labels should move to `src/lib/i18n/labels.ts` per `i18n.md` — the page currently defines them as local `Record<string, string>` constants. The implementer should extract them during this work.

---

## A11y notes

- Single `<h1>` per page: the work title. Section eyebrow labels use `<h2>` (rendered inside `WorkGallerySection`). MDX body `h2`/`h3` continue the hierarchy. No level-skipping.
- `WorkMetaSidebar` uses `<dl>` / `<dt>` / `<dd>` for meta fields — screen readers announce these as definition lists.
- The mobile meta strip is `overflow-x-auto` — add `role="region"` and `aria-label="ข้อมูลโปรเจกต์"` so screen reader users know the scroll region's purpose.
- Hero image `alt`: the stored `asset.alt` field if non-empty, otherwise `work.title`. Never empty string for the LCP image — it carries content meaning.
- `BeforeAfterCard` already has full keyboard support (slider: `role="slider"` + Arrow keys; toggle: `aria-pressed`). Do not break this in the wrapper.
- Focus order: skip link → logo → nav → breadcrumb → h1 → meta → hero (tab-stops on `BeforeAfterSlider`) → prose → gallery section interactives → tags.
- The sidebar on desktop is `aria-label="ข้อมูลโปรเจกต์"` as a `<aside>` landmark — distinct from the main `<article>` content.
- Process grid images are decorative in the sense that they have descriptive alts from `asset.alt`; if `asset.alt` is empty, fall back to `"ภาพกระบวนการ — {work.title}"`. Never `alt=""` for non-decorative images.

---

## Typography & spacing choices

- h1: `font-serif text-4xl md:text-5xl font-bold tracking-tight`
- Summary lead: `text-base md:text-lg text-muted max-w-prose`
- Section eyebrow: `text-xs uppercase tracking-widest text-muted font-sans`
- Sidebar meta label (`<dt>`): `text-xs text-muted`
- Sidebar meta value (`<dd>`): `text-sm text-ink font-medium`
- Page outer wrapper: `max-w-7xl mx-auto px-4 md:px-6`
- Two-column zone: `grid grid-cols-1 md:grid-cols-[1fr_16rem] gap-12 max-w-5xl`
- Gallery sections: full-width within the `max-w-7xl` wrapper, `px-4 md:px-6`
- Prose body: `prose prose-stone dark:prose-invert max-w-prose`
- Section vertical rhythm: `mt-12 md:mt-16` between sections
- Sidebar: `sticky top-24 self-start`

---

## Color usage

| Token | Used where |
|---|---|
| `bg-bg` | page background |
| `bg-bg2` | meta strip (mobile), sidebar background, tag pills |
| `bg-card` | (not used on this page — no card components) |
| `text-ink` | h1, meta values, tag text |
| `text-muted` | summary, meta labels, eyebrow section labels, captions, breadcrumb |
| `border-line` | sidebar top/bottom rule, `<Separator>` between sections if used |
| `text-accent` | (not used — no CTA on this page) |

All 4 themes: peach and cream use warm off-white `bg-bg`; sage uses cool off-white; ink uses dark. The `prose-stone` class in MDX body may need a `dark:prose-invert` companion for the ink theme — this is already in the current implementation (`dark:prose-invert`).

---

## Hand-off

- **Implementer:** fe-public — route `src/app/(public)/works/[slug]/page.tsx` + `src/components/public/work/`
- **Suggested skills to reference:** `component-anatomy`, `motion-patterns`, `page-states`, `a11y-review`
- **Open questions:**
  1. The meta labels (`ROOM_TYPE_LABELS_TH`, `BUDGET_LABELS_TH`) currently live as local constants in `page.tsx`. This spec assumes they are extracted to `src/lib/i18n/labels.ts` during implementation. Confirm with be-data whether the label maps should live in i18n or in a domain-specific util.
  2. Lightbox for gallery images (tap `cursor-zoom-in` → fullscreen) is referenced in `uxui.md §7` as "Phase 5 — yet-another-react-lightbox if needed." This spec does not include a lightbox. If the product wants it on this page, that should be a separate task.
  3. The sidebar sticky bottom boundary depends on knowing the height of the gallery sections. The proposed CSS approach (`self-start` on a flex/grid parent) handles this without JavaScript. Verify browser support for `sticky` + `self-start` pattern on the target minimum browser matrix.
  4. If a work has 0 meta fields and 0 tags, the sidebar renders nothing. The two-column grid should collapse to single-column when the sidebar is empty. This logic belongs in `WorkMetaSidebar` (return null when all props are null) and the page should conditionally apply the two-column grid class.
