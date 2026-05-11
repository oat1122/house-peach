import { z } from 'zod';

import { HexColor, Slug } from './common';
import { contentStatuses } from './post';

export const roomTypes = [
  'living',
  'bedroom',
  'kitchen',
  'bathroom',
  'office',
  'outdoor',
  'full_house',
  'other',
] as const;
export type RoomType = (typeof roomTypes)[number];

export const budgetRanges = [
  'under_100k',
  '100k_300k',
  '300k_700k',
  '700k_1.5m',
  '1.5m_plus',
] as const;
export type BudgetRange = (typeof budgetRanges)[number];

export const workImageKinds = ['before', 'after', 'process', 'detail'] as const;
export type WorkImageKind = (typeof workImageKinds)[number];

export const WorkInsert = z.object({
  title: z.string().min(4, 'หัวข้อต้องยาวอย่างน้อย 4 ตัวอักษร').max(180),
  slug: Slug,
  summary: z.string().min(40, 'สรุปต้องยาวอย่างน้อย 40 ตัวอักษร').max(280),
  bodyMdx: z.string().min(20, 'รายละเอียดยังสั้นเกินไป'),
  roomType: z.enum(roomTypes),
  style: z.string().min(2).max(60),
  yearCompleted: z.coerce.number().int().min(1990).max(2100).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  areaSqm: z.coerce.number().positive().max(99999.99).nullable().optional(),
  budgetRange: z.enum(budgetRanges).nullable().optional(),
  coverMediaAssetId: z.coerce.number().int().positive().nullable().default(null),
  tone: HexColor.default('#f5d6c0' as never),
  accent: HexColor.default('#a87856' as never),
  tagIds: z.array(z.coerce.number().int().positive()).default([]),
  status: z.enum(contentStatuses).default('draft'),
  publishedAt: z.coerce.date().nullable().optional(),
});
export type WorkInsert = z.infer<typeof WorkInsert>;

export const WorkUpdate = WorkInsert.partial().extend({
  id: z.coerce.number().int().positive(),
});
export type WorkUpdate = z.infer<typeof WorkUpdate>;
