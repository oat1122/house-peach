# Design spec — Home page (`/`)

## Purpose

The home page is the primary entry point for visitors arriving from search, Instagram,
or word-of-mouth. It must establish the house-peach brand (warm, calm, handcrafted), surface
the best portfolio work and latest writing, and funnel visitors toward `/works` or `/contact`
— all without a single e-commerce element.

## Audience & device

- Primary: mobile 390×844 (Instagram link tap, first visit)
- Secondary: desktop ≥1024 (return visitor, full portfolio browse)
- Context: someone curious about home decoration who just tapped a link from IG or a Google result; they want to quickly feel the quality of the studio's taste before deciding to reach out

## Brand-feel check (uxui.md § 1)

Target words: **"warm"** (อบอุ่น) and **"observational"** (ชอบสังเกตรายละเอียด)

| housify element | house-peach adaptation | Brand-feel verdict |
|---|---|---|
| "Find Your Dream Home Today" hero | TH headline, serif, intimate tone | PASS after copy adapt |
| `#C8743A` orange accent | `var(--brand-accent)` — soft gold/sage per preset | PASS |
| Plus Jakarta Sans | `--font-sans` DM Sans + `--font-serif` DM Serif Display | PASS |
| Property cards with price/sqft/beds | WorkCard with room type, style, year — no price | PASS |
| "About Us" dark card `#1A1A1A` | `bg-bg2` + `text-ink` on light presets; `bg-brand-card` on ink | PASS — see Token map |
| Buy/Rent/Sold filter tabs | REMOVED — not e-commerce (AGENTS.md invariant) | N/A |
| Property Showcase carousel + pagination dots | Static 4-card grid; Phase 2 Embla note | PASS |
| `rounded-3xl` 24px throughout | Hero/About: `rounded-2xl`; cards: `rounded-xl`; buttons: `rounded-md` | PASS |
| `shadow-float 0 10px 30px` | `border border-line` + `shadow-sm` | PASS |
| Heart "favourite" icon | REMOVED — no wishlist/account | PASS |
| Search bar "Enter City or Zip Code" | REMOVED — no property search | PASS |

---

## Section map (top → bottom)

1. **Header** — existing `PublicLayout` header (sticky, blur). Do not redesign.
2. **HeroSection** — full-width rounded image card + headline + dual CTA + StatsCard
3. **DiscoverSection** — section heading 2-col + work gallery grid (1 large + 3 small)
4. **AboutPanel** — split panel (image left + copy right), bg-bg2
5. **RecentWorksStrip** — 4-card grid with section heading
6. **Footer** — existing `PublicLayout` footer. Do not redesign.

---

## Layout — mobile 390px

### 1. Header (existing — not redesigned)

```
┌───────────────────────────────────────┐
│ house-peach           ผลงาน บทความ ⊙  │  56px sticky, bg-bg/95 blur
└───────────────────────────────────────┘
```

### 2. HeroSection

```
┌───────────────────────────────────────┐
│ px-4 pt-4                             │
│ ┌─────────────────────────────────┐   │
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │  rounded-2xl overflow-hidden
│ │░░  hero.svg 1600×900  ░░░░░░░░│   │  aspect-[16/9] mobile
│ │░░  object-cover, gradient L→R  ░░│   │
│ │                                 │   │
│ │  [text content left-aligned]    │   │
│ │  eyebrow text-xs muted-brand    │   │  "ผลงาน · Works"
│ │  uppercase tracking-widest      │   │
│ │                                 │   │
│ │  ห้องที่อบอุ่น                  │   │  h1 font-serif text-4xl
│ │  เหมือนกอด                     │   │  text-white leading-[1.1]
│ │                                 │   │
│ │  ห้องดี ไม่ต้องดัง             │   │  text-sm text-white/80
│ │  ดีเทลเรียบ อบอุ่มถึงใจ       │   │  max-w-xs
│ │                                 │   │
│ │  [ ดูผลงาน ]  เริ่มโปรเจกต์ → │   │  CTA row
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │  StatsCard — BELOW hero mobile
│ │  Who we are · เกี่ยวกับเรา     │   │  bg-brand-card rounded-xl p-5
│ │  ─────────────────────────────  │   │  border border-line shadow-sm
│ │  สตูดิโอตกแต่งบ้านแนว warm-   │   │
│ │  tone minimalist กรุงเทพฯ      │   │  text-sm text-muted-brand
│ │                                 │   │
│ │  12+      80+      4.9★        │   │  stat grid grid-cols-3
│ │  ผลงาน   ลูกค้า   รีวิว        │   │  text-2xl bold text-ink
│ └─────────────────────────────────┘   │
└───────────────────────────────────────┘
  pt-4 pb-0 px-4
```

### 3. DiscoverSection

```
┌───────────────────────────────────────┐
│ px-4 py-12                            │
│                                       │
│ ผลงานเด่น · Featured work             │  text-xs uppercase tracking-widest
│                                       │  text-muted-brand
│ ค้นพบงานออกแบบ                        │  h2 font-serif text-3xl text-ink
│ ที่ใช่สำหรับคุณ                       │  tracking-tight
│                                       │
│ เราเชี่ยวชาญงานตกแต่งภายในแนว        │  text-sm text-muted-brand
│ warm-tone minimalist ทุกขนาดพื้นที่   │  leading-relaxed
│                                       │
│ ┌─────────────────────────────────┐   │  featured.svg 800×1000
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │  aspect-[4/5] rounded-xl
│ │░  featured WorkCard (hero)  ░░│   │  WorkCard variant="hero"
│ │  ─────────────────────────────│   │
│ │  bg-brand-card/90 blur p-4     │   │  info overlay bottom
│ │  ห้องนั่งเล่น · Japandi        │   │
│ │  ชื่อผลงาน → serif text-xl     │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌───────────┐ ┌───────────────────┐   │
│ │░░small-1░│ │░░small-2░░░░░░░░░│   │  small-1.svg 600×600 aspect-1/1
│ │           │ │                   │   │  small-2.svg 600×600 aspect-1/1
│ └───────────┘ └───────────────────┘   │  gap-3 grid-cols-2
│ ┌─────────────────────────────────┐   │
│ │░░░░░░░░░ small-wide.svg ░░░░░░│   │  1200×600 aspect-[2/1] col-span-2
│ └─────────────────────────────────┘   │
│                                       │
│                    ดูผลงานทั้งหมด →   │  text-sm text-brand-accent
│                                       │  text-right
└───────────────────────────────────────┘
```

### 4. AboutPanel

```
┌───────────────────────────────────────┐
│ bg-bg2 px-4 py-12                     │
│                                       │
│ ┌─────────────────────────────────┐   │  about.svg 800×800
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │  aspect-1/1 rounded-2xl
│ │░░    about.svg image    ░░░░░░░│   │
│ └─────────────────────────────────┘   │
│                                       │
│ เกี่ยวกับเรา · About us               │  text-xs uppercase tracking-widest
│                                       │
│ สตูดิโอตกแต่งบ้าน                     │  h2 font-serif text-3xl text-ink
│ สไตล์ warm-tone                       │
│                                       │
│ เราเชื่อว่าบ้านที่ดีควรรู้สึก         │  text-sm text-muted-brand
│ อบอุ่น ไม่ว่าจะขนาดเท่าไหร่          │  space-y-3 leading-relaxed
│                                       │
│ ทำงานด้วยความใส่ใจในรายละเอียด       │
│ ตั้งแต่ concept จนจบโปรเจกต์         │
│                                       │
│ [ เริ่มโปรเจกต์ ]                    │  Button variant="default"
│                                       │  bg-ink text-bg rounded-md
└───────────────────────────────────────┘
```

### 5. RecentWorksStrip

```
┌───────────────────────────────────────┐
│ px-4 py-12                            │
│                                       │
│ ผลงานล่าสุด · Recent works            │  text-xs uppercase tracking-widest
│                                       │
│ งานล่าสุดของเรา                       │  h2 font-serif text-3xl text-ink
│                                       │
│ ┌───────────┐ ┌───────────────────┐   │  grid-cols-2 gap-4
│ │░showcase1░│ │░░showcase2░░░░░░░│   │  showcase-1.svg 600×500 aspect-5/4
│ └───────────┘ └───────────────────┘   │  WorkCard variant="regular"
│ ┌───────────┐ ┌───────────────────┐   │
│ │░showcase3░│ │░░showcase4░░░░░░░│   │
│ └───────────┘ └───────────────────┘   │
│                                       │
│                    ดูผลงานทั้งหมด →   │  text-sm text-brand-accent text-right
└───────────────────────────────────────┘
```

---

## Layout — tablet 768px

### HeroSection

- Hero card: `aspect-[16/9]` (unchanged). Text content stays left-aligned, max-w-sm.
- StatsCard: still stacked below hero (not floating yet).

### DiscoverSection

- Section heading: `grid grid-cols-2 gap-6` — h2 left col, body text right col.
- Gallery grid: featured card stays full-width; small cards `grid-cols-2`; wide card `col-span-2`.

### RecentWorksStrip

- `grid-cols-2 gap-6` — same as mobile 2-col but more padding.

---

## Layout — desktop 1280px

### HeroSection

```
┌────────────────────────────────────────────────────────────────┐
│ px-6 pt-6  max-w-6xl mx-auto                                   │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │
│ │░  hero.svg object-cover  aspect-[21/9] on desktop  ░░░░│   │
│ │░  gradient overlay: from-ink/60 via-ink/20 to-transparent│   │
│ │                                                          │   │
│ │  [left column p-12 lg:p-16 max-w-xl]                    │   │
│ │  eyebrow: ผลงาน · Works  text-xs muted-brand             │   │
│ │                                                          │   │
│ │  ห้องที่อบอุ่น              ┌────────────────────────┐   │   │
│ │  เหมือนกอด                 │ เกี่ยวกับเรา · Who we  │   │   │  StatsCard
│ │  h1 serif text-5xl white   │ are                    │   │   │  absolute
│ │                            │ ──────────────────────  │   │   │  bottom-6
│ │  lead text-base white/80   │ สตูดิโอตกแต่งบ้าน…     │   │   │  right-6
│ │  max-w-sm                  │                        │   │   │  w-72
│ │                            │  12+  80+  4.9★       │   │   │  bg-brand-card
│ │  [ ดูผลงาน ]               │  ผลงาน ลูกค้า รีวิว   │   │   │  rounded-xl
│ │  เริ่มโปรเจกต์ →           └────────────────────────┘   │   │  shadow-sm
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### DiscoverSection

```
┌────────────────────────────────────────────────────────────────┐
│ py-16 px-6  max-w-6xl mx-auto                                  │
│                                                                │
│ ┌────────────────────────┐  ┌─────────────────────────────┐   │
│ │ ผลงานเด่น · Featured   │  │ เราเชี่ยวชาญงานตกแต่ง…     │   │
│ │ ค้นพบงานออกแบบ         │  │ text-sm text-muted-brand    │   │
│ │ ที่ใช่สำหรับคุณ h2      │  │ + "ดูผลงานทั้งหมด →" link  │   │
│ └────────────────────────┘  └─────────────────────────────┘   │
│                              grid-cols-2 gap-8 mb-10           │
│                                                                │
│ ┌──────────────────────────┐  ┌────────┐ ┌────────┐          │
│ │░░░░░░░░░░░░░░░░░░░░░░░░│  │░small1░│ │░small2░│          │
│ │░   featured.svg 4:5    ░│  └────────┘ └────────┘          │
│ │░   WorkCard hero        ░│  ┌──────────────────────┐       │
│ │░   rounded-xl h-full    ░│  │░░░░ small-wide 2:1 ░░│       │
│ └──────────────────────────┘  └──────────────────────┘       │
│  grid grid-cols-2 gap-4  (left col = 1 big, right col = 3 small in own 2-col grid)
└────────────────────────────────────────────────────────────────┘
```

### AboutPanel

```
┌────────────────────────────────────────────────────────────────┐
│ bg-bg2 py-16 px-6  max-w-6xl mx-auto  rounded-2xl             │
│                                                                │
│ ┌────────────────────────┐  ┌─────────────────────────────┐   │
│ │░░░░░░░░░░░░░░░░░░░░░░│  │ เกี่ยวกับเรา · About us     │   │
│ │░   about.svg 1:1     ░│  │                              │   │
│ │░   rounded-xl        ░│  │ สตูดิโอตกแต่งบ้าน           │   │
│ │░   object-cover      ░│  │ สไตล์ warm-tone h2 serif    │   │
│ └────────────────────────┘  │                              │   │
│                              │ body text-sm muted-brand    │   │
│  grid grid-cols-2 gap-12    │ space-y-4 leading-relaxed   │   │
│  items-center                │                              │   │
│                              │ [ เริ่มโปรเจกต์ ]          │   │
│                              └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### RecentWorksStrip

```
┌────────────────────────────────────────────────────────────────┐
│ py-16 px-6  max-w-6xl mx-auto                                  │
│ heading row (ชื่อ left + link right)                           │
│                                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ showcase │ │ showcase │ │ showcase │ │ showcase │          │
│ │     1    │ │     2    │ │     3    │ │     4    │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  grid-cols-4 gap-6  WorkCard variant="regular"                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Component breakdown

| Block | Primitive / Component | Source | Notes |
|---|---|---|---|
| Skip link | `<a>` `sr-only` | existing in layout | do not duplicate |
| Header | existing layout header | `app/(public)/layout.tsx` | do not redesign |
| `HeroSection` | custom RSC | new `components/public/home/HeroSection.tsx` | full-width image card with gradient overlay; no shadcn equivalent for this art-directed layout |
| Hero image | `<Image>` | `next/image` | `priority` (LCP), `fill`, `object-cover`, `sizes` |
| Hero gradient overlay | `<div>` | Tailwind | `bg-gradient-to-r from-ink/60 via-ink/20 to-transparent` |
| Hero CTA primary | `<Button>` | `components/ui/button` shadcn | `variant="default"` `bg-brand-accent text-bg` |
| Hero CTA secondary | `<Link>` styled | next/link + Tailwind | `text-sm text-white/90 underline-offset-4 hover:underline` |
| `StatsCard` | custom RSC | new `components/public/home/StatsCard.tsx` | small standalone card; justified because it contains brand-specific stat+label pairs, not a shadcn primitive pattern |
| `DiscoverSection` | custom RSC | new `components/public/home/DiscoverSection.tsx` | orchestrates heading + gallery grid |
| Featured work card | `<WorkCard variant="hero">` | existing `components/public/work/WorkCard.tsx` | reuse — already handles hero variant |
| Small gallery cards | `<WorkCard variant="regular">` | existing `components/public/work/WorkCard.tsx` | reuse |
| `AboutPanel` | custom RSC | new `components/public/home/AboutPanel.tsx` | split image+text panel on bg-bg2 |
| About CTA | `<Button>` | shadcn `components/ui/button` | `variant="secondary"` or override with `bg-ink text-bg` |
| `RecentWorksStrip` | custom RSC | new `components/public/home/RecentWorksStrip.tsx` | 4-card grid with heading; thin wrapper around WorkCard |
| Footer | existing layout footer | `app/(public)/layout.tsx` | do not redesign |
| `FadeUp` wrapper | existing motion wrapper | `components/motion/FadeUp.tsx` | section enter on scroll |
| `Stagger` wrapper | existing motion wrapper | `components/motion/Stagger.tsx` | card grid entry |

**Custom component justifications:**
- `HeroSection` — full-bleed rounded image card with absolute-positioned StatsCard; no shadcn pattern covers this art-directed layout.
- `StatsCard` — 3 stat+label cells specific to house-peach brand stats; trivial enough not to need Radix primitives.
- `AboutPanel` — domain-specific split layout; not a shadcn Block equivalent.
- `RecentWorksStrip` — thin orchestrator RSC; delegates rendering to existing WorkCard.

---

## States (uxui.md § 10)

All interactive elements follow uxui.md defaults unless noted below.

| Element | hover | focus-visible | disabled | loading | empty |
|---|---|---|---|---|---|
| Hero CTA primary | `bg-brand-accent/90 -translate-y-0.5 shadow-sm` | `ring-2 ring-brand-accent ring-offset-2` | n/a (always enabled) | n/a | n/a |
| Hero CTA secondary | `underline` | `ring-2 ring-brand-accent ring-offset-2 rounded-sm` | n/a | n/a | n/a |
| WorkCard (all) | uxui.md defaults (`-translate-y-0.5 shadow-sm`) | uxui.md defaults | n/a | n/a | `bg-bg2` placeholder block (already in WorkCard) |
| DiscoverSection | n/a | n/a | n/a | Skeleton: `<Skeleton className="aspect-[4/5] rounded-xl" />` × 1 large + 3 small | Hide section if 0 published works |
| RecentWorksStrip | n/a | n/a | n/a | Skeleton: `<Skeleton className="aspect-[5/4] rounded-xl" />` × 4 | Hide section if 0 works |
| About CTA | `bg-ink/80 -translate-y-0.5` | `ring-2 ring-brand-accent ring-offset-2` | n/a | n/a | n/a |

---

## Typography & spacing

Per uxui.md § 2 + § 3 — deviations and specific picks only:

```
Hero h1:
  mobile:   font-serif text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]
  desktop:  md:text-5xl lg:text-6xl

Section h2 (DiscoverSection, AboutPanel, RecentWorksStrip):
  font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink

Eyebrow label (all sections):
  text-xs uppercase tracking-widest text-muted-brand

Lead / body paragraph:
  text-sm md:text-base text-muted-brand leading-relaxed

Stat value (StatsCard):
  text-2xl font-bold text-ink

Stat label (StatsCard):
  text-[10px] uppercase tracking-widest text-muted-brand

Section padding:
  py-12 md:py-16

Section container:
  max-w-6xl mx-auto px-4 md:px-6

Hero wrapper:
  px-4 pt-4 md:px-6 md:pt-6

Hero card height:
  mobile: aspect-[16/9]  desktop: aspect-[21/9]

DiscoverSection gallery outer gap:
  gap-3 md:gap-4

RecentWorksStrip grid:
  grid-cols-2 md:grid-cols-4 gap-4 md:gap-6

AboutPanel grid:
  grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center
```

---

## Token map

Housify hex → house-peach token + WCAG contrast on all 4 presets:

| housify value | house-peach token | peach | cream | sage | ink |
|---|---|---|---|---|---|
| `#EFEEEA` bg-page | `bg-bg` | — | — | — | — |
| `#FFFFFF` bg-card | `bg-brand-card` | white on peach-bg | light beige on cream | light on sage | dark card on ink |
| `#1A1A1A` bg-dark | `bg-bg2` light presets / `bg-brand-card` ink | n/a | n/a | n/a | passes — ink card is `#252220` |
| `#C8743A` accent | `var(--brand-accent)` | `#b89b7a` | `#c9a878` | `#8fa088` | `#c4a47c` |
| `#1A1A1A` text-primary | `text-ink` | `#1c1a17` on `#faf7f2` ≥16:1 | ≥14:1 | ≥15:1 | `#f5f0e8` on `#1a1714` ≥14:1 |
| `#6B6B6B` text-secondary | `text-muted-brand` | 5.37:1 AA | 5.03:1 AA | 5.10:1 AA | 6.80:1 AAA |
| `#E5E3DD` border | `border-line` | decorative | decorative | decorative | decorative |

**Accent on white background (StatsCard value numbers):**
- `--brand-accent` on `--brand-card`: peach `#b89b7a` on `#fff` = 2.5:1 — FAILS AA for normal text.
- **Decision: stat values use `text-ink` not `text-brand-accent`.** Only decorative use (icon, border) may use accent. This matches themes.css comment pattern.

**Hero overlay contrast:**
- `text-white` on `from-ink/60` gradient: estimated ≥7:1 at the text position (left side) — AAA. Confirm with image at hand.

**About CTA button (bg-ink on light presets):**
- `bg-ink` (`#1c1a17`) + `text-bg` (`#faf7f2`) ≥16:1 on peach — AAA. All presets pass trivially.

---

## Motion plan

All wrappers from `components/motion/` — no inline `motion.div`.

| Section | Wrapper | Trigger | Duration | Reduced motion |
|---|---|---|---|---|
| HeroSection text block | `<FadeUp>` | mount (once) | 0.35s ease-out, y:8→0, opacity:0→1 | skip — render at final position instantly |
| StatsCard | `<FadeUp delay={0.15}>` | mount (once) | 0.35s | skip |
| DiscoverSection heading | `<FadeUp>` | whileInView once | 0.35s | skip |
| DiscoverSection cards | `<Stagger>` | whileInView once | 0.1s stagger per card | skip |
| AboutPanel | `<FadeUp>` | whileInView once | 0.35s | skip |
| RecentWorksStrip cards | `<Stagger>` | whileInView once | 0.1s stagger | skip |

No scroll-jacking. No loop animation. No page-level transition.

---

## Bilingual copy table

| Slot | TH (primary) | EN (subtitle / bilingual display) |
|---|---|---|
| Hero eyebrow | `ผลงาน` | `Works` — display: `ผลงาน · Works` |
| Hero h1 line 1 | `ห้องที่อบอุ่น` | "Rooms that feel like a hug" |
| Hero h1 line 2 | `เหมือนกอด` | (same line in EN) |
| Hero lead | `ห้องดี ไม่ต้องดัง ดีเทลเรียบ อบอุ่มถึงใจ` | "Quiet rooms. Soft details. Genuine warmth." |
| Hero CTA primary | `ดูผลงาน` | "See our work" |
| Hero CTA secondary | `เริ่มโปรเจกต์ →` | "Start a project →" |
| StatsCard title | `เกี่ยวกับเรา` | `Who we are` — display: `เกี่ยวกับเรา · Who we are` |
| StatsCard body | `สตูดิโอตกแต่งบ้านแนว warm-tone minimalist กรุงเทพฯ` | [TH-review needed for final tone] |
| Stat 1 value | `12+` | same |
| Stat 1 label | `ผลงาน` | `Projects` |
| Stat 2 value | `80+` | same |
| Stat 2 label | `ลูกค้า` | `Clients` |
| Stat 3 value | `4.9★` | same |
| Stat 3 label | `รีวิว` | `Reviews` |
| Discover eyebrow | `ผลงานเด่น` | `Featured work` — display: `ผลงานเด่น · Featured work` |
| Discover h2 | `ค้นพบงานออกแบบที่ใช่สำหรับคุณ` | "Find work that speaks to you" |
| Discover body | `เราเชี่ยวชาญงานตกแต่งภายในแนว warm-tone minimalist ทุกขนาดพื้นที่ ตั้งแต่ห้องเดี่ยวจนถึงบ้านทั้งหลัง` | [TH-review needed] |
| Discover "see all" link | `ดูผลงานทั้งหมด →` | "See all works →" |
| About eyebrow | `เกี่ยวกับเรา` | `About us` |
| About h2 | `สตูดิโอตกแต่งบ้านสไตล์ warm-tone` | "A warm-tone interior studio" |
| About body para 1 | `เราเชื่อว่าบ้านที่ดีควรรู้สึกอบอุ่น ไม่ว่าจะขนาดเท่าไหร่` | [TH-review needed] |
| About body para 2 | `ทำงานด้วยความใส่ใจในรายละเอียด ตั้งแต่ concept จนจบโปรเจกต์` | [TH-review needed] |
| About CTA | `เริ่มโปรเจกต์` | "Start a project" |
| Recent eyebrow | `ผลงานล่าสุด` | `Recent works` |
| Recent h2 | `งานล่าสุดของเรา` | "Our latest work" |
| Recent "see all" link | `ดูผลงานทั้งหมด →` | "See all works →" |

---

## A11y notes

**Heading hierarchy (one h1 per page):**
```
h1 — Hero headline "ห้องที่อบอุ่นเหมือนกอด"
  h2 — DiscoverSection "ค้นพบงานออกแบบที่ใช่สำหรับคุณ"
  h2 — AboutPanel "สตูดิโอตกแต่งบ้านสไตล์ warm-tone"
  h2 — RecentWorksStrip "งานล่าสุดของเรา"
    (WorkCard titles rendered as <p> on listing — not headings, per WorkCard source)
```

Note: WorkCard `variant="hero"` uses `<h2>` for the featured card title. On the home page the featured WorkCard h2 would create a heading-level conflict since DiscoverSection already has an h2. **Implementer should render the featured card inside DiscoverSection and pass a `headingLevel="h3"` prop, or wrap with a visually hidden h3.** This is an open question — see below.

**Image alt text:**

| Image | Alt text |
|---|---|
| hero.svg placeholder | `"ห้องนั่งเล่นสไตล์ warm-tone minimalist แสงธรรมชาติอ่อนโยน"` (final = actual photo description) |
| about.svg placeholder | `"สตูดิโอ house-peach ทีมงานในระหว่างโปรเจกต์ตกแต่งบ้าน"` |
| showcase cards | delegated to `WorkCard` — uses `${title} — ${roomTypeLabel}, สไตล์ ${style}` |
| hero.svg decorative gradient div | `aria-hidden="true"` |

**Focus order:**
```
skip link → logo → nav: ผลงาน → บทความ → ติดต่อ → ThemeToggle →
hero CTA primary (ดูผลงาน) → hero CTA secondary (เริ่มโปรเจกต์) →
featured WorkCard → small WorkCards → Discover "see all" →
About CTA → Recent WorkCards × 4 → Recent "see all"
```

**Touch targets:**
- Hero CTA buttons: `px-5 py-3` → ~44px height ✓
- "See all" text-link: `inline-block py-2` to reach 44px tap area — add explicitly
- WorkCard: full-card `<Link>` wraps entire clickable area ✓
- ThemeToggle: existing in layout — assumed ≥44px

**StatsCard on mobile:** rendered as a normal flow card below the hero image, not overlapping text — readable by screen readers in document order.

**Hero gradient:** `aria-hidden="true"` on the overlay div.

---

## Dummy SVG spec

All SVGs live at `public/images/home/`. Warm-tone palette: gradient from `#f3ede3` (var(--bg2) peach) through `#d4bfa0` to `#b89b7a` (var(--brand-accent) peach). Label text: `text-[#6b6560]` (muted-brand).

| Filename | Aspect | Width×Height | Label text | Gradient stops |
|---|---|---|---|---|
| `hero.svg` | 16:9 | 1600×900 px | `"1600×900 px"` | `#f3ede3` → `#c9b090` → `#b89b7a` (L→R) |
| `featured.svg` | 4:5 | 800×1000 px | `"800×1000 px"` | `#ede4d6` → `#c9b090` (T→B) |
| `small-1.svg` | 1:1 | 600×600 px | `"600×600 px"` | `#f0e8da` → `#c9b090` (T→B) |
| `small-2.svg` | 1:1 | 600×600 px | `"600×600 px"` | `#e8ddd0` → `#bfa882` (T→B, slightly darker) |
| `small-wide.svg` | 2:1 | 1200×600 px | `"1200×600 px"` | `#f3ede3` → `#d4bfa0` (L→R) |
| `about.svg` | 1:1 | 800×800 px | `"800×800 px"` | `#e8ddd0` → `#b89b7a` (diagonal 135°) |
| `showcase-1.svg` | 5:4 | 600×500 px | `"600×500 px"` | `#f3ede3` → `#c9b090` (T→B) |
| `showcase-2.svg` | 5:4 | 600×500 px | `"600×500 px"` | `#ede4d6` → `#bfa882` (T→B, +4% darker) |
| `showcase-3.svg` | 5:4 | 600×500 px | `"600×500 px"` | `#e8ddd0` → `#b89b7a` (T→B, +8% darker) |
| `showcase-4.svg` | 5:4 | 600×500 px | `"600×500 px"` | `#e2d8cc` → `#a8906a` (T→B, +12% darker) |

**SVG template (use for all — swap values per table):**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f3ede3"/>
      <stop offset="100%" stop-color="#b89b7a"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <text x="800" y="460" font-family="sans-serif" font-size="32" fill="#6b6560"
        text-anchor="middle" dominant-baseline="middle">1600×900 px</text>
</svg>
```

---

## Component file list for `components/public/home/`

| File | RSC or Client | Key props |
|---|---|---|
| `HeroSection.tsx` | RSC | `imagePath: string`, `imageAlt: string` |
| `StatsCard.tsx` | RSC | `stats: { value: string; label: string; labelEn: string }[]` — max 3 |
| `DiscoverSection.tsx` | RSC | `featuredWork: WorkCardWork`, `smallWorks: WorkCardWork[]` (3 items) |
| `AboutPanel.tsx` | RSC | `imagePath: string`, `imageAlt: string` |
| `RecentWorksStrip.tsx` | RSC | `works: WorkCardWork[]` — exactly 4 |

All components are RSC (no useState/useEffect). Motion wrappers (`FadeUp`, `Stagger`) are already client components so they can wrap RSC children safely.

---

## Page-level data requirements (for be-data)

The home `page.tsx` (RSC) needs:

```
listFeaturedWorks(limit: 1)     → WorkCardWork (featured = true, status = published)
listSmallWorks(limit: 3)        → WorkCardWork (excludes featured, published)
listRecentWorks(limit: 4)       → WorkCardWork (latest by publishedAt, published)
```

If `listFeaturedWorks` returns 0 → DiscoverSection falls back to `listRecentWorks(limit:1)` as featured. Be-data to confirm if `isFeatured` column exists on `works` table or if a different mechanism is used.

---

## Edge cases

1. **Long Thai h1** (e.g., 4 lines on small phone) — hero text column has `max-w-xl`; at 390px the font-size drops to `text-4xl` (36px) which should fit 2 lines on 375px iPhone SE. If title overflows 3 lines, clip with `line-clamp-3`. Test on 375×667 (SE).
2. **No published works** — DiscoverSection and RecentWorksStrip must both check for empty state. If 0 works, render nothing (section hidden via conditional render, no empty-state illustration on home page to avoid chrome without content).
3. **Hero image missing / 404** — `<Image>` with `onError` is client-only. Use a CSS fallback: `bg-bg2` on the image container. This is a graceful degradation, not a full error state.
4. **StatsCard desktop position (absolute)** — if hero aspect ratio shrinks on very wide screen (ultra-wide monitor), StatsCard may sit outside the visible text area. Clamp hero max-height at `max-h-[600px]` on lg+ to prevent this.
5. **ink (dark) preset** — hero gradient uses `from-ink/60`; in ink preset `--ink` is `#f5f0e8` (light), making the gradient from-light/60 — hero text changes from white to `text-ink` (`#f5f0e8`) which is still legible. **Verify contrast at design-time and confirm text color adapts.** Alternatively, hard-code hero text as `text-[#f5f0e8]` (not a token violation since it's on top of a photo).
6. **Thai vowel marks in h1** — "ห้องที่อบอุ่นเหมือนกอด" has above-base vowels. `tracking-tight` is applied only to the headline — per uxui.md §2 this is acceptable for large display serif; verify visually that vowels don't clip.
7. **Featured WorkCard h2 inside DiscoverSection** — current `WorkCard` source hard-codes `<h2>` in hero variant. On home page this creates two sibling h2s (section h2 + card h2). Implementer must resolve (see Open questions).

---

## Open questions

1. **Featured work selection mechanism** — does `works` table have an `isFeatured` boolean, or should "featured" be inferred from a tag or manual ordering? be-data to confirm before implementing `DiscoverSection` query.
2. **WorkCard `variant="hero"` heading level** — the component hard-codes `<h2>` for the hero variant title. On the home page this breaks hierarchy (section already has an h2). Options: (a) add a `headingLevel` prop to WorkCard, (b) create a `HomeFeatureCard` that renders a `<h3>`, (c) make the section h2 a `<p>` styled as h2 and put the real h2 in the card. Choose before implementation.
3. **Stat values** — are `12+`, `80+`, `4.9★` static copy or DB-driven? If static, they live in copy (labels.ts or JSX constant). If DB-driven, be-data needs a `siteStats` query or config table.
4. **Phase 2 carousel** — spec notes "static 4-card grid; Phase 2 Embla". Confirm with product whether Phase 2 is in scope for this sprint or documented as a future TODO comment only.
5. **Hero image source** — home page uses a static placeholder SVG at first. Will the hero image be a static asset or a DB-configurable media asset (admin-uploadable)? This affects whether `HeroSection` receives a hardcoded path or a dynamic one from a settings service.

---

## Hand-off

- **Implementer:** fe-public (route `src/app/(public)/page.tsx` + `src/components/public/home/`)
- **Suggested skills:** `add-public-screen`, `seo-page-checklist`, `component-anatomy`, `motion-patterns`, `page-states`
- **Depends on:** be-data to confirm featured work query + stat data source (open questions 1, 3)
- **Risk to flag in PR:** WorkCard hero h2 heading conflict (open question 2); hero text color on ink preset (edge case 5); stat accent color contrast failure resolved to `text-ink` (token map)
- **Open questions for lead:** see "Open questions" section above — items 1–5 all block implementation start or require a one-line decision
