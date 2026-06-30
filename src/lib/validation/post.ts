import { z } from 'zod';

import { Slug, TiptapBody } from './common';

export const contentStatuses = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const PostInsert = z.object({
  title: z.string().min(4, 'หัวข้อต้องยาวอย่างน้อย 4 ตัวอักษร').max(180),
  slug: Slug,
  excerpt: z.string().min(80, 'สรุปต้องยาว 80-280 ตัวอักษร').max(280),
  body: TiptapBody('เนื้อหายังสั้นเกินไป'),
  tagIds: z.array(z.coerce.number().int().positive()).default([]),
  coverMediaAssetId: z.coerce.number().int().positive().nullable().default(null),
  status: z.enum(contentStatuses).default('draft'),
  publishedAt: z.coerce.date().nullable().optional(),
});
export type PostInsert = z.infer<typeof PostInsert>;

export const PostUpdate = PostInsert.partial().extend({
  id: z.coerce.number().int().positive(),
});
export type PostUpdate = z.infer<typeof PostUpdate>;

/**
 * **Admin-only shape** — includes `body`, `authorId`, and `viewCount`.
 * Never serialise this to a public response. Use [[PostPublic]] for any data
 * that leaves the server-only boundary (route handlers, server actions,
 * client component props). See `.claude/rules/security.md` § XSS / data leak.
 */
export const PostSelect = z.object({
  id: z.number().int().positive(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  body: z.string(),
  coverMediaAssetId: z.number().int().positive().nullable(),
  status: z.enum(contentStatuses),
  publishedAt: z.date().nullable(),
  authorId: z.number().int().positive(),
  readingTimeMin: z.number().int().nullable(),
  viewCount: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PostSelect = z.infer<typeof PostSelect>;

/**
 * Public-safe post shape returned to frontend consumers.
 * Strips `viewCount` and `authorId` (internal); includes resolved author
 * name/image and cover path from joined tables.
 */
export const PostPublic = z.object({
  id: z.number().int().positive(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  status: z.enum(contentStatuses),
  publishedAt: z.date().nullable(),
  updatedAt: z.date(),
  readingTimeMin: z.number().int().nullable(),
  authorName: z.string().nullable(),
  authorImage: z.string().nullable(),
  coverPath: z.string().nullable(),
  coverAlt: z.string().nullable(),
  tagIds: z.array(z.number().int().positive()),
  tagNames: z.array(z.string()),
});
export type PostPublic = z.infer<typeof PostPublic>;
