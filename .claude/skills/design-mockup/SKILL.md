---
name: design-mockup
description: Procedure for producing a design spec + ASCII/markdown mockup for a house-peach screen or component before any code is written. Covers brand-feel filter, mobile-first layout sketch, component breakdown with shadcn-first primitive choice, state matrix, typography/spacing/color decisions tied to theme tokens, motion plan, bilingual copy, a11y notes, and hand-off output. Use this skill when the designer agent kicks off a new screen, redesigns an existing one, or needs to align with implementers before they start. Trigger on phrases like "design spec", "mockup the screen", "ASCII wireframe", "propose a layout", "before implementation", "design hand-off".
---

# design-mockup

This skill is the **designer agent's main procedure** — produce an implementation-ready spec without writing production code.

The output is a markdown file in `docs/design/<screen>.md` that fe-public or fe-admin can pick up and build from directly. If the implementer comes back to ask clarification, the spec was incomplete.

## When to use

- New public screen (home, blog, works, about, contact variants)
- New admin screen (post editor, work form, media library tab)
- Redesign / refactor of an existing screen
- New reusable component that doesn't have a shadcn equivalent
- Visual issue report ("hero feels cramped") — produce 2-3 variants

## When NOT to use

- The screen is already specified — just implement (call fe-public / fe-admin)
- Trivial visual tweak (one color, one size) — fe-public / fe-admin handles inline
- Bug fix — designer not in the loop unless visual root cause

---

## Procedure

### 1. Read context

```bash
# rules — the design language
cat .claude/rules/uxui.md
cat .claude/rules/accessibility.md
cat .claude/rules/i18n.md
cat .claude/rules/stack.md     # § Component sourcing

# theme tokens
cat src/styles/themes.css

# existing primitives — don't reinvent
ls src/components/ui/
ls src/components/public/
ls src/components/admin/
```

If the request mentions a "similar" or "like the X page" reference — read that screen first.

### 2. Brand-feel filter (uxui.md § 1)

Write down 2 specific words this screen should evoke (e.g., "calm, observational", "intimate, handcrafted"). If the request implies "loud, urgent, sales-y" → push back: that's not house-peach.

### 3. Sketch mobile-first (390 wide)

ASCII mockup at iPhone width. Show every visible block top-to-bottom. Include approximate heights when relevant.

```
┌─────────────────────────────────┐
│ logo                ≡ menu      │  64px top
├─────────────────────────────────┤
│                                 │
│        hero image               │  aspect 16:9
│                                 │
├─────────────────────────────────┤
│ Featured · ผลงานเด่น            │  eyebrow text-xs uppercase
│                                 │
│ Headline serif over             │
│ two lines                       │  text-5xl serif
│                                 │
│ Lead paragraph muted            │  text-lg text-muted
│                                 │
│ [ เริ่ม ]   ดูผลงาน →           │  CTA + secondary
└─────────────────────────────────┘
```

Then sketch the desktop (≥md) variant — usually wider columns, horizontal nav, more whitespace.

### 4. Component breakdown — shadcn-first

For every block in the mockup, fill a table:

| Block | Primitive | Source | Justification |
|---|---|---|---|
| Top bar | `<AppHeader>` | `components/public/AppHeader.tsx` (exists) | reuse |
| CTA button | `<Button variant="default">` | shadcn — already in `components/ui/button.tsx` | reuse |
| Secondary link | `<Link>` styled `text-accent underline` | next/link + Tailwind | trivial, no component |
| Hero image | `<Image>` | next/image | `priority`, `sizes` |
| Lead paragraph | `<p>` | — | `text-lg text-muted max-w-prose` |

**For any "custom" row, justify why a shadcn or Radix primitive isn't sufficient** (per `stack.md` § Component sourcing). If you can't justify → use the primitive.

### 5. State matrix (uxui.md § 10)

For every interactive element, specify the 9 states briefly. Skip rows where states match the uxui.md default — just note "uxui.md defaults".

### 6. Typography & spacing decisions

Reference `uxui.md` § 2 + § 3. List **only deviations or specific choices**:

```
h1:               font-serif text-5xl md:text-7xl tracking-tight
section padding:  py-12 md:py-24
section gap:      space-y-16 md:space-y-24
container:        max-w-6xl mx-auto px-4 md:px-6
article body:     max-w-prose (~65ch) for legibility
```

### 7. Color usage — verify across 4 themes

List which tokens this screen uses + where:

| Token | Usage |
|---|---|
| `bg-bg` | page background |
| `bg-bg2` | alternating "featured posts" section |
| `text-ink` | body |
| `text-muted` | lead paragraph, meta |
| `bg-accent text-bg` | primary CTA |
| `border-line` | card border, divider |

**Mentally test on all 4 presets (peach / cream / sage / ink).** Flag any contrast risk:

> ⚠️ On `ink` theme, `text-muted` over `bg-bg2` is ~4.2:1 — borderline AA. Consider darker muted variant.

### 8. Motion plan (uxui.md § 14 + skill `motion-patterns`)

Pick from the 4 keyframes:

- `fadeUp` 0.35s — section enter on scroll
- `slideUp` 0.3s spring — sheet open
- `pop` spring — badge change
- `fade` 0.2s — image swap

Note reduced-motion fallback: "respects `useReducedMotion()` — when on, opacity 1 + no transform". If no motion: write "static — no motion".

### 9. Bilingual copy (uxui.md § 15 + i18n.md)

Provide TH + EN for every visible string. Verb-first CTAs, sentence case EN:

```
eyebrow:        Featured · ผลงานเด่น
headline en:    Rooms that feel like a hug
headline th:    ห้องที่อบอุ่นเหมือนกอด
lead en:        Quiet rooms with natural light and slow, soft details.
lead th:        ห้องสงบ แสงธรรมชาติ ดีเทลเรียบช้า อบอุ่น
cta primary:    เริ่มโปรเจกต์ / Start a project
cta secondary:  ดูผลงาน → / See our work →
```

If you're unsure of a Thai phrasing, write `[TH-review needed]` — don't guess.

### 10. A11y notes

- Heading hierarchy listed (h1 → h2 → h3, no skip)
- Every image has descriptive alt suggested
- Tab order described: skip link → logo → main nav → first CTA → secondary
- Touch targets ≥ 44px verified for every tappable element
- Focus ring spec (uxui.md default unless screen-specific reason)

### 11. Edge cases

List the cases that will break the design if not handled:

- Long Thai headline (4 lines) — does the hero still balance?
- Missing cover image — what's the fallback (gradient + initial mark)?
- 0 featured works — hide the section entirely or show empty state?
- Mobile keyboard open on form — does fixed bottom bar stay visible?

### 12. Hand-off block

End the spec with explicit hand-off:

```markdown
## Hand-off

- **Implementer:** fe-public (route `app/(public)/blog/page.tsx`)
- **Suggested skills:** `add-public-screen`, `seo-page-checklist`, `page-states`, `motion-patterns`
- **Depends on:** none / `be-data` to expose listPublishedPosts with tag filter
- **Risk to flag in PR:** none / "X token contrast borderline on ink — verify with a11y-reviewer"
- **Open questions for the lead:** none / "pagination: load-more vs numbered — pick one"
```

### 13. Save the spec

```
docs/design/<screen-or-component>.md
```

If `docs/design/` doesn't exist yet, create it. Commit the spec separately from any implementation work.

### 14. Notify

If running under MP dispatcher → reply with the spec path + 1-line summary.
If running directly under the lead → reply with the spec path + "ready for fe-public" (or fe-admin).

---

## Mockup ASCII conventions

Stick to these so all specs look the same:

```
┌─────┐    box (use Unicode light box-drawing)
│     │
└─────┘

[ Button label ]      primary CTA (with spaces inside)
Link text →           secondary text link
█████████             image placeholder block
─────                 divider
···                   ellipsis / more content
≡                     hamburger menu
×                     close button
←  →  ↑  ↓            arrows
```

For grids, use a simple repeating block:

```
┌─────┐ ┌─────┐ ┌─────┐
│ img │ │ img │ │ img │
└─────┘ └─────┘ └─────┘
title    title    title
```

---

## Spec template (copy-paste)

```markdown
# Design spec — <name>

## Purpose
<1-2 sentences>

## Audience & device
- Primary: mobile / desktop
- Context: <user scenario>

## Brand-feel
<2 words from uxui.md § 1>

## Layout — mobile (390)
<ASCII>

## Layout — desktop (≥md)
<ASCII or "stack horizontal, ...">

## Component breakdown
| Block | Primitive | Source | Notes |
|---|---|---|---|
| ... | ... | ... | ... |

## States
<table or "uxui.md defaults except X">

## Typography & spacing
<list deviations only>

## Color tokens used
<list>

## Motion
<plan or "static">

## Copy (TH + EN)
<list every visible string>

## A11y notes
<headings, alt, tab order, touch targets>

## Edge cases
<list>

## Hand-off
- Implementer: <agent>
- Skills: <list>
- Depends on: <list or "none">
- Risk to flag: <list or "none">
- Open questions: <list or "none">
```

---

## Don'ts

- Don't write production `.tsx` — the spec is the output
- Don't propose layouts at desktop width first — mobile-first or it's invalid
- Don't invent a custom component when shadcn / Radix has one
- Don't decide brand voice in TH if you're not bilingual — mark `[TH-review needed]`
- Don't include "implementation detail" code in the spec (no useState, no useEffect) — describe behavior, not code
- Don't pad spec with rules text — link to `uxui.md` § N, don't quote it
- Don't approve own spec — hand off + let the implementer or MP confirm fit

## Pairs with

- `.claude/rules/uxui.md` — every decision traces back here
- `.claude/skills/component-anatomy/SKILL.md` — reuse templates when applicable
- `.claude/skills/shadcn-add-component/SKILL.md` — when spec needs a new primitive
- `.claude/skills/motion-patterns/SKILL.md` — animation wrapper choice
- `.claude/skills/a11y-review/SKILL.md` — quick check before hand-off
