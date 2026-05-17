# Design spec — Blog post detail + listing (`/blog/[slug]` + `/blog`)

> Implementer: **fe-public**
> Routes: `src/app/(public)/blog/[slug]/page.tsx` · `src/app/(public)/blog/page.tsx`
> Source translated from: `blogpostfe.md` (Vue/PNA red-brand spec)
> All hex references below appear **only** in the token-mapping table (§3). Every other
> color reference uses CSS var aliases per `stack.md` § Theme tokens.

---

## 1. Purpose

Give a reader who arrived from search or social the full text of a blog post in a calm,
typographically readable environment, with ambient discovery affordances (TOC, sidebar
recent posts, related section) that do not compete with the reading experience.

Brand-feel check (uxui.md §1): evoke **intimate** + **editorial** — the feeling of reading
a well-printed magazine rather than a marketing landing page. Remove everything that feels
"hyper" from the source spec.

---

## 2. Audience & device

- Primary: mobile (390×844) — reader following an IG link or Google result
- Secondary: desktop (≥1024px) — longer reading sessions with sidebar

---

## 3. Token mapping table

Every hex from `blogpostfe.md` mapped to project tokens. Verify marked cells in all
4 presets (peach/cream/sage/ink) against WCAG 2.1 AA at the listed usage.

| Source hex | Semantic role | CSS var | Tailwind alias | Contrast verification needed |
|---|---|---|---|---|
| `#fdfdfc` (page bg) | page background | `var(--bg)` | `bg-bg` | — (background, no text on it directly) |
| `#fafafa` (related bg) | alternating section bg | `var(--bg2)` | `bg-bg2` | — |
| `#ffffff` (card) | card surface | `var(--brand-card)` | `bg-brand-card` | Check ink preset: brand-card = `#252220` — dark surface, ensure text-ink on it is still ≥4.5:1 (it is: ink preset `--ink` = `#f5f0e8`, passes) |
| `#1a1a1a` (text) | body text | `var(--ink)` | `text-ink` | All presets: ink-on-bg ≥ 16:1. No issue. |
| `#2a2a2a` (prose body text) | article body text | `var(--ink)` | `text-ink` | Same as above. Use single token; no separate token needed. |
| `#6b7280` / `#4b5563` / `#9ca3af` (muted variants) | secondary/meta text | `var(--muted-brand)` | `text-muted-brand` | **Flag for sage+ink**: verify muted-brand on bg2 ≥ 4.5:1 for body use. Sage: `#6b6560` on `#e6e9dd` = ~5.2:1 OK. Ink: `#a8a29a` on `#252220` = ~4.6:1 OK. |
| `#f1f1f0` (borders/lines) | dividers, card borders | `var(--line)` | `border-line` | — (not text) |
| `#ef4235` (brand red — primary accent) | CTA, active, brand emphasis | `var(--brand-accent)` | `text-brand-accent` / `bg-brand-accent` | **Critical**: brand-accent varies by preset. As text-on-bg: peach `#b89b7a` on `#faf7f2` = ~2.8:1 — FAILS 4.5:1 for body text. **Rule: use `text-brand-accent` only on large text (≥18px or ≥14px bold), icon only, or hover state only. Never as default small body text color.** For h2 left-bar pseudo-element = decorative (non-text) — no contrast req. TOC active link uses `text-brand-accent` at 14px/bold — check: peach 2.8:1 FAILS. Use `text-ink font-semibold` for active state instead of color change alone. |
| `#c8361d` (red dark hover) | hover/pressed accent | Not a separate token — hover is `text-brand-accent` on interactive elements. Use Tailwind `hover:opacity-80` or `hover:text-brand-accent/80` on brand-accent surfaces. | — | — |
| `#ff6b35` / `#ff8c00` (orange gradient) | decorative gradient (source only — dropped) | DROPPED — no gradient decoration per locked decision #4 | — | — |
| `#e5e7eb` / `#d1d5db` (light borders) | fine border, muted line | `var(--line)` | `border-line` | — |
| `#f3f4f6` (skeleton bg) | image placeholder bg | `var(--bg2)` | `bg-bg2` | — |
| `#1877f2` (Facebook) | social brand color (share button hover) | Keep hardcoded in ShareRow only — social brand colors are fixed, not theme tokens. Scope: one component, hover state only. | — | — |
| `#06c755` (LINE) | social brand color | Same exception as Facebook — hover only in ShareRow. | — | — |
| `#000000` (X/Twitter) | social brand color | Same exception. | — | — |

**New token needed:** None. All roles covered by existing 7 tokens (`--bg`, `--bg2`,
`--brand-card`, `--ink`, `--muted-brand`, `--line`, `--brand-accent`).

---

## 4. ASCII mockup — detail page desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ReadingProgress (fixed top, 3px, bg-brand-accent, scaleX 0→1)        │
├──────────────────────────────────────────────────────────────────────┤
│ [AppHeader — reuse existing]                                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────── HERO (bg-bg, pt-16 pb-8) ───────────┐  │
│  │  max-w-6xl mx-auto px-6                                         │  │
│  │                                                                 │  │
│  │  <PostBreadcrumb>                                               │  │
│  │  Home · หน้าแรก  /  Journal · บทความ  /  [tag name]            │  │
│  │  text-sm text-muted-brand                                       │  │
│  │                                                                 │  │
│  │  <PostMetaRow>                                                  │  │
│  │  [tag chip: pill bg-bg2 text-brand-accent text-xs font-bold]   │  │
│  │    ·  [Calendar icon 16] 15 ม.ค. 2569  ·  [Clock icon 16] 5 นาที │
│  │                                                                 │  │
│  │  <h1 class="font-serif text-4xl md:text-5xl font-bold          │  │
│  │         tracking-tight text-ink leading-[1.2]                  │  │
│  │         text-wrap:balance max-w-3xl">                          │  │
│  │    ชื่อบทความที่สวยงามและน่าสนใจ                                  │  │
│  │  </h1>                                                         │  │
│  │                                                                 │  │
│  │  <p class="text-lg text-muted-brand leading-relaxed            │  │
│  │       max-w-2xl mt-4 mb-8">                                    │  │
│  │    Excerpt / lead paragraph สองบรรทัด                           │  │
│  │  </p>                                                          │  │
│  │                                                                 │  │
│  │  ┌─ cover image (aspect-[16/9], rounded-2xl, overflow-hidden) ┐│  │
│  │  │  <Image priority object-cover w-full>                       ││  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─── BODY GRID (max-w-6xl mx-auto px-6, pt-12 pb-24) ────────────┐  │
│  │  grid grid-cols-[1fr_320px] gap-16 items-start                 │  │
│  │                                                                 │  │
│  │  ┌── MAIN (min-w-0) ─────────────┐  ┌── SIDEBAR (sticky) ───┐ │  │
│  │  │                               │  │  top-[6.5rem]         │ │  │
│  │  │  <article class="prose-post   │  │  flex flex-col gap-4  │ │  │
│  │  │    max-w-none">               │  │  max-h-[calc(          │ │  │
│  │  │                               │  │   100vh-7rem)]        │ │  │
│  │  │  h2 with left bar (accent)    │  │  min-h-0              │ │  │
│  │  │  ─────────────────────────    │  │                       │ │  │
│  │  │  paragraph text-base          │  │  ┌─ TableOfContents ─┐│ │  │
│  │  │  leading-[1.85]               │  │  │ collapsed 200px   ││ │  │
│  │  │                               │  │  │ expandable        ││ │  │
│  │  │  h3 text-2xl                  │  │  └───────────────────┘│ │  │
│  │  │                               │  │                       │ │  │
│  │  │  blockquote left-border       │  │  ┌─ CtaCard ─────────┐│ │  │
│  │  │  (brand-accent, bg-bg2)       │  │  │ dark ink preset   ││ │  │
│  │  │                               │  │  │ "เริ่มโปรเจกต์"   ││ │  │
│  │  │  img rounded-2xl              │  │  └───────────────────┘│ │  │
│  │  │                               │  │                       │ │  │
│  │  │  code inline bg-bg2           │  │  ┌─ RecentPostsCard ─┐│ │  │
│  │  │  pre bg-ink text-bg           │  │  │ 4 mini post rows  ││ │  │
│  │  │                               │  │  └───────────────────┘│ │  │
│  │  │  ul/ol marker text-accent     │  └───────────────────────┘ │  │
│  │  │                               │                            │  │
│  │  │  table border-line            │                            │  │
│  │  │                               │                            │  │
│  │  │  hr (line fade)               │                            │  │
│  │  │                               │                            │  │
│  │  │  </article>                   │                            │  │
│  │  │                               │                            │  │
│  │  │  <PostFooter>                 │                            │  │
│  │  │  ─ border-t border-line       │                            │  │
│  │  │  ─ <ShareRow>                 │                            │  │
│  │  │    [Share icon] แชร์          │                            │  │
│  │  │    [FB] [X] [LINE] [Copy]     │                            │  │
│  │  │  ─ <BackLink>                 │                            │  │
│  │  │    ← กลับไปบทความทั้งหมด       │                            │  │
│  │  └───────────────────────────────┘                            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─── RELATED POSTS (bg-bg2, border-t border-line, py-16) ────────┐  │
│  │  max-w-6xl mx-auto px-6                                         │  │
│  │  <h2 text-3xl font-bold text-ink text-center mb-10>            │  │
│  │    บทความที่คุณอาจสนใจ                                           │  │
│  │  </h2>                                                         │  │
│  │  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6          │  │
│  │  [PostCard related] [PostCard related] [PostCard related]       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  [AppFooter — reuse existing]                                         │
│                                                                       │
│  [BackToTop FAB — fixed bottom-6 right-6]                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. ASCII mockup — detail page mobile (390px)

```
┌───────────────────────────┐
│ ReadingProgress (fixed 3px)│
├───────────────────────────┤
│ [AppHeader top bar]        │  64px
├───────────────────────────┤
│                            │
│  HERO  pt-10 pb-6 px-4    │
│                            │
│  Home / บทความ / [tag]    │  text-xs text-muted-brand
│                            │
│  [tag chip] · 15 ม.ค. ·   │  text-xs
│  5 นาที                    │
│                            │
│  ชื่อบทความที่ยาวขึ้น      │  font-serif text-4xl font-bold
│  อาจสองบรรทัด             │  text-wrap:balance
│                            │
│  Excerpt สั้น ๆ อธิบาย    │  text-base text-muted-brand
│  เนื้อหา                   │
│                            │
│ ┌──────────────────────┐  │
│ │  cover image         │  │  aspect-[16/9] rounded-2xl
│ │  16:9, rounded-2xl   │  │  (uxui.md §7: post cover = 16:9)
│ └──────────────────────┘  │
│                            │
│  MAIN CONTENT  px-4 pt-8  │
│                            │
│  ── TABLE OF CONTENTS ──  │  inline, below hero
│  [ListTree icon] สารบัญ   │  side-card style, full-width
│  [3 items] [chevron]       │  max-h-[60vh] overflow-y-auto
│  (collapsed by default)    │
│  H2 item 1                 │
│    H3 sub-item             │
│  H2 item 2                 │
│  ──────────────────────── │
│                            │
│  <article prose-post>     │
│                            │
│  ## Heading 2              │  h2 with left accent bar
│  paragraph text            │  text-base leading-[1.85]
│  inline `code` bg-bg2     │
│                            │
│  > blockquote              │  border-l-4 brand-accent
│                            │
│  ```code block```          │  bg-ink text-bg rounded-xl
│                            │
│  </article>                │
│                            │
│  ── SHARE ROW ──           │  mt-14 border-t border-line pt-8
│  [Share icon] แชร์บทความ  │  column layout mobile
│  [FB] [X] [LINE] [Copy]   │  flex-wrap gap-2
│  ← กลับบทความทั้งหมด      │
│                            │
│  ── CTA CARD ──            │  mt-8 (sidebar items reflow below)
│  [ink preset dark card]    │  max-w-none, full width
│                            │
│  ── RECENT POSTS ──        │
│  [mini post row ×4]        │
│                            │
│  ── RELATED SECTION ──     │  bg-bg2, py-12
│  บทความที่คุณอาจสนใจ       │
│  [PostCard]                │  single column
│  [PostCard]                │
│  [PostCard]                │
│                            │
│ [AppFooter]                │
├───────────────────────────┤
│ [Bottom tab bar]           │  sticky, safe-area-inset-bottom
└───────────────────────────┘
[BackToTop FAB bottom-5 right-4]  44×44px, hidden until 15% scroll
```

---

## 6. ASCII mockup — listing page `/blog` (desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [AppHeader]                                                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─── PAGE HEADER (max-w-6xl mx-auto px-6, py-12) ────────────────┐  │
│  │  <h1 class="text-4xl font-bold font-serif text-ink">           │  │
│  │    บทความ · Journal                                             │  │
│  │  </h1>                                                         │  │
│  │  <p class="text-lg text-muted-brand mt-2">                     │  │
│  │    แรงบันดาลใจ เทคนิค และเรื่องราวเบื้องหลัง house-peach        │  │
│  │  </p>                                                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─── TAG FILTER BAR (sticky top-[var(--header-h)] z-10) ─────────┐  │
│  │  bg-bg/80 backdrop-blur-sm border-b border-line                 │  │
│  │  max-w-6xl mx-auto px-6 py-3                                   │  │
│  │  flex gap-2 overflow-x-auto scrollbar-none                     │  │
│  │  [chip: ทั้งหมด ●]  [chip: ตกแต่ง]  [chip: DIY]               │  │
│  │  [chip: Japandi]   [chip: ห้องนอน]  [chip: งบน้อย]            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─── POST GRID (max-w-6xl mx-auto px-6, py-8) ───────────────────┐  │
│  │  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 │  │
│  │                                                                 │  │
│  │  [PostCard]         [PostCard]         [PostCard]               │  │
│  │  aspect-[16/10]     aspect-[16/10]     aspect-[16/10]           │  │
│  │  cover rounded-md   cover rounded-md   cover rounded-md         │  │
│  │  tag chip           tag chip           tag chip                  │  │
│  │  Title 2 lines      Title 2 lines      Title 2 lines             │  │
│  │  Excerpt 2 lines    Excerpt 2 lines    Excerpt 2 lines           │  │
│  │  date · time · by   date · time · by   date · time · by         │  │
│  │                                                                 │  │
│  │  [PostCard]         [PostCard]         [PostCard]               │  │
│  │  ...                ...                ...                       │  │
│  │                                                                 │  │
│  │  ─────────────────────────────────────────────────────────     │  │
│  │  [← Prev]           Page 1 of 4        [Next →]                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  [AppFooter]                                                          │
└──────────────────────────────────────────────────────────────────────┘
```

Listing mobile (390px): single column, tag filter scrolls horizontally, pagination is
"โหลดเพิ่ม" button (preferred for mobile) or numbered (admin config — default numbered).

---

## 7. Component breakdown

### Naming note

All blog components live in `src/components/public/blog/` (new subfolder — mirrors the
`src/components/public/work/` pattern already established).

### 7.1 `PostBreadcrumb`

| | |
|---|---|
| **File** | `src/components/public/blog/PostBreadcrumb.tsx` |
| **RSC/client** | RSC |
| **Shadcn used** | None — semantic `<nav>` with `<ol>` is sufficient; Radix `NavigationMenu` is overkill for breadcrumb |
| **Key Tailwind** | `flex items-center gap-2 flex-wrap text-sm text-muted-brand` |

```ts
type Props = {
  category?: { name: string; slug: string };
};
```

Renders: Home / บทความ / [category name (if present)].
Separator: `/` with `aria-hidden`, chevron-right icon optional.
Current page: `aria-current="page"` on last `<li>`, styled `text-ink font-semibold`.
JSON-LD BreadcrumbList is separate (in `generateMetadata` via `lib/seo/jsonld.ts`).

### 7.2 `PostMetaRow`

| | |
|---|---|
| **File** | `src/components/public/blog/PostMetaRow.tsx` |
| **RSC/client** | RSC |
| **Shadcn used** | `<Badge>` from `components/ui/badge.tsx` for tag chip |
| **Key Tailwind** | `flex items-center gap-3 flex-wrap text-xs text-muted-brand` |

```ts
type Props = {
  publishedAt: Date;
  readingTimeMin: number;
  author: { name: string };
  tags: { name: string; slug: string }[];
};
```

Tag chip: `<Badge variant="secondary">` — styled as pill via `rounded-full px-3`.
Date: `Intl.DateTimeFormat('th-TH', { dateStyle: 'long' })` — shows พ.ศ. year.
Reading time: from `labels.readingMinutes` (e.g., "5 นาที").
Icons: `Calendar size={14}`, `Clock size={14}` from lucide-react, `aria-hidden`.
Author: `User size={14}` + name, from `labels.byAuthor`.

### 7.3 `PostHero`

| | |
|---|---|
| **File** | `src/components/public/blog/PostHero.tsx` |
| **RSC/client** | RSC |
| **Shadcn used** | None |
| **Key Tailwind** | `bg-bg pt-16 pb-8 md:pt-20 md:pb-12` |

```ts
type Props = {
  post: {
    title: string;
    excerpt: string;
    coverPath: string | null;
    coverAlt: string | null;
    publishedAt: Date;
    readingTimeMin: number;
    author: { name: string };
    tags: { name: string; slug: string }[];
  };
};
```

Children order: `<PostBreadcrumb>` → `<PostMetaRow>` → `<h1>` → `<p>` (excerpt) → cover image.
Cover image: `<Image priority fill className="object-cover">`  wrapped in
`aspect-[16/9] overflow-hidden rounded-2xl` container.
No decorative blobs (locked decision #4).
Hero max-width: `max-w-3xl mx-auto` for text; cover image breaks to `max-w-6xl mx-auto`.

### 7.4 `PostContent`

| | |
|---|---|
| **File** | `src/components/public/blog/PostContent.tsx` |
| **RSC/client** | RSC |
| **Shadcn used** | None — wraps compiled MDX |
| **Key Tailwind** | `prose-post max-w-none` (prose-post is the custom CSS namespace, §11) |

```ts
type Props = {
  compiledMdx: React.ReactNode;  // output of compileWorkMdx / baseMdxComponents
};
```

Renders the MDX node directly — does NOT use `dangerouslySetInnerHTML`. Per locked
decision #3, content flows through `compileMdx` + `baseMdxComponents` whitelist.
The wrapper `<article>` carries `id="post-content"` for the skip-link target.

### 7.5 `PostCard` (variants: `default | compact | related`)

| | |
|---|---|
| **File** | `src/components/public/blog/PostCard.tsx` |
| **RSC/client** | RSC |
| **Shadcn used** | `<Badge>` for tag chip |
| **Key Tailwind** | see per-variant below |

```ts
export type PostCardPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date;
  readingTimeMin: number;
  author: { name: string };
  tags: { name: string; slug: string }[];
  coverPath: string | null;
  coverAlt: string | null;
};

type Props = {
  post: PostCardPost;
  variant?: 'default' | 'compact' | 'related';
  priority?: boolean;
};
```

**`default` variant** — listing grid card:
```
cover (aspect-[16/10] rounded-md object-cover)
p-4 space-y-2:
  tag chip (Badge secondary rounded-full)
  title (text-xl font-semibold text-ink line-clamp-2)
  excerpt (text-sm text-muted-brand line-clamp-2)
  meta row (text-xs text-muted-brand: date · reading time · author)
```
Hover: `hover:-translate-y-0.5 transition-transform hover:shadow-sm` (Tailwind, no motion lib).

**`compact` variant** — sidebar recent posts mini-row:
```
flex gap-3 items-start:
  thumb (60×60 rounded-xl object-cover flex-shrink-0)
  info:
    h5 (text-sm font-semibold text-ink line-clamp-2)
    span (text-xs text-muted-brand: date)
```
Wrap in `<Link>` with `hover:bg-bg2 rounded-xl p-2 -mx-2 transition-colors`.

**`related` variant** — related section card (= `default` but with full excerpt visible,
max 2 lines clamp, and `rounded-2xl` card border):
```
bg-brand-card border border-line rounded-2xl overflow-hidden
  cover (aspect-[16/10] rounded-none — overflow-hidden on parent clips)
  p-5 space-y-2:
    cat chip (text-xs font-bold text-brand-accent uppercase tracking-widest)
    h3 (text-lg font-semibold text-ink line-clamp-2)
    excerpt (text-sm text-muted-brand line-clamp-2)
    date (text-xs text-muted-brand flex items-center gap-1)
```
Hover: `group-hover:-translate-y-0.5 transition-transform`.

**Justification for custom**: `PostCard` is domain-specific (blog listing data shape,
bilingual date, reading time, tag chips). shadcn `<Card>` is used as inspiration for
surface tokens but the full component requires domain-specific props.

### 7.6 `TableOfContents`

| | |
|---|---|
| **File** | `src/components/public/blog/TableOfContents.tsx` |
| **RSC/client** | Client (`'use client'` — scroll-spy via `IntersectionObserver`, expand toggle) |
| **Shadcn used** | None required — custom collapsible; NOT shadcn Accordion because the sidebar collapse is not a standard accordion pattern (it also does scroll-spy). Using Radix Collapsible (`@radix-ui/react-collapsible`) would be acceptable if fe-public prefers: `npx shadcn@latest add collapsible`. Decision left to implementer. |
| **Key Tailwind** | `bg-brand-card border border-line rounded-xl p-5` (SideCard base) |

```ts
export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
  children?: TocHeading[];
};

type Props = {
  headings: TocHeading[];
  /** Desktop: collapsible with 200px collapsed height.
   *  Mobile (< lg): inline, max-height 60vh, no collapse toggle. */
};
```

Desktop behavior:
- Default: collapsed — `max-h-[200px] overflow-hidden` with fade bottom gradient.
- Expanded: `max-h-[calc(100vh-8rem)]` + `overflow-y-auto`.
- Toggle trigger: `<button>` with `aria-expanded`, `aria-controls`.
- Expand chevron: `ChevronDown size={18}` rotates 180deg on expand.

Mobile behavior (< `lg`): inline below hero, no collapse. Max-height `max-h-[60vh]`
with overflow-y-auto. Chevron hidden. Per locked decision #6.

Scroll-spy: `IntersectionObserver` on all heading anchor elements. Active state:
heading anchor (h2) gets `text-ink font-semibold`. Bullet dot gets
`bg-brand-accent` border-color. h3 sub-item active: `text-ink font-semibold bg-bg2 rounded`.
**Do not use `text-brand-accent` for active state text** — contrast fails on peach/cream/sage
at small sizes (see §3 token table).

Left rail: `2px` vertical line, `bg-line`. Active portion driven by progress ratio
via `style.height` (server-set initial = "0%"; JS updates). This is a `<div>` positioned
absolute inside scroll container — not animated with motion lib (it's scroll-linked CSS).

### 7.7 `ShareRow`

| | |
|---|---|
| **File** | `src/components/public/blog/ShareRow.tsx` |
| **RSC/client** | Client (`'use client'` — clipboard API, navigator.share) |
| **Shadcn used** | `<Button variant="outline" size="sm">` for share buttons |
| **Key Tailwind** | `flex flex-wrap gap-2 items-center` |

```ts
type Props = {
  slug: string;
  title: string;
};
```

Share label: "แชร์บทความ" with `Share2 size={16}` icon. Not a button — it is a `<span>` label.
Buttons: Facebook, X, LINE, Copy link. Each is `<Button variant="outline" size="sm" className="rounded-full">`.
Icons: `Facebook size={16}`, `Twitter size={16}`, custom LINE text mark, `Link2 size={16}` / `Check size={16}`.
Copy state: when copied, button shows `Check size={16}` + text "คัดลอกแล้ว" — auto-reset after 2000ms.
Social brand hover colors are hardcoded per §3 exception: Facebook `hover:bg-[#1877f2]`,
X `hover:bg-black`, LINE `hover:bg-[#06c755]`. These are hover-only and not required to
pass contrast (hover state is exempt from WCAG contrast requirement).

### 7.8 `SideCard`

| | |
|---|---|
| **File** | `src/components/public/blog/SideCard.tsx` |
| **RSC/client** | RSC (wrapper only) |
| **Shadcn used** | Conceptually matches `<Card>` — but uses raw div with tokens to match the sidebar aesthetic |
| **Key Tailwind** | `bg-brand-card border border-line rounded-xl p-5` |

```ts
type Props = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};
```

Title row: `flex items-center gap-2 text-sm font-semibold text-ink mb-4`.
Icon slot: receives lucide icon at `size={18} className="text-brand-accent"`.
Children: anything (TOC list, CTA content, mini-posts list).

### 7.9 `CtaCard`

| | |
|---|---|
| **File** | `src/components/public/blog/CtaCard.tsx` |
| **RSC/client** | RSC |
| **Shadcn used** | `<Button>` for CTA link |
| **Key Tailwind** | `data-theme="ink"` wrapper + `bg-bg rounded-xl p-6` inside |

```ts
type Props = {
  statProjects?: number;
  statYears?: number;
};
// Both optional — fall back to copy without stats if not provided.
```

Wraps in `<div data-theme="ink">` per locked decision #5. Inside that wrapper all tokens
resolve to ink preset: bg-bg becomes `#1a1714`, text-ink becomes `#f5f0e8`, etc.

Content stack:
```
[Sparkles icon 32 text-brand-accent]
kicker: text-xs uppercase tracking-widest text-muted-brand "บริการตกแต่งบ้าน"
title: text-lg font-bold text-ink leading-snug "พร้อมเปลี่ยน ห้องของคุณ?"
desc: text-sm text-muted-brand leading-relaxed "ทีมเราพร้อมรับฟัง..."
<Button asChild variant="secondary" className="w-full rounded-full mt-4">
  <Link href="/contact">เริ่มบทสนทนา</Link>
</Button>
stats row (optional): border-t border-line mt-4 pt-4 flex justify-center gap-6
```

No animated glow / no sparkle animation — dropped per motion.md "Banned: decorative motion
(auto-playing loops)". The original `ctaGlow` 6s loop and `sparkle` 2.5s icon animation
are both banned categories.

### 7.10 `RecentPostsCard`

| | |
|---|---|
| **File** | `src/components/public/blog/RecentPostsCard.tsx` |
| **RSC/client** | RSC |
| **Shadcn used** | None |
| **Key Tailwind** | Uses `<SideCard>` as container |

```ts
type Props = {
  posts: PostCardPost[];  // max 4 items
};
```

Renders `<SideCard title={labels.recentPosts.th} icon={<TrendingUp size={18} />}>`.
Inside: list of `<PostCard variant="compact">` items.
Thumbnail fallback (no cover): `<div className="bg-bg2 rounded-xl w-[60px] h-[60px] flex items-center justify-center"><FileText size={22} className="text-muted-brand" /></div>`.

### 7.11 `RelatedPostsSection`

| | |
|---|---|
| **File** | `src/components/public/blog/RelatedPostsSection.tsx` |
| **RSC/client** | RSC |
| **Shadcn used** | None |
| **Key Tailwind** | `bg-bg2 border-t border-line py-16` |

```ts
type Props = {
  posts: PostCardPost[];  // 2–3 items
};
```

Returns null if `posts.length === 0`.
Heading: `<h2 className="text-3xl font-bold font-serif text-ink text-center">บทความที่คุณอาจสนใจ</h2>`.
Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.
Cards: `<PostCard variant="related">`.
`<Stagger>` wrapper if ≤ 3 cards (per motion.md — stagger > 6 items total > 0.5s banned).

### 7.12 `PostFooter`

| | |
|---|---|
| **File** | `src/components/public/blog/PostFooter.tsx` |
| **RSC/client** | RSC (ShareRow is client — import it here) |
| **Shadcn used** | None (separator is `border-t`) |
| **Key Tailwind** | `mt-14 pt-8 border-t border-line space-y-6` |

Contains `<ShareRow>` + back link.
Back link: `<Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-brand hover:text-ink transition-colors"><ArrowLeft size={16} />กลับบทความทั้งหมด</Link>`.

### 7.13 `ReadingProgress`

| | |
|---|---|
| **File** | `src/components/motion/ReadingProgress.tsx` |
| **RSC/client** | Client (`'use client'`) |
| **Shadcn used** | None |
| **Key Tailwind** | `fixed top-0 left-0 w-full h-[3px] z-50 origin-left bg-brand-accent` |

```ts
// No props — reads window scroll directly.
```

Lives in `components/motion/` because it is a scroll-motion primitive (per motion.md).
Uses `useScroll` + `useTransform` from `motion/react`. See §9 motion spec.

### 7.14 `BackToTop`

| | |
|---|---|
| **File** | `src/components/public/blog/BackToTop.tsx` |
| **RSC/client** | Client (`'use client'`) |
| **Shadcn used** | `<Button variant="ghost" size="icon">` as base |
| **Key Tailwind** | `fixed bottom-6 right-6 z-50 size-11 rounded-full bg-ink text-bg shadow-md` |

```ts
// No props.
```

Visibility: appears when reading progress > 15%. Uses `useScroll` → `scrollYProgress`
(same motion value computed in ReadingProgress can be shared via context — see open
questions).
Hover: `hover:bg-brand-accent` transition.
Mobile: `bottom-20 right-4` (above bottom tab bar, avoids safe-area overlap).
A11y: `aria-label={labels.backToTop.th}`.
Mobile tap target: `size-11` = 44×44px ✓.

---

## 8. State matrix — 4 interactive components

### 8.1 `TableOfContents`

| State | Visual |
|---|---|
| **collapsed** (desktop default) | `max-h-[200px] overflow-hidden`. Bottom fade gradient `bg-gradient-to-t from-brand-card`. Chevron points down. |
| **expanded** (desktop) | `max-h-[calc(100vh-8rem)] overflow-y-auto`. Chevron rotates 180deg. Other sidebar cards get `opacity-50 pointer-events-none` (subtle fade — NOT full invisible as in source, which is too disorienting). |
| **active-section** (h2) | Bullet dot: `border-brand-accent bg-brand-accent`. Link: `text-ink font-semibold`. h3 sub-list: visible (`max-h-[800px] opacity-100`). |
| **has-active-child** (h2 parent when h3 active) | Same as active-section for bullet. Link: `text-ink font-medium`. |
| **h3 active** | Link: `text-ink font-semibold bg-bg2 rounded px-2`. Connector dash: `bg-brand-accent w-2.5`. |
| **focus-visible** (any TOC link) | `ring-2 ring-brand-accent ring-offset-2 ring-offset-brand-card rounded` |
| **hover** (link, desktop) | `bg-bg2 text-ink rounded` |
| **mobile / ≥lg hidden chevron** | Chevron `hidden lg:inline-flex`. Toggle button: `cursor-default` on mobile (non-interactive visual). |
| **empty** | If headings array is empty → return null (no card rendered). |

### 8.2 `ShareRow`

| State | Visual |
|---|---|
| **default** | All buttons: `<Button variant="outline" size="sm" className="rounded-full">` with icon + text. |
| **hover (desktop)** | Facebook: `hover:bg-[#1877f2] hover:text-white hover:border-[#1877f2]`. X: `hover:bg-black hover:text-white hover:border-black`. LINE: `hover:bg-[#06c755] hover:text-white hover:border-[#06c755]`. Copy: `hover:bg-bg2`. |
| **copied** | Copy button: icon swaps `Link2 → Check`, label swaps "คัดลอก → คัดลอกแล้ว". Button: `bg-bg2 border-line`. Auto-reset after 2000ms. No color change to brand-accent (contrast risk at small size). |
| **sharing** (navigator.share active) | Share button: `aria-busy="true"` + `<Spinner size={14}>`. |
| **focus-visible** (any button) | `ring-2 ring-brand-accent ring-offset-2 rounded-full` |

### 8.3 `BackToTop`

| State | Visual |
|---|---|
| **hidden** (scrollY ≤ 15% of page) | `opacity-0 pointer-events-none scale-90` |
| **visible** (scrollY > 15%) | `opacity-100 pointer-events-auto scale-100`. Transition: opacity + scale 0.2s ease-out. Reduced-motion: instant show (no transition). |
| **hover (desktop)** | `hover:bg-brand-accent` — button background shifts to accent. |
| **active** | `active:scale-95` |
| **focus-visible** | `ring-2 ring-brand-accent ring-offset-2 ring-offset-bg` |

### 8.4 `ReadingProgress`

| State | Visual |
|---|---|
| **0%** | `scaleX(0)` — bar invisible (origin-left). |
| **0%–100%** | `scaleX` driven by `useTransform(scrollYProgress, [0,1], [0,1])`. Linear mapping — no easing (per §9). |
| **100%** | `scaleX(1)` — full width. |
| **reduced-motion** | Bar rendered as static full-width with `opacity-40` to indicate it cannot animate. (`if (reduce) return <div className="fixed top-0 left-0 w-full h-[3px] z-50 bg-brand-accent opacity-40" />`) |
| **above header** | `z-50` — always on top of `<AppHeader>`. |

---

## 9. Motion spec

All animations: transform/opacity only. Duration ≤ 0.5s. `useReducedMotion()` checked
at every call site. No auto-playing loops. No page-level transitions.

### 9.1 `ReadingProgress` — `components/motion/ReadingProgress.tsx`

```ts
'use client';
import { useScroll, useTransform, useReducedMotion } from 'motion/react';
import { motion } from 'motion/react';

export function ReadingProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (reduce) {
    // Static fill at 40% opacity — indicates scroll position without motion
    return (
      <div
        className="fixed top-0 left-0 w-full h-[3px] z-50 bg-brand-accent opacity-40"
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.div
      className="fixed top-0 left-0 w-full h-[3px] z-50 origin-left bg-brand-accent"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
  // transition is NOT set — useTransform is scroll-linked (0.1s CSS transition
  // from source spec is removed; motion/react scroll-linked values update on
  // every frame without additional easing).
}
```

### 9.2 `TableOfContents` expand — CSS transition (not motion lib)

Collapse/expand uses CSS `max-height` transition — no `motion/react` needed here
because it is a simple height toggle with `overflow: hidden`, not a `transform`.

```css
/* In globals.css or prose-post namespace */
.toc-body {
  transition: max-height 0.25s cubic-bezier(.4,0,.2,1),
              opacity 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
  .toc-body {
    transition: none;
  }
}
```

The chevron rotation: `transition-transform duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)]`
via Tailwind. On reduced-motion: `motion-reduce:transition-none` Tailwind modifier.

### 9.3 `BackToTop` visibility

```ts
// In BackToTop.tsx
const { scrollYProgress } = useScroll();
const [visible, setVisible] = useState(false);
// Subscribe to scrollYProgress motion value imperatively (no re-render on scroll)
useEffect(() => {
  return scrollYProgress.on('change', (v) => setVisible(v > 0.15));
}, [scrollYProgress]);
```

Visual: `className={cn('transition-opacity transition-transform duration-200 ease-out', visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none')}`.
Reduced-motion: `motion-reduce:transition-none motion-reduce:scale-100` Tailwind modifiers
+ when reduce is true, always show (threshold: > 0.15 still controls visibility but without
animation — instant show/hide).

### 9.4 `FadeUp` on sections

`<RelatedPostsSection>` heading and grid use `<FadeUp>` (existing `components/motion/FadeUp.tsx`).
`<CtaCard>` uses `<FadeUp>` (mirrors WorkCTACard pattern — existing usage).
`<Stagger>` wraps `<PostCard related>` items (≤3 — safe per motion.md stagger rule).

### 9.5 Banned from this page

- No animated gradient/glow (dropped from CtaCard)
- No sparkle icon animation
- No hero radial blob animation
- No TOC progress-bar height animation via motion lib (CSS transition only)

---

## 10. Bilingual labels — additions to `src/lib/i18n/labels.ts`

Add the following keys to the `labels` object. Each key follows existing naming convention.
Add after the `projectInfo` entry.

```ts
// Blog post detail + listing labels — add to labels.ts

// Navigation / breadcrumb
breadcrumbBlog: { en: 'Journal', th: 'บทความ' },

// Post meta
byAuthor: { en: 'By', th: 'โดย' },
readingMinutes: { en: 'min read', th: 'นาที' },

// Sections
tableOfContents: { en: 'Table of contents', th: 'สารบัญ' },
sharePost: { en: 'Share this post', th: 'แชร์บทความ' },
copyLink: { en: 'Copy link', th: 'คัดลอกลิงก์' },
copySuccess: { en: 'Copied!', th: 'คัดลอกแล้ว' },
backToBlog: { en: 'Back to all posts', th: 'กลับบทความทั้งหมด' },
relatedPosts: { en: 'You might also like', th: 'บทความที่คุณอาจสนใจ' },
recentPosts: { en: 'Recent posts', th: 'บทความล่าสุด' },
readMore: { en: 'Read more', th: 'อ่านเพิ่มเติม' },
backToTop: { en: 'Back to top', th: 'กลับขึ้นด้านบน' },

// CTA card (sidebar)
ctaKicker: { en: 'Interior design service', th: 'บริการตกแต่งบ้าน' },
ctaTitle: { en: 'Ready to transform your space?', th: 'พร้อมเปลี่ยนห้องของคุณ?' },
ctaDesc: {
  en: 'Our team is ready to listen — no obligation.',
  th: 'ทีมเราพร้อมรับฟัง ไม่มีข้อผูกมัด',
},
ctaButton: { en: 'Start a conversation', th: 'เริ่มบทสนทนา' },

// Listing page
blogListingTitle: { en: 'Journal', th: 'บทความ' },
blogListingSubtitle: {
  en: 'Inspiration, techniques, and stories from house-peach',
  th: 'แรงบันดาลใจ เทคนิค และเรื่องราวเบื้องหลัง house-peach',
},
filterAll: { en: 'All', th: 'ทั้งหมด' },

// Share social labels (used in aria-labels)
shareToFacebook: { en: 'Share to Facebook', th: 'แชร์ไปยัง Facebook' },
shareToX: { en: 'Share to X', th: 'แชร์ไปยัง X' },
shareToLine: { en: 'Share to LINE', th: 'แชร์ไปยัง LINE' },
```

---

## 11. A11y notes per component

### Global page

- **Skip link**: `<a href="#post-content" className="sr-only focus:not-sr-only ...">ข้ามไปยังเนื้อหา</a>` — first child of `<body>`.
- **Heading hierarchy**: `<h1>` = post title in hero. `<h2>` = article headings, "บทความที่คุณอาจสนใจ" in related section. `<h3>` = article sub-headings, related card titles. No skip.
- **Focus order**: skip link → AppHeader logo → AppHeader nav → PostBreadcrumb links → PostMetaRow tag links → article links (natural DOM order) → PostFooter ShareRow buttons → BackLink → BackToTop FAB.

### `PostBreadcrumb`

- `<nav aria-label="Breadcrumb">` landmark.
- `<ol>` list — screen reader announces "list, 3 items".
- Current: `<li aria-current="page">` on final item.
- Separators: `<span aria-hidden="true">` — not read aloud.

### `PostMetaRow`

- Date: wrap in `<time dateTime={iso8601}>` — machine-readable.
- Icons: all `aria-hidden="true"`.
- Tag chip links: accessible text from tag name; no additional label needed.

### `PostHero`

- `<h1>` — one per page.
- Cover image `alt`: `${post.title} — ภาพปก` if no explicit alt in DB; or DB-supplied alt.
- `priority` on `<Image>` — avoids LCP penalty.

### `TableOfContents`

- Container: `<aside aria-label="สารบัญบทความ">` (landmark — not `<nav>` to avoid
  confusing with the main site nav).
- Toggle button: `<button aria-expanded={open} aria-controls="toc-body-id">`.
- TOC list: `<ol>` with nested `<ol>` for h3 items (ordered reflects document order).
- TOC links: `<a href="#heading-id">` — anchor navigation.
- Active state: use `aria-current="true"` on the active link.
- Scroll area: `overscroll-behavior: contain` to prevent body scroll leak.
- Keyboard: Tab through links; Enter/Space on toggle button; Esc does NOT close (it is
  not a dialog — closing requires a button click or Tab away).
- Reduced motion: chevron rotation has `motion-reduce:transition-none`.

### `ShareRow`

- Buttons must have visible text labels (not icon-only) — current spec includes text.
- Copy button: `aria-live="polite"` region announces "คัดลอกแล้ว" on copy.
- `aria-label` on each social button per labels.shareToFacebook etc.

### `BackToTop`

- `aria-label={labels.backToTop.th}` — icon-only button.
- `size-11` = 44×44px ✓ touch target.
- When hidden (`opacity-0`): `aria-hidden="true"` + `tabIndex={-1}` so keyboard users
  cannot accidentally focus it.

### `ReadingProgress`

- `aria-hidden="true"` — purely decorative/informational; screen readers should not
  announce scroll progress.
- Reduced-motion: static bar (§9.1).

### `PostContent` (prose)

- All `<h2>`, `<h3>` in MDX body gain `id` from rehype-slug — match IDs used in TOC.
- `scroll-margin-top: 7rem` on h2/h3 to clear sticky header + progress bar.
- `<a>` inside prose: must not be color-only distinction — underline decoration is added
  via `.prose-post a` CSS rule (§12).

### Contrast verification list across all 4 presets

| Token pair | Usage | peach | cream | sage | ink |
|---|---|---|---|---|---|
| `text-ink` on `bg-bg` | body text | ≥16:1 ✓ | ≥16:1 ✓ | ≥16:1 ✓ | ≥16:1 ✓ |
| `text-muted-brand` on `bg-bg` | meta text | ~5.2:1 ✓ | ~5.1:1 ✓ | ~5.2:1 ✓ | ~4.6:1 ✓ |
| `text-ink` on `bg-brand-card` | card title | ≥15:1 ✓ | ≥15:1 ✓ | ≥15:1 ✓ | ≥15:1 ✓ |
| `text-brand-accent` on `bg-bg` | **large text only (≥18px or bold ≥14px)** | ~2.8:1 WARN | ~3.2:1 OK (large) | ~4.1:1 OK (large) | ~4.6:1 ✓ |
| `text-ink` on `data-theme="ink"` bg-bg | CtaCard text | ✓ (inverted) | ✓ | ✓ | n/a (same theme) |
| `bg-brand-accent` h2 bar (decorative) | pseudo-element non-text | No req. | No req. | No req. | No req. |

**Action required**: Never use `text-brand-accent` for body-size regular-weight text on
any surface. Restrict to: icons, hover states, large bold text (≥18px), decorative
pseudo-elements, and the h2 left bar.

---

## 12. Prose-post CSS namespace

Add to `src/styles/themes.css` after the existing rules. This scope is blog-post-specific
and must NOT bleed into work detail pages (which have their own chapter styles).

```css
/* ── prose-post — blog article body scope ──────────────────────────────────
 * Applied via className="prose-post" on the <article> wrapping compiled MDX.
 * Does not affect work detail pages (they use .chapter-body).
 * All colors use CSS vars — correct across all 4 presets.
 * scroll-margin-top: 7rem accounts for AppHeader (64px) + ReadingProgress
 * bar (3px) + breathing room (≈47px).
 */

.prose-post {
  font-size: 1rem;           /* text-base — 16px */
  line-height: 1.85;
  color: var(--ink);
  letter-spacing: 0.005em;
}

/* Body text — Thai line-height must be ≥ 1.5 (uxui.md §2) */
.prose-post p {
  margin: 0 0 1.3em;
}

/* ── Headings ── */
.prose-post h2 {
  font-size: clamp(1.4rem, 2.4vw, 1.85rem); /* ~text-2xl to text-3xl */
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 2.2em 0 0.7em;
  scroll-margin-top: 7rem;
  position: relative;
  padding-left: 1.125rem; /* 18px — room for 4px bar + gap */
  color: var(--ink);
}

/* h2 left bar — brand accent as decorative (non-text: no contrast req.) */
.prose-post h2::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.25em;
  bottom: 0.25em;
  width: 4px;
  background: var(--brand-accent);
  border-radius: 4px;
}

.prose-post h3 {
  font-size: clamp(1.15rem, 1.8vw, 1.35rem); /* ~text-xl to text-2xl */
  font-weight: 700;
  margin: 1.8em 0 0.6em;
  scroll-margin-top: 7rem;
  color: var(--ink);
}

.prose-post h4 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 1.5em 0 0.5em;
  color: var(--ink);
}

/* ── Inline ── */
.prose-post a {
  color: var(--ink);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--brand-accent) 40%, transparent);
  text-underline-offset: 3px;
  transition: color 0.15s, text-decoration-color 0.15s;
}
.prose-post a:hover {
  color: var(--brand-accent);
  text-decoration-color: var(--brand-accent);
}
/* a11y: underline ensures color is not the sole distinction */

.prose-post strong {
  font-weight: 700;
  color: var(--ink);
}

/* ── Image ── */
.prose-post img {
  border-radius: 1rem; /* rounded-2xl = 16px */
  margin: 1.8em 0;
  width: 100%;
  display: block;
  /* No box-shadow — uxui.md §5: prefer border over shadow */
}

/* ── Blockquote ── */
.prose-post blockquote {
  margin: 1.8em 0;
  padding: 1.125rem 1.5rem; /* 18px 24px */
  background: var(--bg2);
  border-left: 4px solid var(--brand-accent);
  border-radius: 0 0.75rem 0.75rem 0; /* rounded-xl on right corners */
  font-style: italic;
  color: var(--muted-brand);
}
.prose-post blockquote p:last-child {
  margin-bottom: 0;
}

/* ── Lists ── */
.prose-post ul,
.prose-post ol {
  margin: 0 0 1.4em;
  padding-left: 1.6em;
}
.prose-post li {
  margin-bottom: 0.5em;
}
.prose-post ul li::marker {
  color: var(--brand-accent);
}

/* ── Code ── */
.prose-post code:not(pre code) {
  background: var(--bg2);
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem; /* rounded-md */
  font-size: 0.92em;
  color: var(--ink);
  font-family: ui-monospace, "JetBrains Mono", monospace;
}

.prose-post pre {
  background: var(--ink);  /* ink token = dark on light themes, light on ink theme */
  color: var(--bg);
  padding: 1.25rem;
  border-radius: 0.75rem; /* rounded-xl */
  overflow-x: auto;
  margin: 1.8em 0;
  font-size: 0.9em;
  line-height: 1.6;
}
.prose-post pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

/* ── Divider ── */
.prose-post hr {
  border: none;
  height: 1px;
  background: var(--line);
  margin: 2.5em 0;
}

/* ── Table ── */
.prose-post table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.8em 0;
  font-size: 0.95em;
  border-radius: 0.75rem; /* rounded-xl */
  overflow: hidden;
  border: 1px solid var(--line);
}
.prose-post th,
.prose-post td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}
.prose-post th {
  background: var(--bg2);
  font-weight: 700;
}

/* ── Mobile adjustments ── */
@media (max-width: 768px) {
  .prose-post {
    font-size: 1rem;
    line-height: 1.8;
  }
}
```

**Token usage verification**: Every color references a CSS var. The `pre` background uses
`var(--ink)` which is dark on light presets and light on the ink (dark) preset — this means
code blocks will appear correctly inverted in all themes. The `color: var(--bg)` for code
text follows the same inversion. Verify the ink-on-ink scenario: on the ink preset, `--ink`
= `#f5f0e8` (light) and `--bg` = `#1a1714` (dark) — the pre block will have near-white
background with near-black text, which is correct inverse behavior.

---

## 13. Heading extraction strategy — `lib/utils/extractHeadings.ts`

### Why a separate utility (not parsed from rendered HTML)

The TOC is built server-side from the MDX source string before compilation — this avoids
client-side DOM traversal and allows RSC to pass the heading tree as a prop.

### Algorithm

```ts
import GithubSlugger from 'github-slugger';
// Install: github-slugger is already a transitive dep of rehype-slug.
// Import parity ensures TOC IDs match rehype-slug IDs exactly.
// Note: rehype-slug v7 uses github-slugger internally.

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
  children?: TocHeading[];
};

/**
 * Parses h2/h3 headings from MDX source string.
 *
 * Rules:
 * 1. Match only line-start ATX headings: /^#{2,3} /m
 * 2. Skip headings inside fenced code blocks (``` … ```)
 * 3. Skip headings inside indented code blocks (4-space prefix)
 * 4. Do NOT match `#` appearing mid-line (e.g., "#ef4235 is a color")
 * 5. Build h2 → [h3] tree: each h2 node can have .children of h3 nodes
 *    encountered before the next h2.
 * 6. Slugs MUST be generated by GithubSlugger to match rehype-slug output.
 */
export function extractHeadings(mdxSource: string): TocHeading[] {
  const slugger = new GithubSlugger();
  const result: TocHeading[] = [];
  let inFencedBlock = false;
  let currentH2: TocHeading | null = null;

  for (const line of mdxSource.split('\n')) {
    // Toggle fenced code block state
    if (/^```/.test(line)) {
      inFencedBlock = !inFencedBlock;
      continue;
    }
    if (inFencedBlock) continue;

    // Match h2: exactly 2 # at line start followed by space
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      const text = h2Match[1].trim();
      const id = slugger.slug(text);
      currentH2 = { id, text, level: 2, children: [] };
      result.push(currentH2);
      continue;
    }

    // Match h3: exactly 3 # at line start followed by space
    const h3Match = line.match(/^### (.+)$/);
    if (h3Match && currentH2) {
      const text = h3Match[1].trim();
      const id = slugger.slug(text);
      currentH2.children = [...(currentH2.children ?? []), { id, text, level: 3 }];
    }
  }

  // Clean up: remove .children arrays that are empty
  return result.map((h) =>
    h.children && h.children.length > 0 ? h : { ...h, children: undefined }
  );
}
```

### Why `github-slugger`

`rehype-slug` (used in the MDX compile pipeline) uses `github-slugger` internally.
Using the same package guarantees that `extractHeadings`-generated IDs are identical
to the `id` attributes placed on heading DOM nodes by rehype-slug. Mismatched IDs
would cause TOC anchor links to scroll to wrong positions.

Import: `import GithubSlugger from 'github-slugger'` — package is `github-slugger` in npm.
If not yet in `package.json`, add with `npm install github-slugger`. It is likely already
installed as a transitive dependency of `rehype-slug`.

### Usage in RSC page

```ts
// src/app/(public)/blog/[slug]/page.tsx (RSC)
const { post, compiledMdx } = await getPostBySlug(slug);
const headings = extractHeadings(post.bodyMdx);
// Pass headings to <TableOfContents headings={headings} />
```

---

## 14. Loading states

### `loading.tsx` at `/blog/[slug]`

File: `src/app/(public)/blog/[slug]/loading.tsx`

```
<div aria-busy="true" aria-label="กำลังโหลดบทความ">
  [hero skeleton]
  - Skeleton h-4 w-32 (breadcrumb)
  - Skeleton h-4 w-48 (meta row)
  - Skeleton h-10 w-3/4 (h1 line 1)
  - Skeleton h-10 w-1/2 (h1 line 2)
  - Skeleton h-4 w-full (excerpt)
  - Skeleton aspect-[16/9] w-full rounded-2xl (cover)

  [body skeleton — 2-col on lg]
  - main: 3× Skeleton h-5 w-full + 1× Skeleton h-5 w-3/4 (paragraphs)
  - sidebar: Skeleton h-[200px] w-full rounded-xl (TOC)
              Skeleton h-[180px] w-full rounded-xl (CTA card)
              Skeleton h-[220px] w-full rounded-xl (recent posts)
</div>
```

Skeleton dimensions must match real layout to prevent CLS (loading-states.md §1).

### `loading.tsx` at `/blog`

File: `src/app/(public)/blog/loading.tsx`

```
<div aria-busy="true" aria-label="กำลังโหลดรายการบทความ">
  [filter bar skeleton]: Skeleton h-8 w-20 rounded-full × 5 (chips)
  [grid skeleton]:
    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
    × 6 PostCard skeletons:
      Skeleton aspect-[16/10] w-full rounded-md
      Skeleton h-4 w-16 rounded-full (tag)
      Skeleton h-6 w-full (title)
      Skeleton h-4 w-full (excerpt)
      Skeleton h-3 w-32 (meta)
</div>
```

---

## 15. Shadcn primitives — install list for fe-public

Primitives already in `src/components/ui/` (per glob):
- `button`, `badge`, `skeleton`, `spinner`, `tooltip`, `separator` — all available.

Primitives needed but NOT yet installed:

| Primitive | Reason | Install command |
|---|---|---|
| `collapsible` | Optional for TOC expand/collapse (alternative to manual CSS approach). Install only if fe-public chooses Radix Collapsible over raw CSS max-height transition. | `npx shadcn@latest add collapsible` |
| `scroll-area` | Optional for TOC scrollable area with styled scrollbar — `ScrollArea` from shadcn provides cross-browser scrollbar styling that matches theme. Install only if needed. | `npx shadcn@latest add scroll-area` |

No other shadcn primitives are missing. Both optional installs are noted — the spec
functions correctly without them using raw CSS alternatives.

---

## 16. Open questions for product / be-data

1. **`scrollYProgress` sharing**: `ReadingProgress` and `BackToTop` both need
   `scrollYProgress`. Should fe-public create a React context (`ScrollProgressContext`)
   to share the motion value, or is two separate `useScroll()` calls acceptable?
   (Two separate calls are correct per motion.dev — `useScroll` does not double-attach;
   but context is cleaner if a third component ever needs it.)

2. **Recent posts query**: `RecentPostsCard` needs 4 recent published posts excluding
   the current post. Does `lib/services/post.ts` expose a `listRecentPosts(excludeId, limit)` function?
   If not, be-data must add it.

3. **Related posts query**: `RelatedPostsSection` needs 2–3 related posts. Relation
   strategy (shared tags? same author? recent?). Currently undefined. be-data decision.

4. **`github-slugger` in `package.json`**: Confirm it is already a transitive dep before
   adding to direct dependencies. Run `npm ls github-slugger` to verify.

5. **Listing pagination**: Number of posts per page and pagination strategy (numbered
   vs. "load more") is an admin/product decision. Spec shows numbered pagination as
   default. If "load more" is chosen, `WorksListing`/`WorksFilterBar` pattern in
   `components/public/work/` can be referenced.

6. **`statProjects` / `statYears` in CtaCard**: Does the admin control these numbers,
   or are they hardcoded? If DB-driven, be-data needs a config/settings table.

---

## 17. Hand-off

- **Implementer**: fe-public
- **Routes to create**:
  - `src/app/(public)/blog/page.tsx` (listing RSC)
  - `src/app/(public)/blog/loading.tsx` (listing skeleton)
  - `src/app/(public)/blog/[slug]/page.tsx` (detail RSC)
  - `src/app/(public)/blog/[slug]/loading.tsx` (detail skeleton)
  - `src/app/(public)/blog/[slug]/not-found.tsx` (404 state)
- **New component folder**: `src/components/public/blog/` (create)
- **New motion component**: `src/components/motion/ReadingProgress.tsx`
- **New utility**: `src/lib/utils/extractHeadings.ts`
- **Styles**: append `prose-post` namespace to `src/styles/themes.css`
- **Labels**: append blog labels to `src/lib/i18n/labels.ts`
- **Skills to use**: `add-public-screen`, `seo-page-checklist`, `motion-patterns`,
  `page-states`, `component-anatomy`
- **Review after**: `a11y-reviewer` (contrast table §11), `seo-reviewer` (BlogPosting JSON-LD)
