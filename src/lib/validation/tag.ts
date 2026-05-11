import { z } from 'zod';

import { Slug } from './common';

export const tagKinds = ['post', 'work', 'both'] as const;

export const TagInsert = z.object({
  slug: Slug,
  name: z.string().min(1, 'กรุณากรอกชื่อแท็ก').max(80),
  kind: z.enum(tagKinds).default('both'),
  sort: z.coerce.number().int().min(0).default(0),
});
export type TagInsert = z.infer<typeof TagInsert>;

export const TagUpdate = TagInsert.partial().extend({
  id: z.coerce.number().int().positive(),
});
export type TagUpdate = z.infer<typeof TagUpdate>;
