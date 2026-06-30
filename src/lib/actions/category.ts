'use server';

import { z } from 'zod';

import { requireRole } from '@/lib/auth-guard';
import {
  createCategory as createCategorySvc,
  deleteCategory as deleteCategorySvc,
  CategorySlugTakenError,
  updateCategory as updateCategorySvc,
} from '@/lib/services/category';
import { CategoryInsert, CategoryUpdate } from '@/lib/validation/category';

import { checkAdminWriteRateLimit } from './_adminRateLimit';
import type { ActionResult } from './tag';

const Id = z.coerce.number().int().positive();

function flattenZodError(err: z.ZodError) {
  return Object.fromEntries(
    Object.entries(err.flatten().fieldErrors).filter(
      ([, v]) => Array.isArray(v) && v.length > 0,
    ),
  ) as Record<string, string[]>;
}

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const parsed = CategoryInsert.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ข้อมูลไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  try {
    const id = await createCategorySvc(parsed.data);
    return { ok: true, value: { id } };
  } catch (err) {
    if (err instanceof CategorySlugTakenError) {
      return {
        ok: false,
        error: err.message,
        fieldErrors: { slug: [err.message] },
      };
    }
    return { ok: false, error: (err as Error).message || 'บันทึกไม่สำเร็จ' };
  }
}

export async function updateCategoryAction(
  input: unknown,
): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const parsed = CategoryUpdate.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ข้อมูลไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  try {
    await updateCategorySvc(parsed.data);
    return { ok: true };
  } catch (err) {
    if (err instanceof CategorySlugTakenError) {
      return {
        ok: false,
        error: err.message,
        fieldErrors: { slug: [err.message] },
      };
    }
    return { ok: false, error: (err as Error).message || 'บันทึกไม่สำเร็จ' };
  }
}

export async function deleteCategoryAction(
  input: unknown,
): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const { id } = z.object({ id: Id }).parse(input);
  await deleteCategorySvc(id);
  return { ok: true };
}
