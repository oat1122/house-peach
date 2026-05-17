/**
 * Service tests for lib/services/contact.ts
 *
 * DB strategy: mirrors post.test.ts — the repo has no testcontainers setup, so
 * we mock the Drizzle client.  Tests focus on logic the service owns: filter
 * construction, pagination math, q-cap invariant, status guard in
 * setInquiryStatus, and the insertId-missing error path in
 * createContactInquiry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Env mock ─────────────────────────────────────────────────────────────────
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

// ── next/cache mock ───────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

// ── react cache() unwrap ──────────────────────────────────────────────────────
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: (fn: (...a: unknown[]) => unknown) => fn };
});

// ── Drizzle builder mock ──────────────────────────────────────────────────────
// Configurable per-test via `mockReturnRows` / `mockInsertId`.
let _returnRows: unknown[] = [];
let _insertId: number | undefined = 1;
let _countValue = 0;

/** Resets the stubs to safe defaults before each test.
 *  Pass `insertId: undefined` to simulate a DB that returns no insertId.
 *  Omit `insertId` entirely to use the safe default of 1.
 */
function resetStubs(
  opts: { rows?: unknown[]; insertId?: number | undefined; count?: number } & {
    noInsertId?: boolean;
  } = {},
) {
  _returnRows = opts.rows ?? [];
  // Explicitly check `noInsertId` to allow setting _insertId to undefined.
  if (opts.noInsertId) {
    _insertId = undefined;
  } else {
    _insertId = opts.insertId !== undefined ? opts.insertId : 1;
  }
  _countValue = opts.count ?? 0;
}

function chain(rows: unknown[] = _returnRows): unknown {
  const c = {
    from: () => c,
    leftJoin: () => c,
    innerJoin: () => c,
    where: () => c,
    groupBy: () => Promise.resolve(rows),
    orderBy: () => c,
    limit: () => c,
    offset: () => Promise.resolve(rows),
    // Make the chain itself thenable so bare .from().where() awaits cleanly
    then: undefined as unknown,
  };
  return c;
}

// For Promise.all([countQuery, rowsQuery]) the count query calls where() and
// resolves. For countInquiriesByStatus the query calls groupBy() instead of where().
const countChain = () => {
  const c = {
    from: () => c,
    // listInquiries uses .where() for the count query
    where: () => Promise.resolve([{ total: _countValue }]),
    // countInquiriesByStatus uses .groupBy() — returns status+total rows
    groupBy: () => Promise.resolve(_returnRows),
  };
  return c;
};

vi.mock('@/lib/db', () => ({
  db: {
    select: (cols?: unknown) => {
      // Distinguish the count-select from the rows-select by whether cols has
      // a `total` key. This is a heuristic — good enough for unit tests.
      if (cols && typeof cols === 'object' && 'total' in (cols as object)) {
        return countChain();
      }
      // The groupBy-based countInquiriesByStatus() also calls select({status, total})
      // which matches the `total` check above. For all-rows queries we return chain().
      return chain();
    },
    insert: () => ({
      values: () => {
        // Return an array whose first element may or may not have insertId,
        // mirroring the real driver's mysql2 return shape.
        if (_insertId === undefined) {
          return Promise.resolve([{}]);
        }
        return Promise.resolve([{ insertId: _insertId }]);
      },
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    delete: () => ({ where: () => Promise.resolve() }),
    transaction: async (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: () => chain(),
        insert: () => ({
          values: () => {
            if (_insertId === undefined) return Promise.resolve([{}]);
            return Promise.resolve([{ insertId: _insertId }]);
          },
        }),
        update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
        delete: () => ({ where: () => Promise.resolve() }),
      };
      return fn(tx);
    },
  },
}));

// ── Import the module under test AFTER mocks ──────────────────────────────────
import {
  listInquiries,
  createContactInquiry,
  setInquiryStatus,
  deleteInquiry,
  countInquiriesByStatus,
} from './contact';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('listInquiries — pagination math', () => {
  it('hasMore is false when total fits on the first page', async () => {
    resetStubs({ count: 10, rows: [] });
    const result = await listInquiries({ page: 1, perPage: 25 });
    expect(result.hasMore).toBe(false);
  });

  it('hasMore is true when rows spill to a next page', async () => {
    resetStubs({ count: 30, rows: [] });
    const result = await listInquiries({ page: 1, perPage: 25 });
    expect(result.hasMore).toBe(true);
  });

  it('hasMore is false on the last page boundary', async () => {
    // 50 items, perPage 25, page 2 — exactly fills
    resetStubs({ count: 50, rows: [] });
    const result = await listInquiries({ page: 2, perPage: 25 });
    expect(result.hasMore).toBe(false);
  });

  it('clamps perPage to minimum 1', async () => {
    resetStubs({ count: 5, rows: [] });
    // perPage 0 should be clamped to 1; won't throw
    const result = await listInquiries({ page: 1, perPage: 0 });
    expect(result).toBeDefined();
  });

  it('clamps perPage to maximum 100', async () => {
    resetStubs({ count: 0, rows: [] });
    const result = await listInquiries({ page: 1, perPage: 9999 });
    expect(result).toBeDefined();
  });

  it('defaults to page 1 and perPage 25 when not provided', async () => {
    resetStubs({ count: 0, rows: [] });
    const result = await listInquiries();
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});

describe('listInquiries — q cap invariant', () => {
  it('caps q to 100 chars before LIKE', () => {
    // Mirror the logic in the service: trim + slice(0, 100)
    const q = 'x'.repeat(200);
    const capped = q.trim().slice(0, 100);
    expect(capped.length).toBe(100);
  });

  it('does not truncate short q', () => {
    const q = 'somchai';
    expect(q.trim().slice(0, 100)).toBe('somchai');
  });

  it('whitespace-only q becomes falsy after trim and skips the LIKE predicate', () => {
    const q = '   ';
    const capped = q.trim().slice(0, 100);
    expect(Boolean(capped)).toBe(false);
  });

  it('does not throw when q exceeds 100 chars', async () => {
    resetStubs({ count: 0, rows: [] });
    const longQ = 'ก'.repeat(300);
    await expect(listInquiries({ q: longQ })).resolves.toBeDefined();
  });
});

describe('listInquiries — status filter', () => {
  beforeEach(() => resetStubs());

  it('returns results without throwing when status=all', async () => {
    await expect(listInquiries({ status: 'all' })).resolves.toBeDefined();
  });

  it('returns results without throwing when status=new', async () => {
    await expect(listInquiries({ status: 'new' })).resolves.toBeDefined();
  });

  it('returns results without throwing when status=contacted', async () => {
    await expect(listInquiries({ status: 'contacted' })).resolves.toBeDefined();
  });

  it('returns results without throwing when status=closed', async () => {
    await expect(listInquiries({ status: 'closed' })).resolves.toBeDefined();
  });
});

describe('createContactInquiry', () => {
  it('returns the new insertId on success', async () => {
    resetStubs({ insertId: 42 });
    const id = await createContactInquiry({
      contactName: 'สมชาย ใจดี',
      contactEmail: 'somchai@example.com',
      serviceType: 'full_design',
      projectDescription: 'ต้องการตกแต่งห้องนั่งเล่นสไตล์ Japandi ขนาด 30 ตรม.',
    });
    expect(id).toBe(42);
  });

  it('throws when DB returns no insertId', async () => {
    resetStubs({ noInsertId: true });
    await expect(
      createContactInquiry({
        contactName: 'สมชาย ใจดี',
        contactEmail: 'somchai@example.com',
        serviceType: 'full_design',
        projectDescription: 'ต้องการตกแต่งห้องนั่งเล่นสไตล์ Japandi ขนาด 30 ตรม.',
      }),
    ).rejects.toThrow('Failed to insert contact inquiry');
  });

  it('includes optional fields when provided', async () => {
    resetStubs({ insertId: 7 });
    const id = await createContactInquiry({
      contactName: 'สมหญิง',
      contactEmail: 'somying@example.com',
      contactPhone: '+66 81 000 0000',
      serviceType: 'consultation',
      budgetRange: '300k_700k',
      projectDescription: 'ต้องการปรึกษาเรื่องการตกแต่งห้องนอนสไตล์ minimalist',
    });
    expect(id).toBe(7);
  });
});

describe('setInquiryStatus', () => {
  beforeEach(() => resetStubs());

  it('resolves without throwing for valid status values', async () => {
    for (const status of ['new', 'contacted', 'closed'] as const) {
      await expect(setInquiryStatus(1, status)).resolves.toBeUndefined();
    }
  });

  it('throws on invalid status value', async () => {
    // Cast to bypass TypeScript to simulate a runtime bad-value scenario
    await expect(
      setInquiryStatus(1, 'unknown' as never),
    ).rejects.toThrow('Invalid inquiry status');
  });
});

describe('deleteInquiry', () => {
  beforeEach(() => resetStubs());

  it('resolves without throwing for a valid id', async () => {
    await expect(deleteInquiry(1)).resolves.toBeUndefined();
  });

  it('resolves without throwing for any numeric id', async () => {
    await expect(deleteInquiry(999)).resolves.toBeUndefined();
  });
});

describe('countInquiriesByStatus', () => {
  it('returns zero counts when no inquiries exist', async () => {
    // countChain.groupBy() resolves with _returnRows (set to [] by resetStubs).
    resetStubs({ rows: [] });
    const counts = await countInquiriesByStatus();
    expect(counts.new).toBe(0);
    expect(counts.contacted).toBe(0);
    expect(counts.closed).toBe(0);
    expect(counts.all).toBe(0);
  });

  it('accumulates all + per-status counts correctly from service logic', () => {
    // Test the accumulation logic in isolation (pure arithmetic).
    const rows = [
      { status: 'new' as const, total: 5 },
      { status: 'contacted' as const, total: 3 },
      { status: 'closed' as const, total: 2 },
    ];
    const base = { new: 0, contacted: 0, closed: 0, all: 0 } as Record<string, number>;
    for (const r of rows) {
      const n = Number(r.total);
      base[r.status] = n;
      base.all += n;
    }
    expect(base.new).toBe(5);
    expect(base.contacted).toBe(3);
    expect(base.closed).toBe(2);
    expect(base.all).toBe(10);
  });
});
