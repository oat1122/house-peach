import { z } from 'zod';

import { parseTiptapDoc, tiptapToText } from '@/lib/tiptap/text';

/** Minimum plain-text length for a content body (posts + works). */
const BODY_MIN_TEXT = 20;

/**
 * Tiptap (ProseMirror) JSON doc body — must parse to a `doc` node and contain
 * at least {@link BODY_MIN_TEXT} characters of plain text. Shared by post +
 * work schemas; `message` is the Thai user-facing error per validation.md.
 */
export function TiptapBody(message: string) {
  return z
    .string()
    .refine(
      (v) => parseTiptapDoc(v) != null && tiptapToText(v).length >= BODY_MIN_TEXT,
      message,
    );
}

/**
 * URL slug — lowercase ASCII letters / digits, Thai characters (U+0E00–U+0E7F),
 * and dash separators. No leading/trailing dash, no consecutive dashes.
 * Matches `slugify()` output and the DB column constraint.
 */
export const Slug = z
  .string()
  .regex(
    /^[a-z0-9฀-๿]+(?:-[a-z0-9฀-๿]+)*$/,
    'ใช้ตัวอักษรพิมพ์เล็ก / ตัวเลข / ไทย และ - เท่านั้น',
  )
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
