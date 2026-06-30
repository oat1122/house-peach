import { describe, it, expect, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: {
    DATABASE_URL: 'mysql://test',
    DB_POOL_SIZE: 1,
    AUTH_SECRET: 'x'.repeat(32),
    NEXT_PUBLIC_SITE_URL: 'https://house-peach.example',
    NODE_ENV: 'test',
    UPLOAD_DIR: '/tmp/uploads',
  },
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: (fn: (...a: unknown[]) => unknown) => fn };
});

let mockQueryRows: unknown[] = [];

vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          groupBy: () => Promise.resolve(mockQueryRows),
        }),
      }),
    }),
  },
}));

const { getPublishedWorkCountsByRoomType } = await import('./work');

describe('getPublishedWorkCountsByRoomType', () => {
  it('correctly maps non-zero counts and fills missing room types with 0', async () => {
    mockQueryRows = [
      { roomType: 'living', count: 5 },
      { roomType: 'kitchen', count: 2 },
    ];

    const counts = await getPublishedWorkCountsByRoomType();

    expect(counts.living).toBe(5);
    expect(counts.kitchen).toBe(2);
    expect(counts.bedroom).toBe(0);
    expect(counts.bathroom).toBe(0);
    expect(counts.outdoor).toBe(0);
    expect(counts.full_house).toBe(0);
    expect(counts.office).toBe(0);
    expect(counts.other).toBe(0);
  });
});
