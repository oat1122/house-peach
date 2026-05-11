---
name: a11y-review
description: Self-check accessibility procedure for house-peach components and pages — semantic HTML, ARIA, keyboard navigation, focus management, color contrast across all 4 themes, reduced motion, touch targets, screen reader compatibility, automated audits (Lighthouse/axe/WAVE). Use this skill before handing off a component to PR review, before closing a phase, or after adding any new interactive UI. Trigger on phrases like "a11y check", "accessibility self-check", "WCAG audit", "is this accessible", "test with keyboard", "screen reader friendly".
---

# a11y self-review

This skill is the procedure a frontend agent runs **before** asking the `a11y-reviewer` agent for review. Catching obvious issues yourself saves a roundtrip.

## When to use

- Before submitting a PR that touches UI
- Before closing a phase (Phase 7 perf/a11y polish)
- After adding any new interactive component (button, form, sheet, modal)

## The pre-flight checklist

Run through this in order. Each check is fast.

### 1. Semantic HTML

```bash
grep -rn '<div' src/components/storefront/<your-file>.tsx | grep -i 'onClick\|role='
```

Anything that's interactive should be a `<button>`, `<a href>`, `<input>`, etc. — not `<div onClick>`. Fix any hits.

### 2. Heading hierarchy

In your page, count headings:

```bash
grep -E '<h[1-6]' src/app/(storefront)/<your-route>/page.tsx
```

- One `<h1>` per page (the page subject)
- No skipped levels (h1 → h2 → h3, never h2 → h4)

### 3. Icon-only buttons

```bash
grep -rn 'button' src/components/storefront/<file>.tsx
```

For each button containing only an icon (no text child), verify it has `aria-label`:

```tsx
<button aria-label="เพิ่มลงตะกร้า"><Icon.Bag /></button>
```

### 4. Focus rings

```bash
grep -rn 'outline-none\|outline:\s*0\|outline:\s*none' src/
```

Any hit must be paired with `focus-visible:ring-*` to provide an alternative focus ring. Search shouldn't return results without that pairing.

### 5. Form labels

For each input/textarea/select in your component, verify there's an associated `<label htmlFor>`:

```tsx
<label htmlFor="email">อีเมล</label>
<input id="email" type="email" />
```

If the label needs to be visually hidden, use `sr-only`:

```tsx
<label htmlFor="search" className="sr-only">ค้นหา</label>
<input id="search" placeholder="Search products..." />
```

Placeholder is NOT a label.

### 6. Image alt

```bash
grep -rn 'next/image\|<img' src/components/storefront/<file>.tsx
```

Every `<Image>` needs descriptive `alt`:
- Informative image: descriptive text (`"${product.name} in ${variant.colorName}"`)
- Decorative image: empty `alt=""`
- Don't omit `alt` attribute

### 7. Color contrast — across all 4 themes

This is harder to grep — use a manual check or Lighthouse.

In dev, switch through `peach`, `cream`, `sage`, `ink` in the theme switcher. For each:

- Body text legible on background?
- Disabled state visible but distinguishable?
- Focus ring visible?
- Error state legible?

The `ink` (dark) theme is where most contrast bugs hide — pay extra attention there.

### 8. Color alone

For any state communicated by color (error / success / disabled), verify there's also:
- An icon
- A text label
- A pattern / underline / border style

Wrong:
```tsx
<input className={hasError ? 'border-red-500' : 'border-line'} />
```

Right:
```tsx
<input
  aria-invalid={hasError}
  className={hasError ? 'border-red-500' : 'border-line'}
/>
{hasError && <span role="alert">⚠ {errorMessage}</span>}
```

### 9. Reduced motion

For every `motion.*` element in the file, verify it checks `useReducedMotion()`:

```bash
grep -rn 'motion\.\|animate=' src/components/storefront/<file>.tsx
```

Each hit should be in a component that calls `useReducedMotion()` and respects it.

### 10. Touch targets

For each button/interactive element, verify visually that it's at least 44×44px on mobile. If smaller (e.g., a close `X` icon), wrap with padding to extend hit area:

```tsx
<button className="p-3" aria-label="Close">     {/* p-3 = 12px padding */}
  <Icon.X size={16} />                            {/* 16 + 24 = 40 — bump padding to p-3.5 for 44 */}
</button>
```

### 11. Modals / sheets / dialogs

If you used shadcn `<Dialog>` / `<Sheet>` / `<DropdownMenu>`, focus trap and Esc-close are handled. Verify by:

- Open the sheet
- Tab through — focus stays inside
- Press Esc — closes
- Press Tab while closed — focus returns to trigger

If you rolled custom modal code, replace it with shadcn primitive.

### 12. Skip link

If this is a top-level page, the layout should have a skip link near the top:

```tsx
<a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-card focus:p-2 focus:ring-2">
  ข้ามไปยังเนื้อหา
</a>
<main id="main">...</main>
```

If missing, add in `app/(storefront)/layout.tsx`.

### 13. Live regions

For status updates (toast, "added to cart" feedback), use `role="status"` + `aria-live="polite"`:

```tsx
<div role="status" aria-live="polite" className="sr-only">
  {message}
</div>
```

For urgent (form error after submit), use `aria-live="assertive"`.

## Automated checks

After the manual sweep:

### Lighthouse a11y

```bash
npm run build && npm start &
npx lighthouse http://localhost:3000/<route> --preset=mobile --only-categories=accessibility
```

Target: ≥ 95. Below that = something obvious is broken.

### axe DevTools

Install [axe DevTools](https://www.deque.com/axe/devtools/) browser extension.
- Open the page
- Run "Scan ALL of my page"
- Target: 0 violations

### WAVE

[WAVE](https://wave.webaim.org/) browser extension. Target: 0 errors.

## Manual screen reader test

Pick at least one critical flow per phase and test:

- **macOS**: VoiceOver (`Cmd+F5`)
- **Windows**: NVDA (free download)

Listen — does the flow make sense? Are buttons announced? Are errors read?

Record any "this is confusing" moments. Address before PR.

## Output

When you've completed self-check, your PR description should include:

```
## a11y self-check
- [x] semantic HTML (no div onClick)
- [x] heading hierarchy correct
- [x] icon-only buttons have aria-label
- [x] focus rings present
- [x] form labels associated
- [x] images have descriptive alt
- [x] color contrast verified on all 4 themes
- [x] color alone not used for state
- [x] motion respects prefers-reduced-motion
- [x] touch targets ≥ 44px
- [x] modals use shadcn primitives
- [x] Lighthouse a11y: 96
- [x] axe DevTools: 0 violations
- [ ] Manual VoiceOver smoke: pending

Issues found and fixed: <list>
```

This signals to `a11y-reviewer` that you've done the basics — they can focus on edge cases.

## Don'ts

- Don't ship UI without running this checklist — even a small button can break a flow
- Don't rely only on Lighthouse — manual keyboard test catches things automation misses
- Don't add `tabIndex="-1"` to interactive elements — that hides them from keyboard users
- Don't suppress focus rings without replacement — keyboard users are blind to where they are
