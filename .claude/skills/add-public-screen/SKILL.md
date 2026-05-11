---
name: add-storefront-screen
description: How to add a new public storefront screen to house-peach — route file, layout, theme tokens, motion, mobile-first layout, bilingual labels, SEO metadata, JSON-LD when applicable. Use this skill whenever you're creating a new page under app/(storefront)/, translating a screen from claude-design-housepeach/*.jsx into Next.js code, or adding a new flow that customers will browse. Trigger when prompts mention building a "screen", "page", "route", "storefront view", or porting a specific screen like "the bag screen" or "product detail page".
---

# Add a storefront screen

This skill walks you through adding a new public-facing route in `src/app/(storefront)/`. Most house-peach screens already exist in `claude-design-housepeach/screens.jsx` or `factory.jsx` as inline-style React — your job is to translate them.

## When to use

- You're translating a design screen (e.g., `HomeScreen`, `ShopScreen`, `ProductScreen`, `BagScreen`) into a real Next.js page
- You're adding a new route that doesn't exist in design (rare — confirm with the user first)

## Procedure

### 1. Read the design source

```bash
# Example: porting BagScreen
grep -n "function BagScreen" claude-design-housepeach/screens.jsx
```

Read the function body and identify:
- Layout structure (sections, grids, sticky bars)
- State held locally (this often becomes server state or stays client)
- Animations used (`fadeUp`, `slideUp`, `pop`)
- Inline-style colors (translate to CSS vars)
- Click handlers and navigation (`go(...)`)

### 2. Decide RSC vs client

- Default: **Server Component**
- Switch to `'use client'` only when you need: state, event handlers, browser API, `motion/react`

For a typical storefront page, the page itself is RSC (fetches data server-side) and interactive parts are extracted into client subcomponents. Example:

```
app/(storefront)/shop/page.tsx           # RSC: fetches products
└── components/storefront/
    ├── ShopGrid.tsx                     # RSC: renders cards
    ├── ShopFilterChips.tsx              # 'use client': category selector
    └── ShopFilterSheet.tsx              # 'use client': bottom sheet
```

### 3. Create the route

```ts
// src/app/(storefront)/shop/page.tsx
import type { Metadata } from 'next';
import { listActiveProducts } from '@/lib/services/product';
import { ShopGrid } from '@/components/storefront/ShopGrid';

export const metadata: Metadata = {
  title: 'Shop — house-peach',
  description: 'Shop the house-peach collection — minimalist warm-tone essentials in linen, cotton, and wool.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;   // Next 16 — searchParams is a Promise
}) {
  const { cat } = await searchParams;
  const products = await listActiveProducts({ categorySlug: cat });
  return <ShopGrid products={products} />;
}
```

> Next 16 note: `params` and `searchParams` are now Promises. Always `await` them. If your training data shows them as objects, that's old.

### 4. Mobile-first layout

- Build at viewport 390×844 first
- Use Tailwind utility classes mapped to theme tokens (`text-ink`, `bg-card`, `border-line`, `text-muted`)
- Sticky bottom bars: `pb-[env(safe-area-inset-bottom)]`
- Tab bar: `md:hidden` (mobile only); desktop top nav: `hidden md:flex`

### 5. Theme tokens — never hardcode colors

Wrong:
```tsx
<div style={{ background: '#f3ebde' }}>
```

Right:
```tsx
<div className="bg-bg">
```

If the design uses a color not yet in tokens, add it to `src/styles/themes.css` for all 5 presets first (peach/cream/sage/ink) — never just one preset.

### 6. Motion

Use the wrappers in `src/components/motion/`:

```tsx
import { FadeUp } from '@/components/motion/FadeUp';

<FadeUp>
  <ProductCard />
</FadeUp>
```

If your screen needs a new keyframe, add a wrapper in `motion/`. Keyframes from design:
- `fadeUp` (0.35s y:8→0, opacity 0→1) — screen transitions
- `slideUp` (translateY 100%→0) — sheets
- `pop` (scale 0.6 → 1.15 → 1) — badges
- `fade` — image swaps

Always check `useReducedMotion()`:

```tsx
const reduce = useReducedMotion();
<motion.div animate={reduce ? {} : { y: 0, opacity: 1 }} />
```

### 7. Bilingual labels

UI strings go through `src/lib/i18n/labels.ts`. Don't hardcode:

```tsx
import { labels } from '@/lib/i18n/labels';
import { useLocale } from '@/lib/i18n/useLocale';
const lang = useLocale();
<button>{labels.addToBag[lang]}</button>
```

For tab/section headings, the design uses `English · ภาษาไทย` pairs:

```tsx
<span>Shop · ร้านค้า</span>
```

### 8. A11y baseline

- One `<h1>` per page (page subject)
- Every interactive element keyboard reachable + visible focus ring
- Icon-only buttons → `aria-label`
- Images → descriptive `alt`
- Forms → `<label htmlFor>` for every input

Run `a11y-review` skill before handing off.

### 9. SEO

- `metadata` exported (or `generateMetadata` for dynamic)
- Title format `<page> — house-peach`
- For product detail pages: include JSON-LD (use `seo-page-checklist` skill)
- Add to `app/sitemap.ts` if it's a route worth indexing

### 10. Verify

```bash
npm run build       # type-check + render-time errors
npm run lint
```

Open the page on:
- Mobile viewport 390×844 (iPhone 14)
- Tablet 768×1024
- Desktop 1280×800
- Test with keyboard only (Tab, Shift+Tab, Enter, Esc)
- Test with browser at min 200% zoom — no horizontal scroll

## Output expectations

When you're done, your handoff should include:
1. Files created/modified
2. New route(s) and what query params they accept
3. Components created — props contract
4. Any new theme tokens added
5. Bilingual labels added to `labels.ts`
6. Confirmation of mobile/desktop test
7. Lighthouse perf score (rough)

## Don'ts

- Don't translate inline `style={{ ... }}` literally; use Tailwind + theme tokens
- Don't add `'use client'` to the page component if you don't need it — keep RSC for SSR/SEO
- Don't fetch data in client components; fetch in RSC and pass props
- Don't skip `generateMetadata` "to do later" — Google indexes day one
