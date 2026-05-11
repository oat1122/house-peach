---
name: mdx-component-add
description: Procedure for adding a new MDX-renderable component to house-peach blog/work content — implement React component, register in whitelist at lib/mdx/components.tsx, write unit test for compile + render, handle security review. Use this skill whenever a content author asks for a new block type (e.g., Callout, ProductCardEmbed, MoodBoard) or when extending MDX expressiveness. Trigger on phrases like "add MDX component", "new MDX block", "register Aside", "MDX whitelist", "custom block for blog".
---

# Add a new MDX component

This skill covers the procedure for adding a new component that admin/editor can use inside MDX content. The whitelist is the **security boundary** — every new component is a new surface.

## When to use

- Content author asks for a new block type (e.g., `<Callout>`, `<Map>`, `<RoomMeasurements>`)
- Need to expose data-driven UI in blog body (e.g., embed work card by slug)
- Improving the expressiveness of MDX for a new content pattern

## When NOT to use

- The component is fine as plain React used in `(public)/**` page files but isn't needed inside content — keep it out of MDX whitelist (less surface area)
- The behavior is a one-off formatting tweak — use existing components

## Procedure

### 1. Decide the API

Design the props shape minimally — every prop is something admin must spell correctly in MDX. Examples:

```mdx
<!-- Good: minimal, declarative -->
<Callout type="warning">เลี่ยงใช้น้ำกับพื้นวีเนียร์</Callout>

<!-- Bad: complex props that admin can't get right easily -->
<Callout style={{ background: '#fee', padding: '1rem 2rem' }} children="..." />
```

Prefer enum-style props (`type="warning"`) over freeform values.

### 2. Build the component (fe-public)

`src/components/mdx/Callout.tsx`:

```tsx
import { ReactNode } from 'react';
import { AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const variants = {
  note:    { Icon: Info,         cls: 'border-line bg-card text-ink' },
  tip:     { Icon: CheckCircle2, cls: 'border-sage bg-sage/10 text-ink' },
  warning: { Icon: AlertCircle,  cls: 'border-accent bg-accent/10 text-ink' },
} as const;

type Props = { type?: keyof typeof variants; children: ReactNode };

export function Callout({ type = 'note', children }: Props) {
  const { Icon, cls } = variants[type];
  return (
    <aside className={`rounded-md border p-4 my-4 flex gap-3 ${cls}`} role="note">
      <Icon className="shrink-0 mt-0.5" size={18} aria-hidden />
      <div className="prose-sm">{children}</div>
    </aside>
  );
}
```

Constraints:
- **Server-compatible** — component must render in RSC (no `useState`, no event handlers); MDX compile happens server-side
- **Accessible** — proper semantic element (`<aside>`, `<figure>`, etc.), `role`, `aria-*` if needed, no color-alone information
- **Theme-consistent** — use Tailwind aliases mapped to CSS vars (`text-ink`, `bg-card`, `border-line`) — no raw hex
- **Reduced-motion safe** — if you animate, check `useReducedMotion()` (rare in MDX components)

If the component genuinely needs client behavior (e.g., interactive `<Lightbox>`), mark with `'use client'` — but be aware it adds JS to every post body that uses it.

### 3. Register in whitelist (be-data)

`src/lib/mdx/components.tsx`:

```ts
import { Callout } from '@/components/mdx/Callout';
// ... other imports

export const mdxComponents = {
  // overrides
  h2: H2WithAnchor,
  h3: H3WithAnchor,
  img: MDXImage,
  // existing custom
  MDXImage, Quote, Aside, Gallery, CodeBlock,
  // NEW
  Callout,
};
```

After this, `<Callout type="warning">...</Callout>` in any post `bodyMdx` will render.

### 4. Add unit tests (qa-tester)

`src/lib/mdx/compile.test.ts` — add cases:

```ts
describe('Callout MDX component', () => {
  it('renders with correct variant class', async () => {
    const node = await compileMdxToReact('<Callout type="warning">ระวัง</Callout>');
    const html = renderToStaticMarkup(node);
    expect(html).toContain('role="note"');
    expect(html).toContain('ระวัง');
  });
  it('defaults to note variant when type missing', async () => {
    const node = await compileMdxToReact('<Callout>hello</Callout>');
    const html = renderToStaticMarkup(node);
    expect(html).toContain('role="note"');
  });
});
```

Also verify the whitelist invariants still pass:

```ts
it('still strips <script> after adding Callout', async () => {
  // ... existing test should still pass
});
```

### 5. Security review (security-auditor)

Ping `security-auditor` for review of the new component. Reviewer checks:
- Component doesn't accept props that flow unescaped into `dangerouslySetInnerHTML`
- No `eval` / `Function()` constructor / `new Function`
- No fetch/network calls
- No `localStorage` / cookie reads
- Props enum/whitelist is enforced (e.g., `type` only accepts known variants — don't render arbitrary `type` strings into attribute)

### 6. Document in content rules

If the new component changes the content authoring story (e.g., adds a new style block), update `.claude/rules/content.md` example list under "Whitelist component" section.

### 7. Update admin preview

The `MdxPreview` component in `components/admin/` calls the same `compileMdxToReact()`, so the new component renders automatically. No additional admin wiring needed.

Optionally: add a "Insert Callout" toolbar button to the CodeMirror editor that inserts a snippet — quality-of-life, not required.

## Verify

- [ ] Component renders in `compileMdxToReact()` output
- [ ] Unit test passes (compile + render)
- [ ] Whitelist invariants still pass (`<script>` still stripped)
- [ ] Admin preview shows correct rendering
- [ ] Component looks correct on all 4 themes (peach/cream/sage/ink)
- [ ] Accessibility: semantic element, contrast OK, no color-alone meaning
- [ ] No client-side JS unless required (check bundle delta with bundle analyzer)
- [ ] Security review signed off
- [ ] `.claude/rules/content.md` updated if list of whitelist components is mentioned

## Don'ts

- Don't whitelist HTML primitives that could enable XSS: `<script>`, `<iframe>`, `<embed>`, `<object>`, `<form>`, `<input>`, `<style>`
- Don't accept arbitrary `className` or `style` props from MDX — admin would defeat the design system
- Don't read network / DB / cookies from MDX-renderable components — keep them pure
- Don't allow `dangerouslySetInnerHTML` in MDX components — defeats the whitelist
- Don't ship a heavy library (charting, video player) without lazy-loading and bundle measurement
