'use server';

import { z } from 'zod';

import { requireRole } from '@/lib/auth-guard';
import {
  createMediaPair,
  deleteMediaAsset,
  deleteMediaPair,
  updateMediaAssetMeta,
  updateMediaPairLabel,
} from '@/lib/services/media';

const Id = z.coerce.number().int().positive();

const UpdateAssetInput = z.object({
  id: Id,
  title: z.string().max(180).optional(),
  alt: z.string().max(255).optional(),
});

export async function updateAssetMetaAction(input: unknown) {
  await requireRole();
  const data = UpdateAssetInput.parse(input);
  await updateMediaAssetMeta(data.id, { title: data.title, alt: data.alt });
  return { ok: true as const };
}

export async function deleteAssetAction(input: unknown) {
  await requireRole();
  const { id } = z.object({ id: Id }).parse(input);
  const result = await deleteMediaAsset(id);
  return { ok: true as const, ...result };
}

const CreatePairInput = z.object({
  beforeAssetId: Id,
  afterAssetId: Id,
  label: z.string().max(180).optional(),
});

export async function createPairAction(input: unknown) {
  await requireRole();
  const data = CreatePairInput.parse(input);
  const pair = await createMediaPair(data);
  return { ok: true as const, pair };
}

const UpdatePairInput = z.object({
  id: Id,
  label: z.string().max(180),
});

export async function updatePairLabelAction(input: unknown) {
  await requireRole();
  const data = UpdatePairInput.parse(input);
  await updateMediaPairLabel(data.id, data.label);
  return { ok: true as const };
}

export async function deletePairAction(input: unknown) {
  await requireRole();
  const { id } = z.object({ id: Id }).parse(input);
  await deleteMediaPair(id);
  return { ok: true as const };
}
