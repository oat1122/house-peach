import { z } from 'zod';

import { HexColor, Slug } from './common';

export const categoryKinds = ['post', 'work', 'both'] as const;

// Empty form inputs ('' from an unset color swatch / blank textarea) coerce to
// undefined so optional() passes instead of failing the branded HexColor regex.
const emptyToUndefined = (v: unknown) =>
  v === '' || v == null ? undefined : v;

export const CategoryInsert = z.object({
  slug: Slug,
  name: z.string().min(1, 'กรุณากรอกชื่อหมวดหมู่').max(80),
  kind: z.enum(categoryKinds).default('both'),
  color: z.preprocess(emptyToUndefined, HexColor.optional()),
  summary: z.preprocess(
    emptyToUndefined,
    z.string().max(280, 'คำอธิบายต้องไม่เกิน 280 ตัวอักษร').optional(),
  ),
  sort: z.coerce.number().int().min(0).default(0),
});
export type CategoryInsert = z.infer<typeof CategoryInsert>;

export const CategoryUpdate = CategoryInsert.partial().extend({
  id: z.coerce.number().int().positive(),
});
export type CategoryUpdate = z.infer<typeof CategoryUpdate>;
