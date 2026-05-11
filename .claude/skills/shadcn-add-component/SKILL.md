---
name: shadcn-add-component
description: Procedure for adding a shadcn/ui component to house-peach — install via CLI, integrate with project theme tokens (peach/cream/sage/ink), verify dark/light contrast, customize styling without breaking upgrades. Use this skill whenever you need a primitive that isn't already in src/components/ui/ — Button, Sheet, Dialog, DropdownMenu, Combobox, etc. Trigger on phrases like "add a shadcn component", "install button primitive", "need a dropdown", "shadcn dialog".
---

# shadcn-add-component

This skill handles the (slightly fiddly) process of adding a shadcn/ui primitive and making sure it respects our 5-theme palette.

## When to use

- A page/component needs a primitive that isn't yet in `src/components/ui/`
- Updating a primitive after a shadcn upgrade
- Customizing default shadcn styles to match the house-peach theme tokens

## Procedure

### 1. Verify the component isn't already there

```bash
ls src/components/ui/
# look for {button, input, label, sheet, dialog, dropdown-menu, ...}.tsx
```

### 2. Add via CLI

```bash
npx shadcn@latest add <component>
# e.g.
npx shadcn@latest add sheet
npx shadcn@latest add command
```

The CLI:
- Creates `src/components/ui/<component>.tsx`
- Adds any required deps (`@radix-ui/...`)
- May update `components.json`

### 3. Verify the file uses our theme aliases

shadcn uses `bg-background`, `text-foreground`, `border-border` etc. — class names mapped via `@theme inline` in `globals.css`. Ours are mapped to project tokens:

```css
/* src/app/globals.css */
@theme inline {
  --color-background: var(--bg);
  --color-foreground: var(--ink);
  --color-card: var(--card);
  --color-muted-foreground: var(--muted);
  --color-border: var(--line);
  --color-accent: var(--accent);
  --color-primary: var(--ink);
  --color-primary-foreground: var(--bg);
}
```

If shadcn uses a class like `text-foreground` and our `@theme inline` maps `--color-foreground: var(--ink)`, the primitive renders in the correct theme color automatically.

If a class doesn't have a mapping (e.g., `text-destructive`), add it:

```css
@theme inline {
  --color-destructive: #c4684e;     /* warm red that fits the palette */
  --color-destructive-foreground: var(--bg);
}
```

### 4. Test on all 4 themes

Open the component in a `_dev/tokens` or storybook page and switch through peach / cream / sage / ink. Verify:

- Contrast looks right
- Border / muted / accent legible
- Dark theme (`ink`) doesn't break

If a theme breaks, the fix is at the token level (in `themes.css`), not the component itself.

### 5. Customize sparingly

Don't fork the component file just to change a style. Instead:

- **Variants**: most shadcn components use `cva` (class-variance-authority); add a variant if needed
- **Wrapper**: create a thin wrapper at `src/components/storefront/<Brand>Button.tsx` that imports the primitive and adds default classes
- **Token tweak**: change the underlying CSS var

If you must edit the primitive (e.g., shadcn ships an extra div you don't want), document why in a comment.

### 6. Mobile-first check

Many shadcn primitives are responsive by default but verify:

- Sheet on mobile uses bottom-side slide-up (matches design)
- Dialog on mobile is full-width or near-full-width
- DropdownMenu is reachable via touch
- Min tap target 44px for trigger elements

### 7. A11y check

shadcn primitives are accessible by default (Radix-based) — but verify:

- Trigger has appropriate `aria-*` (Radix handles)
- If you wrap, don't break the slot pattern
- Focus management on close (Radix handles) — but verify with keyboard test

## Where to use which primitive

| Use case | Component |
|---|---|
| Bottom-up filter / cart sheet | `<Sheet side="bottom">` |
| Modal confirm | `<Dialog>` or `<AlertDialog>` |
| Dropdown menu (admin actions) | `<DropdownMenu>` |
| Searchable select | `<Command>` + `<Combobox>` |
| Tooltip | `<Tooltip>` |
| Toast | `<Toaster>` (sonner) |
| Tabs | `<Tabs>` |
| Form inputs | `<Input>`, `<Textarea>`, `<Select>`, `<Checkbox>`, `<RadioGroup>`, `<Switch>` |
| Data table | `<Table>` + `@tanstack/react-table` (admin) |

## Common gotchas

- `<Sheet>` requires `'use client'` and a button with `<SheetTrigger asChild>` — the wrapper has `asChild` slot
- `<Dialog>` portals to body — won't be styled by parent CSS contexts; verify dark theme still applies
- `<Form>` from shadcn is RHF wrapper; integrate carefully with our zod resolver
- shadcn upgrades occasionally rename Tailwind class names — when upgrading, diff against the existing file before overwriting

## Don'ts

- Don't fork the primitive file unless you must — defeats updates
- Don't use raw Radix; let shadcn provide the styled wrapper
- Don't mix shadcn class names with Tailwind utilities for the same property (e.g., `text-foreground text-zinc-800`) — pick the alias
- Don't skip testing on the `ink` (dark) theme — most contrast bugs hide there
