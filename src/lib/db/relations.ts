import { relations } from 'drizzle-orm';

import { users } from './schema/users';
import { posts, postImages, postTags } from './schema/posts';
import { works, workImages, workTags } from './schema/works';
import { tags } from './schema/tags';
import { mediaAssets } from './schema/mediaAssets';
import { mediaPairs } from './schema/mediaPairs';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  uploads: many(mediaAssets),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [mediaAssets.createdById],
    references: [users.id],
  }),
  pairsAsBefore: many(mediaPairs, { relationName: 'pair_before' }),
  pairsAsAfter: many(mediaPairs, { relationName: 'pair_after' }),
  postLinks: many(postImages),
  workLinks: many(workImages),
}));

export const mediaPairsRelations = relations(mediaPairs, ({ one, many }) => ({
  beforeAsset: one(mediaAssets, {
    fields: [mediaPairs.beforeAssetId],
    references: [mediaAssets.id],
    relationName: 'pair_before',
  }),
  afterAsset: one(mediaAssets, {
    fields: [mediaPairs.afterAssetId],
    references: [mediaAssets.id],
    relationName: 'pair_after',
  }),
  workImageLinks: many(workImages),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  coverAsset: one(mediaAssets, {
    fields: [posts.coverMediaAssetId],
    references: [mediaAssets.id],
  }),
  images: many(postImages),
  postTags: many(postTags),
}));

export const postImagesRelations = relations(postImages, ({ one }) => ({
  post: one(posts, { fields: [postImages.postId], references: [posts.id] }),
  asset: one(mediaAssets, {
    fields: [postImages.mediaAssetId],
    references: [mediaAssets.id],
  }),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

export const worksRelations = relations(works, ({ one, many }) => ({
  coverAsset: one(mediaAssets, {
    fields: [works.coverMediaAssetId],
    references: [mediaAssets.id],
  }),
  images: many(workImages),
  workTags: many(workTags),
}));

export const workImagesRelations = relations(workImages, ({ one }) => ({
  work: one(works, { fields: [workImages.workId], references: [works.id] }),
  asset: one(mediaAssets, {
    fields: [workImages.mediaAssetId],
    references: [mediaAssets.id],
  }),
  pair: one(mediaPairs, {
    fields: [workImages.pairId],
    references: [mediaPairs.id],
  }),
}));

export const workTagsRelations = relations(workTags, ({ one }) => ({
  work: one(works, { fields: [workTags.workId], references: [works.id] }),
  tag: one(tags, { fields: [workTags.tagId], references: [tags.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
  workTags: many(workTags),
}));
