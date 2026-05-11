---
name: shared-zod-schema
description: Conventions for authoring zod schemas in src/lib/validation/* — naming (Insert/Update/Select/Public), brand types, error messages in Thai, isomorphic constraint, coercion for FormData/searchParams, RHF + server action wiring. Use this skill whenever you're creating or modifying a validation schema, especially when it must be shared between frontend (RHF) and backend (server action). Trigger on phrases like "zod schema for", "validation for", "validate input", "shared validation", "RHF schema", "form schema".
---

# Shared zod schema conventions

This skill captures naming, structure, and gotchas for zod schemas in house-peach. The whole point: one schema validates both browser form input (via RHF) and server action input — no drift, no duplication.

## When to use

- Creating a new schema file in `src/lib/validation/`
- Extending an existing schema for a new column or input
- Refactoring schemas to remove duplication

## Constraint: isomorphic

Files in `src/lib/validation/` run **in the browser** (RHF resolver) **and on the server** (action input parse). They must not import:

- `'server-only'`
- `@/lib/db` or anything from `lib/db/`
- Node-only modules (`fs`, `path`, etc.)

If you need server-only validation logic (e.g., "slug doesn't already exist in DB"), do that in the service after zod parse — don't bake it into the schema.

## Naming convention

For a domain X, expect 3-4 schemas:

| Name | Purpose | Has `id`? |
|---|---|---|
| `XInsert` | Create form input | no |
| `XUpdate` | Edit form input | yes |
| `XSelect` | Shape returned from DB | yes + timestamps |
| `XPublic` | Shape returned to client | yes, but filtered (no internal fields) |

Plus the type:

```ts
export const PostInsert = z.object({ /* ... */ });
export type PostInsert = z.infer<typeof PostInsert>;
```

## Brand types for constrained primitives

For values that must satisfy a regex or constraint, use `.brand<>()`:

```ts
// src/lib/validation/common.ts
import { z } from 'zod';

export const Slug = z.string().regex(/^[a-z0-9-]+$/, 'รูปแบบ slug ไม่ถูกต้อง').brand<'Slug'>();
export type Slug = z.infer<typeof Slug>;

export const HexColor = z.string().regex(/^#[0-9a-f]{6}$/i, 'ต้องเป็น hex color 6 หลัก').brand<'HexColor'>();
export type HexColor = z.infer<typeof HexColor>;

export const EmailLower = z.string().email().toLowerCase().brand<'EmailLower'>();
export type EmailLower = z.infer<typeof EmailLower>;
```

Why brand? TypeScript distinguishes `Slug` from `string`, so accidentally passing an unvalidated string to a function that expects `Slug` is a compile-time error.

## Error messages — Thai for user-facing

Schemas that drive form validation use Thai error messages (since users are Thai-speaking):

```ts
export const ContactInquiry = z.object({
  contactName: z.string().min(2, 'กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร'),
  contactEmail: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  projectDescription: z.string().min(20, 'อธิบายโปรเจกต์อย่างน้อย 20 ตัวอักษร').max(2000),
  serviceType: z.enum(['full_design', 'consultation', 'partial', 'other'], {
    errorMap: () => ({ message: 'กรุณาเลือกประเภทบริการ' }),
  }),
});
```

Schemas internal to the system (e.g., `ImageStorageKey`, env var schema) keep default English messages.

## Coercion for FormData / search params

URL `searchParams` and `FormData` values are always strings. Use `z.coerce.*`:

```ts
const PostFilter = z.object({
  page: z.coerce.number().int().min(1).default(1),
  tagId: z.coerce.number().int().positive().optional(),
  
  inStock: z.preprocess(v => v === 'true', z.boolean()).optional(),    // checkbox
});
```

If your input comes from JSON (`req.json()`), use plain types. If from FormData/URL, use coerce.

## Composing larger schemas

When a domain schema gets > ~80 lines, split into pieces:

```ts
const WorkMeta = z.object({
  title: z.string().min(4).max(180),
  slug: Slug,
  summary: z.string().min(80).max(280),
});

const WorkClassification = z.object({
  roomType: z.enum(['living','bedroom','kitchen','bathroom','office','outdoor','full_house','other']),
  style: z.string().min(2).max(60),
  tagIds: z.array(z.coerce.number().int().positive()).min(1),
});

const WorkOptionalMeta = z.object({
  yearCompleted: z.coerce.number().int().min(2000).max(2100).nullable(),
  location: z.string().max(120).nullable(),
  areaSqm: z.coerce.number().positive().nullable(),
  budgetRange: z.enum(['under_100k','100k_300k','300k_700k','700k_1.5m','1.5m_plus']).nullable(),
});

export const WorkInsert = WorkMeta
  .merge(WorkClassification)
  .merge(WorkOptionalMeta)
  .extend({
    bodyMdx: z.string().min(20),
    coverImageId: z.coerce.number().int().positive().nullable(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
  });

export type WorkInsert = z.infer<typeof WorkInsert>;
```

## Discriminated unions for variant inputs

When input shape varies by a "kind" field:

```ts
const Contact = z.discriminatedUnion('serviceType', [
  z.object({
    serviceType: z.literal('full_design'),
    roomTypes: z.array(z.string()).min(1),
    budgetRange: z.enum(['under_300k','300k_700k','700k_1.5m','1.5m_plus']),
  }),
  z.object({
    serviceType: z.literal('consultation'),
    topic: z.string().min(10),
  }),
  z.object({
    serviceType: z.literal('partial'),
    scope: z.string().min(10),
  }),
]);
```

TypeScript narrows correctly when you check `.serviceType`.

## RHF wiring

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PostInsert } from '@/lib/validation/post';

const form = useForm<PostInsert>({
  resolver: zodResolver(PostInsert),
  defaultValues: {
    title: '', slug: '' as Slug, summary: '',
    bodyMdx: '', tagIds: [], coverImageId: null,
    status: 'draft',
    /* ... */
  },
});
```

## Server action wiring

```ts
'use server';
import { PostInsert } from '@/lib/validation/post';

export async function createPost(input: unknown) {
  const parsed = PostInsert.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid', issues: parsed.error.flatten() };
  }
  // ... use parsed.data
}
```

## Refinements (cross-field validation)

```ts
const Checkout = z.object({
  budgetRange: z.enum(['under_300k','300k_700k','700k_1.5m','1.5m_plus']),
  preferredStartMonth: z.string(),
}).refine(d => true, { message: '', path: [] });   // placeholder — add cross-field rules as needed
```

## Don'ts

- Don't import server-only into validation files (build will fail loudly, but slow feedback loop)
- Don't `.parse()` on the server without try/catch or `safeParse` — uncaught ZodError leaks stack to client
- Don't use `z.string()` where you really mean `z.string().min(1)` — empty string passes `z.string()`
- Don't duplicate schema between FE and BE — drift is the whole reason we have shared schemas
- Don't put async DB checks inside zod refinements — keep zod sync; do DB checks in service after parse
