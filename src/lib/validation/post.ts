import { z } from 'zod';

import { Slug } from './common';

export const contentStatuses = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const PostInsert = z.object({
  title: z.string().min(4, 'หัวข้อต้องยาวอย่างน้อย 4 ตัวอักษร').max(180),
  slug: Slug,
  excerpt: z.string().min(80, 'สรุปต้องยาว 80-280 ตัวอักษร').max(280),
  bodyMdx: z.string().min(20, 'เนื้อหายังสั้นเกินไป'),
  tagIds: z.array(z.coerce.number().int().positive()).default([]),
  coverImageId: z.coerce.number().int().positive().nullable().default(null),
  status: z.enum(contentStatuses).default('draft'),
  publishedAt: z.coerce.date().nullable().optional(),
});
export type PostInsert = z.infer<typeof PostInsert>;

export const PostUpdate = PostInsert.partial().extend({
  id: z.coerce.number().int().positive(),
});
export type PostUpdate = z.infer<typeof PostUpdate>;
