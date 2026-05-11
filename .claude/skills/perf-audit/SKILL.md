---
name: perf-audit
description: Run a performance audit on house-peach — Lighthouse Core Web Vitals, bundle analyzer, image variants, font subsetting, RSC vs client component split, cache strategy verification, identifying slow queries. Use this skill before closing each phase, before launch, or when investigating slowness reports. Trigger on phrases like "perf audit", "Lighthouse check", "bundle size", "Core Web Vitals", "speed up the site", "page is slow", "LCP issue".
---

# Performance audit

This skill is the procedure for a comprehensive perf check on house-peach. It produces a report with concrete fixes.

## When to use

- Before closing a phase (especially Phase 7 SEO/perf)
- Before any production deploy
- When a user reports slowness on a specific route
- After adding a heavy feature (charts, filter UI, image gallery)

## Targets

- **LCP** < 2.5s (mobile, simulated 4G)
- **INP** < 200ms
- **CLS** < 0.1
- **Lighthouse Performance** ≥ 90 (target ≥ 95 before launch)
- **Per-route JS bundle** ≤ 200KB gz
- **Shared chunk** ≤ 100KB gz

## Procedure

### 1. Bundle analysis

```bash
ANALYZE=true npm run build
# Or install @next/bundle-analyzer if not yet:
# npm i -D @next/bundle-analyzer
# wire in next.config.ts then ANALYZE=true npm run build
```

Output opens in browser. Look for:
- **Largest modules per route** — anything > 50KB unexpected
- **Duplicate copies** of the same module across chunks (e.g., `lodash` v4 + v3)
- **Server-only modules in client bundle** (a leak — investigate why)
- **Polyfills** for old browsers we don't support

Common culprits:
- `lodash` full import → use `lodash/foo` or `lodash-es` with tree-shake
- `moment` → swap for `date-fns/intl-format`
- `framer-motion` (we use `motion/react` — verify no stragglers)
- Unused icon libraries
- shadcn primitive imported but not used

### 2. RSC vs client component audit

```bash
grep -rln "'use client'" src/components/ src/app/
```

For each file, ask: **does it actually need browser API?**

- Uses `useState` / `useReducer` → yes
- Has event handlers (onClick, onChange) → yes
- Uses `motion/react` → yes
- Uses browser-only API (window, localStorage) → yes
- Otherwise → convert to RSC

A common miss: a "client component" that just renders props. Move it to RSC.

### 3. Image audit

```bash
grep -rn "<img " src/                    # raw img tags = bad, use next/image
grep -rn "Image.*src=" src/ -l           # find next/image usages
```

For each `<Image>`:
- LCP image (above-fold) has `priority` prop
- `sizes` set so the right variant is fetched
- For local uploads: confirm 3 webp variants generated (`400`, `800`, `original`)

### 4. Font subset

```bash
grep -rn "next/font" src/app/layout.tsx
```

Verify:
- `next/font/google` imports DM Sans + DM Mono with `subsets: ['latin']` (and `'thai'` if Thai chars used)
- No `@import` from external CDN in CSS

### 5. Cache strategy

For each public route, identify the rendering mode and verify it matches `ARCHITECTURE.md` §10:

| Route | Expected | Check |
|---|---|---|
| `/` | static | no `cookies()` / `headers()` calls |
| `/shop` | ISR (revalidate 60) | `export const revalidate = 60` |
| `/shop/[slug]` | ISR + tag invalidation | `revalidateTag('product:<id>')` on update |
| `/bag`, `/checkout` | dynamic | uses cookies / session |
| `/admin/*` | dynamic + auth | session-gated |

Wrong mode is the most common perf miss. A page that should be ISR but accidentally became dynamic will SSR every request.

### 6. Lighthouse run

```bash
# Spin up production build
npm run build && npm start &

# Mobile (the budget that matters)
npx lighthouse http://localhost:3000           --preset=mobile  --only-categories=performance,seo,accessibility,best-practices --output=json --output=html --output-path=./reports/lh-home
npx lighthouse http://localhost:3000/shop      --preset=mobile  ...
npx lighthouse http://localhost:3000/shop/<slug> --preset=mobile ...

# Desktop (sanity check)
npx lighthouse http://localhost:3000           --preset=desktop ...
```

Lighthouse has variance. Run 3 times per URL and take the median.

### 7. DB query perf (if relevant)

If a route is slow and the cause might be DB:

```ts
// Add timing in the service
const t0 = performance.now();
const products = await db.select(...);
console.log('listProducts took', performance.now() - t0);
```

For queries > 100ms:
- Run `EXPLAIN <query>` in MySQL CLI
- Check for missing FK indexes
- Check for SELECT * pulling huge text columns

Hand off to `be-data` or `db-migration-reviewer` to add indexes.

### 8. Network waterfall

In Chrome DevTools Network tab on the slow page:
- TTFB (server response time)
- Render-blocking resources (JS / CSS in `<head>`)
- Late-loading fonts (FOIT / FOUT)
- Third-party scripts

## Report template

```
## Perf audit — <date>

### Lighthouse (mobile, 4G simulated)
| URL | Perf | LCP | INP | CLS |
|---|---|---|---|---|
| / | 96 | 1.8s | 90ms | 0.02 |
| /shop | 92 | 2.3s | 110ms | 0.04 |
| /shop/<slug> | 88 ⚠ | 2.7s ⚠ | 140ms | 0.06 |

### Bundle (gzipped)
| Route | Size | Budget | Status |
|---|---|---|---|
| / | 142KB | 200KB | ✓ |
| /shop | 167KB | 200KB | ✓ |
| /shop/[slug] | 245KB | 200KB | ✗ |

### Issues
[BLOCKING] /shop/[slug] LCP > 2.5s on mobile
  Cause: hero image not priority + late-loading DM Sans
  Fix: add `priority` to first ProductImage; preload `/_next/static/media/<font>.woff2`
  Owner: fe-public

[MAJOR] /shop/[slug] bundle 245KB (over budget by 45KB)
  Cause: components/storefront/ProductGallery imports full lodash
  Fix: replace with `import debounce from 'lodash/debounce'`
  Owner: fe-public

[MINOR] No font subset for Thai
  Cause: subsets: ['latin'] only
  Fix: add 'thai' subset
  Owner: fe-public

### Verdict
NEEDS_OPTIMIZATION (1 blocking, 1 major)
```

## Don'ts

- Don't optimize without measuring first
- Don't fixate on a single Lighthouse run (variance is real)
- Don't ignore CLS — small layout shifts compound
- Don't write the fix yourself — hand off to the owning agent
