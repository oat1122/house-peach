import { z } from 'zod';

export const Slug = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข และ - เท่านั้น')
  .min(1)
  .max(140)
  .brand<'Slug'>();
export type Slug = z.infer<typeof Slug>;

export const HexColor = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, 'รูปแบบสี hex ไม่ถูกต้อง')
  .brand<'HexColor'>();
export type HexColor = z.infer<typeof HexColor>;

export const EmailLower = z
  .string()
  .email('รูปแบบอีเมลไม่ถูกต้อง')
  .transform((v) => v.trim().toLowerCase())
  .brand<'EmailLower'>();
export type EmailLower = z.infer<typeof EmailLower>;
