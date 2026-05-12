import { z } from 'zod';

import { workImageKinds } from './work';

const Id = z.coerce.number().int().positive();

export const AttachAssetsInput = z.object({
  workId: Id,
  mediaAssetIds: z.array(Id).min(1).max(50),
  defaultKind: z.enum(workImageKinds).default('after'),
});
export type AttachAssetsInput = z.infer<typeof AttachAssetsInput>;

export const AttachPairInput = z.object({
  workId: Id,
  pairId: Id,
});
export type AttachPairInput = z.infer<typeof AttachPairInput>;

export const ReorderInput = z.object({
  workId: Id,
  /** Ordered list of mediaAssetIds — index = new `sort` value. */
  mediaAssetIds: z.array(Id).min(1).max(500),
});
export type ReorderInput = z.infer<typeof ReorderInput>;

export const UpdateKindInput = z.object({
  workId: Id,
  mediaAssetId: Id,
  kind: z.enum(workImageKinds),
});
export type UpdateKindInput = z.infer<typeof UpdateKindInput>;

export const UpdateCaptionInput = z.object({
  workId: Id,
  mediaAssetId: Id,
  caption: z.string().max(280).nullable(),
});
export type UpdateCaptionInput = z.infer<typeof UpdateCaptionInput>;

export const SetCoverInput = z.object({
  workId: Id,
  /** null = clear cover. */
  mediaAssetId: Id.nullable(),
});
export type SetCoverInput = z.infer<typeof SetCoverInput>;

export const RemoveInput = z.object({
  workId: Id,
  mediaAssetId: Id,
});
export type RemoveInput = z.infer<typeof RemoveInput>;

export const SetFeaturedInput = z.object({
  workId: Id,
  mediaAssetId: Id,
  isFeatured: z.boolean(),
});
export type SetFeaturedInput = z.infer<typeof SetFeaturedInput>;
