'use server';

import { requireRole } from '@/lib/auth-guard';
import {
  attachAssetsToWork,
  attachPairToWork,
  removeWorkImage,
  reorderWorkImages,
  setWorkCover,
  setWorkImageFeatured,
  updateWorkImageCaption,
  updateWorkImageKind,
} from '@/lib/services/workImage';
import {
  AttachAssetsInput,
  AttachPairInput,
  ReorderInput,
  RemoveInput,
  SetCoverInput,
  SetFeaturedInput,
  UpdateCaptionInput,
  UpdateKindInput,
} from '@/lib/validation/workImage';

export type ActionResult = { ok: true } | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  const message = err instanceof Error ? err.message : 'ทำงานไม่สำเร็จ';
  return { ok: false, error: message };
}

export async function attachAssetsAction(input: unknown): Promise<ActionResult> {
  await requireRole();
  try {
    await attachAssetsToWork(AttachAssetsInput.parse(input));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function attachPairAction(input: unknown): Promise<ActionResult> {
  await requireRole();
  try {
    await attachPairToWork(AttachPairInput.parse(input));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function reorderWorkImagesAction(
  input: unknown,
): Promise<ActionResult> {
  await requireRole();
  try {
    await reorderWorkImages(ReorderInput.parse(input));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function updateWorkImageKindAction(
  input: unknown,
): Promise<ActionResult> {
  await requireRole();
  try {
    await updateWorkImageKind(UpdateKindInput.parse(input));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function updateWorkImageCaptionAction(
  input: unknown,
): Promise<ActionResult> {
  await requireRole();
  try {
    await updateWorkImageCaption(UpdateCaptionInput.parse(input));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function setWorkCoverAction(
  input: unknown,
): Promise<ActionResult> {
  await requireRole();
  try {
    await setWorkCover(SetCoverInput.parse(input));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function removeWorkImageAction(
  input: unknown,
): Promise<ActionResult> {
  await requireRole();
  try {
    await removeWorkImage(RemoveInput.parse(input));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function setWorkImageFeaturedAction(
  input: unknown,
): Promise<ActionResult> {
  await requireRole();
  try {
    await setWorkImageFeatured(SetFeaturedInput.parse(input));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
