'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireRole } from '@/lib/auth-guard';
import {
  createWork as createWorkSvc,
  deleteWork as deleteWorkSvc,
  setWorkStatus as setWorkStatusSvc,
  updateWork as updateWorkSvc,
  WorkSlugTakenError,
} from '@/lib/services/work';
import { WorkInsert, WorkUpdate } from '@/lib/validation/work';

const Id = z.coerce.number().int().positive();
const StatusEnum = z.enum(['draft', 'published', 'archived']);

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

export async function createWorkAction(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  await requireRole();
  const parsed = WorkInsert.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ข้อมูลไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  try {
    const id = await createWorkSvc(parsed.data);
    return { ok: true, value: { id } };
  } catch (err) {
    if (err instanceof WorkSlugTakenError) {
      return {
        ok: false,
        error: err.message,
        fieldErrors: { slug: [err.message] },
      };
    }
    return { ok: false, error: (err as Error).message || 'บันทึกไม่สำเร็จ' };
  }
}

export async function updateWorkAction(
  input: unknown,
): Promise<ActionResult> {
  await requireRole();
  const parsed = WorkUpdate.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ข้อมูลไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  try {
    await updateWorkSvc(parsed.data);
    return { ok: true };
  } catch (err) {
    if (err instanceof WorkSlugTakenError) {
      return {
        ok: false,
        error: err.message,
        fieldErrors: { slug: [err.message] },
      };
    }
    return { ok: false, error: (err as Error).message || 'บันทึกไม่สำเร็จ' };
  }
}

const SetStatusInput = z.object({ id: Id, status: StatusEnum });

export async function setWorkStatusAction(input: unknown): Promise<ActionResult> {
  await requireRole();
  const { id, status } = SetStatusInput.parse(input);
  await setWorkStatusSvc(id, status);
  return { ok: true };
}

export async function deleteWorkAction(input: unknown): Promise<ActionResult> {
  await requireRole();
  const { id } = z.object({ id: Id }).parse(input);
  await deleteWorkSvc(id);
  return { ok: true };
}

/**
 * Hard redirect after create — used by the new-work page to send admin to
 * the edit screen for gallery composition.
 */
export async function createWorkAndRedirect(input: unknown): Promise<never> {
  const result = await createWorkAction(input);
  if (!result.ok) {
    throw new Error(result.error);
  }
  redirect(`/admin/works/${result.value!.id}/edit`);
}
