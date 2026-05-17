import { z } from 'zod';

import { budgetRanges } from './work';

export const serviceTypes = [
  'full_design',
  'consultation',
  'partial',
  'other',
] as const;
export type ServiceType = (typeof serviceTypes)[number];

/**
 * Visually-empty (whitespace-only) content guard. `min(20)` is satisfied by
 * `" ".repeat(20)`; this refine strips Unicode whitespace + zero-width chars
 * before counting so a spam payload of pure spaces fails. Kept isomorphic
 * (no server imports) so RHF gives the same UX error client-side.
 */
function hasVisibleContent(value: string): boolean {
  return value.replace(/[\s ​-‍﻿]+/g, '').length > 0;
}

export const ContactInquiryInsert = z.object({
  contactName: z
    .string()
    .min(2, 'กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร')
    .max(120)
    .refine(hasVisibleContent, 'กรุณากรอกชื่อ'),
  contactEmail: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').max(255),
  contactPhone: z
    .string()
    .max(40)
    .regex(/^[\d\s+()-]*$/, 'รูปแบบเบอร์โทรไม่ถูกต้อง')
    .nullable()
    .optional(),
  serviceType: z.enum(serviceTypes),
  budgetRange: z.enum(budgetRanges).nullable().optional(),
  projectDescription: z
    .string()
    .min(20, 'อธิบายโปรเจกต์อย่างน้อย 20 ตัวอักษร')
    .max(2000)
    .refine(hasVisibleContent, 'อธิบายโปรเจกต์อย่างน้อย 20 ตัวอักษร'),
});
export type ContactInquiryInsert = z.infer<typeof ContactInquiryInsert>;
