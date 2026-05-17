'use server';

import { z } from 'zod';

import { requireRole } from '@/lib/auth-guard';
import {
  createTag as createTagSvc,
  deleteTag as deleteTagSvc,
  TagSlugTakenError,
  updateTag as updateTagSvc,
} from '@/lib/services/tag';
import { TagInsert, TagUpdate } from '@/lib/validation/tag';

import { checkAdminWriteRateLimit } from './_adminRateLimit';

const Id = z.coerce.number().int().positive();

export type ActionResult<T = undefined> =
  | { ok: true; value?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function flattenZodError(err: z.ZodError) {
  return Object.fromEntries(
    Object.entries(err.flatten().fieldErrors).filter(
      ([, v]) => Array.isArray(v) && v.length > 0,
    ),
  ) as Record<string, string[]>;
}

export async function createTagAction(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const parsed = TagInsert.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ข้อมูลไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  try {
    const id = await createTagSvc(parsed.data);
    return { ok: true, value: { id } };
  } catch (err) {
    if (err instanceof TagSlugTakenError) {
      return {
        ok: false,
        error: err.message,
        fieldErrors: { slug: [err.message] },
      };
    }
    return { ok: false, error: (err as Error).message || 'บันทึกไม่สำเร็จ' };
  }
}

export async function updateTagAction(
  input: unknown,
): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const parsed = TagUpdate.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ข้อมูลไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  try {
    await updateTagSvc(parsed.data);
    return { ok: true };
  } catch (err) {
    if (err instanceof TagSlugTakenError) {
      return {
        ok: false,
        error: err.message,
        fieldErrors: { slug: [err.message] },
      };
    }
    return { ok: false, error: (err as Error).message || 'บันทึกไม่สำเร็จ' };
  }
}

export async function deleteTagAction(input: unknown): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const { id } = z.object({ id: Id }).parse(input);
  await deleteTagSvc(id);
  return { ok: true };
}
