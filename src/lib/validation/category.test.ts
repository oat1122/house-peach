import { describe, expect, it } from 'vitest';

import { CategoryInsert, CategoryUpdate } from './category';

describe('CategoryInsert', () => {
  const valid = {
    slug: 'inspiration',
    name: 'แรงบันดาลใจ',
    kind: 'both' as const,
    color: '#b89b7a',
    summary: 'ไอเดียแต่งบ้านโทนอบอุ่น',
    sort: 2,
  };

  it('parses a full valid category', () => {
    const parsed = CategoryInsert.parse(valid);
    expect(parsed.slug).toBe('inspiration');
    expect(parsed.color).toBe('#b89b7a');
  });

  it('defaults kind to "both" and sort to 0 when omitted', () => {
    const parsed = CategoryInsert.parse({ slug: 'how-to', name: 'ฮาวทู' });
    expect(parsed.kind).toBe('both');
    expect(parsed.sort).toBe(0);
  });

  it('coerces empty color string to undefined (optional)', () => {
    const parsed = CategoryInsert.parse({ ...valid, color: '' });
    expect(parsed.color).toBeUndefined();
  });

  it('coerces empty summary string to undefined (optional)', () => {
    const parsed = CategoryInsert.parse({ ...valid, summary: '' });
    expect(parsed.summary).toBeUndefined();
  });

  it('rejects an empty name', () => {
    expect(() => CategoryInsert.parse({ ...valid, name: '' })).toThrow();
  });

  it('rejects an invalid slug (uppercase / space)', () => {
    expect(() => CategoryInsert.parse({ ...valid, slug: 'Bad Slug' })).toThrow();
  });

  it('rejects an invalid hex color', () => {
    expect(() => CategoryInsert.parse({ ...valid, color: 'red' })).toThrow();
  });

  it('rejects a summary longer than 280 chars', () => {
    expect(() =>
      CategoryInsert.parse({ ...valid, summary: 'ก'.repeat(281) }),
    ).toThrow();
  });

  it('rejects an unknown kind', () => {
    expect(() =>
      CategoryInsert.parse({ ...valid, kind: 'page' as never }),
    ).toThrow();
  });
});

describe('CategoryUpdate', () => {
  it('requires a positive id', () => {
    expect(() => CategoryUpdate.parse({ name: 'x' })).toThrow();
    const parsed = CategoryUpdate.parse({ id: 5, name: 'ใหม่' });
    expect(parsed.id).toBe(5);
  });

  it('allows a partial patch (id + one field)', () => {
    const parsed = CategoryUpdate.parse({ id: 3, color: '#8fa088' });
    expect(parsed.color).toBe('#8fa088');
    expect(parsed.name).toBeUndefined();
  });
});
