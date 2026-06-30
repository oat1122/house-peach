'use server';

import { z } from 'zod';

import { requireRole } from '@/lib/auth-guard';
import {
  bulkDeletePosts as bulkDeletePostsSvc,
  bulkSetPostStatus as bulkSetPostStatusSvc,
  createPost as createPostSvc,
  deletePost as deletePostSvc,
  PostSlugTakenError,
  setPostStatus as setPostStatusSvc,
  updatePost as updatePostSvc,
} from '@/lib/services/post';
import { PostInsert, PostUpdate } from '@/lib/validation/post';

import { checkAdminWriteRateLimit } from './_adminRateLimit';

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

export async function createPostAction(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  const { session } = await requireRole();
  const authorId = session?.user?.id;
  if (!authorId || !Number.isFinite(Number(authorId))) {
    return { ok: false, error: 'ไม่พบ user id ใน session' };
  }
  const blocked = checkAdminWriteRateLimit(authorId);
  if (blocked) return blocked;
  const parsed = PostInsert.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ข้อมูลไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  try {
    const id = await createPostSvc(parsed.data, Number(authorId));
    return { ok: true, value: { id } };
  } catch (err) {
    if (err instanceof PostSlugTakenError) {
      return {
        ok: false,
        error: err.message,
        fieldErrors: { slug: [err.message] },
      };
    }
    return { ok: false, error: (err as Error).message || 'บันทึกไม่สำเร็จ' };
  }
}

export async function updatePostAction(
  input: unknown,
): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const parsed = PostUpdate.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ข้อมูลไม่ถูกต้อง',
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  try {
    await updatePostSvc(parsed.data);
    return { ok: true };
  } catch (err) {
    if (err instanceof PostSlugTakenError) {
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

export async function setPostStatusAction(input: unknown): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const { id, status } = SetStatusInput.parse(input);
  await setPostStatusSvc(id, status);
  return { ok: true };
}

export async function deletePostAction(input: unknown): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const { id } = z.object({ id: Id }).parse(input);
  await deletePostSvc(id);
  return { ok: true };
}

const BulkIds = z.array(Id).min(1).max(100);
const BulkStatusInput = z.object({ ids: BulkIds, status: StatusEnum });
const BulkIdsInput = z.object({ ids: BulkIds });

export async function bulkSetPostStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const { ids, status } = BulkStatusInput.parse(input);
  await bulkSetPostStatusSvc(ids, status);
  return { ok: true };
}

export async function bulkDeletePostsAction(
  input: unknown,
): Promise<ActionResult> {
  const { session } = await requireRole();
  const blocked = checkAdminWriteRateLimit(session?.user?.id);
  if (blocked) return blocked;
  const { ids } = BulkIdsInput.parse(input);
  await bulkDeletePostsSvc(ids);
  return { ok: true };
}
