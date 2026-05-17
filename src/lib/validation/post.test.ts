import { describe, it, expect } from 'vitest';

import { PostInsert, PostPublic } from './post';

// ── PostInsert ──────────────────────────────────────────────────────────────

describe('PostInsert', () => {
  const validInput = {
    title: 'ห้องนั่งเล่น Japandi',
    slug: 'japandi-living-room',
    excerpt: 'a'.repeat(80),
    bodyMdx: 'a'.repeat(20),
    tagIds: [],
    status: 'draft' as const,
  };

  it('accepts a fully valid input', () => {
    const result = PostInsert.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects title shorter than 4 chars', () => {
    const result = PostInsert.safeParse({ ...validInput, title: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase letters', () => {
    const result = PostInsert.safeParse({ ...validInput, slug: 'My-Post' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const result = PostInsert.safeParse({ ...validInput, slug: 'my post' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with underscores', () => {
    const result = PostInsert.safeParse({ ...validInput, slug: 'my_post' });
    expect(result.success).toBe(false);
  });

  it('accepts slug with lowercase ascii and dashes', () => {
    const result = PostInsert.safeParse({ ...validInput, slug: 'hello-world-2024' });
    expect(result.success).toBe(true);
  });

  it('rejects excerpt shorter than 80 chars', () => {
    const result = PostInsert.safeParse({ ...validInput, excerpt: 'a'.repeat(79) });
    expect(result.success).toBe(false);
  });

  it('rejects excerpt longer than 280 chars', () => {
    const result = PostInsert.safeParse({ ...validInput, excerpt: 'a'.repeat(281) });
    expect(result.success).toBe(false);
  });

  it('accepts excerpt at the 80-char lower bound', () => {
    const result = PostInsert.safeParse({ ...validInput, excerpt: 'a'.repeat(80) });
    expect(result.success).toBe(true);
  });

  it('accepts excerpt at the 280-char upper bound', () => {
    const result = PostInsert.safeParse({ ...validInput, excerpt: 'a'.repeat(280) });
    expect(result.success).toBe(true);
  });

  it('rejects bodyMdx shorter than 20 chars', () => {
    const result = PostInsert.safeParse({ ...validInput, bodyMdx: 'a'.repeat(19) });
    expect(result.success).toBe(false);
  });

  it('defaults status to draft when omitted', () => {
    const { status: _, ...rest } = validInput;
    const result = PostInsert.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
    }
  });

  it('defaults tagIds to empty array when omitted', () => {
    const { tagIds: _, ...rest } = validInput;
    const result = PostInsert.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toEqual([]);
    }
  });

  it('defaults coverMediaAssetId to null when omitted', () => {
    // validInput intentionally omits coverMediaAssetId — schema should fill null.
    const result = PostInsert.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.coverMediaAssetId).toBeNull();
    }
  });

  it('coerces string tagId to number', () => {
    const result = PostInsert.safeParse({ ...validInput, tagIds: ['1', '2'] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toEqual([1, 2]);
    }
  });
});

// ── PostPublic ──────────────────────────────────────────────────────────────

describe('PostPublic', () => {
  const validPublic = {
    id: 1,
    slug: 'my-post',
    title: 'My Post',
    excerpt: 'a'.repeat(80),
    status: 'published' as const,
    publishedAt: new Date(),
    updatedAt: new Date(),
    readingTimeMin: 5,
    authorName: 'Alice',
    authorImage: null,
    coverPath: null,
    coverAlt: null,
    tagIds: [1, 2],
    tagNames: ['design', 'japandi'],
  };

  it('accepts a valid public post shape', () => {
    expect(PostPublic.safeParse(validPublic).success).toBe(true);
  });

  it('does not include bodyMdx field', () => {
    // Zod v4: shape lives in ._zod.def.shape
    const shape = (PostPublic as unknown as { _zod: { def: { shape: Record<string, unknown> } } })._zod.def.shape;
    expect(shape).not.toHaveProperty('bodyMdx');
  });

  it('does not include authorId field', () => {
    const shape = (PostPublic as unknown as { _zod: { def: { shape: Record<string, unknown> } } })._zod.def.shape;
    expect(shape).not.toHaveProperty('authorId');
  });

  it('does not include viewCount field', () => {
    const shape = (PostPublic as unknown as { _zod: { def: { shape: Record<string, unknown> } } })._zod.def.shape;
    expect(shape).not.toHaveProperty('viewCount');
  });
});
