---
name: simplify-reuse
description: Self-review procedure for cleaning up code and maximizing reuse in house-peach — find duplication, dead code, premature abstraction, oversized files/functions, and opportunities to replace custom code with existing shadcn primitives or repo utilities. Use this skill after implementing a feature, before opening a PR, when a file feels too long, or when refactoring legacy code. Trigger on phrases like "clean up this code", "refactor", "simplify", "deduplicate", "code smell", "reuse check", "is this DRY", "shorten this file".
---

# simplify-reuse

This skill is a self-review pass: scan the code you just wrote (or an existing file) for clean-code violations and reuse opportunities, then fix what you find. Pair with [`.claude/rules/clean-code.md`](../../rules/clean-code.md) (invariants) and [`.claude/rules/stack.md`](../../rules/stack.md) § Component sourcing.

## When to use

- Right after finishing a feature, before opening a PR
- When a file crosses size thresholds (component > 200 lines, service > 300, util > 20)
- When you notice copy-paste pattern across 2-3 files
- When reviewing PR from another agent
- Before closing a phase

## Don't use for

- Greenfield design — too early, you don't know what duplicates yet
- Working code that the user hasn't asked to refactor — *don't refactor for sport*

---

## Procedure

### 1. Inventory the diff / target

```bash
# what files did you change?
git status
git diff --stat HEAD

# or for a specific file
wc -l src/components/public/PostCard.tsx
```

Note the LOC of each touched file. Anything over thresholds in `clean-code.md` § 3 is a candidate.

### 2. Search for duplication

For each new function / component / pattern, grep the repo:

```bash
# is there already a slugify? a formatDate? a buildMetadata?
```

Use Grep:
- Function name fragments (`slug`, `format`, `build`, `to`)
- String literals you just hard-coded (`'published'`, `'house-peach'`, magic numbers)
- Tailwind class clusters you just wrote (e.g., `aspect-[3/2] rounded-md object-cover`)

If you find ≥ 3 occurrences of the same pattern → extract per `clean-code.md` § 2 (rule of three).

If you find ≥ 2 with slightly different shapes → **don't** extract yet. Document with a memory or wait for the third.

### 3. Check for "did I just rebuild a shadcn / Radix primitive?"

For every JSX-heavy component, ask:

| If you wrote… | shadcn has it |
|---|---|
| Custom `<button>` with variants + loading state | `<Button variant="..." />` (already in `components/ui/button.tsx`) |
| Custom modal with backdrop + ESC + focus trap | `<Dialog>` / `<Sheet>` |
| Custom dropdown / select | `<DropdownMenu>` / `<Select>` / `<Combobox>` |
| Custom toast | `<Sonner />` (already wired) |
| Custom tab UI | `<Tabs>` |
| Custom tooltip | `<Tooltip>` |
| Custom skeleton | `<Skeleton>` |
| Custom popover | `<Popover>` |
| Custom command palette / search | `<Command>` |
| Custom accordion / collapsible | `<Accordion>` / `<Collapsible>` |

If shadcn has it → install via CLI (see [`shadcn-add-component`](../shadcn-add-component/SKILL.md)) and delete the custom version.

### 4. Check for "did I just rebuild a repo utility?"

Cross-reference these paths before keeping custom logic:

```
src/lib/utils/         ← slug, readingTime, cn, format helpers
src/lib/validation/    ← zod schemas — Insert / Update / Select / Public
src/lib/services/      ← DB queries — get / list / create / update / delete
src/lib/seo/           ← buildMetadata, JSON-LD builders
src/lib/i18n/labels.ts ← bilingual label table
src/lib/auth.ts        ← auth(), requireRole
src/components/motion/ ← FadeUp, Stagger, SlideUpSheet
```

If you wrote a local `slugify`, `formatDate`, `buildMetadata`, `requireAdmin`, etc. — replace with import.

### 5. Function / file size pass

For each file in diff:

- **Component > 200 lines** → can you split into container + presentation? sub-components for sections?
- **Service > 300 lines** → split by read vs write? by sub-domain?
- **Function > 50 lines** → does it do > 1 thing? extract a step.
- **Nesting > 3 levels** → use early return / guard clauses (`clean-code.md` § 3).

### 6. Naming pass

Quick scan:

- Booleans use `is*` / `has*` / `can*` / `should*`?
- Functions verb-first (`getPost`, not `postGetter`)?
- Variables descriptive (not `p`, `cnt`, `data`)?
- File names follow convention (PascalCase components, camelCase utils)?

### 7. Dead code & comments pass

- `git diff` — any commented-out code blocks? **delete**
- `// removed:` / `// old:` / `// added for issue X` comments? **delete** (git history covers it)
- JSDoc paragraphs explaining WHAT the code does? **delete**, keep only WHY-comments
- Unused exports? grep — if no caller, **delete**
- Unused imports / vars? ESLint catches — fix.

### 8. Magic numbers / strings → const

Scan for:

- Numeric literals other than `0, 1, -1, 2` → name them
- String literals used > once (status values, role values, tag names) → const or enum-like
- Tailwind class clusters used > once → variant in cva or wrapper component

### 9. Premature abstraction smell

For each "generic" piece, ask:

- Does this `<T>` have **only one** concrete use? → inline.
- Does this `options` param have **only one** option that's ever set? → inline.
- Does this `Interface` have **one** implementation? → delete the interface, use the class/object directly (exception: `ImageStore` per decision D2).
- Did I add a feature flag for code that's already shipped? → remove the flag.

### 10. Error handling boundary check

- Internal helper has try/catch that just swallows or re-throws? → **delete the try/catch**
- Route handler / server action **entry** has no error handling? → add (`zod.safeParse` + 400, auth-check + 401, db-error + 500)
- `console.log(error)` anywhere? → replace with `pino` log or remove

### 11. Run sanity checks

```bash
npm run lint
npm run build      # not just dev — build catches more
npm test           # if you have tests for the touched module
```

If lint / build / test reveals issues introduced by your cleanup, fix them before reporting done.

### 12. Report

Summarize for the user:

```
Simplify-reuse pass — <file/feature>:
- Replaced custom X with shadcn <Y>  (deleted N lines)
- Extracted helper `<name>` used in 3 sites (was duplicated)
- Removed M lines of dead code / comments
- Split <File> (350 LOC) → <FileA> + <FileB>
- Renamed `<old>` → `<new>` (clearer intent)
- Net diff: -N LOC
```

Be specific about what changed — not vague "cleaned up".

---

## Anti-patterns to flag

- **God file** — one file with 5+ unrelated exports
- **Pass-through wrapper** — `function getPost(slug) { return svcGetPost(slug); }` adds no value, delete
- **Boolean explosion** — function with 4+ boolean params (use object param or split functions)
- **Stringly typed** — `status: string` instead of `status: 'draft' | 'published' | 'archived'`
- **Optional everything** — every field `?` means schema is meaningless; require what's required
- **Defensive null check** for value guaranteed by type — trust the type system

## Don'ts of this skill itself

- Don't refactor code the user didn't ask you to touch
- Don't bundle the refactor into an unrelated feature PR — separate commits at minimum
- Don't introduce abstractions for *future* reuse — only consolidate what's *already* duplicated
- Don't rename things that have public callers without checking — breaking change

## Pairs with

- `clean-code.md` — the invariants this skill enforces
- `stack.md` § Component sourcing — shadcn-first rule
- `folder-structure.md` § Ownership — where things should live
- `shadcn-add-component` skill — when step 3 says "install this"
