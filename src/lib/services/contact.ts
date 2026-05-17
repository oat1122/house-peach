import 'server-only';
import { and, count, desc, eq, like, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  contactInquiries,
  type ContactInquiryRow,
  type InquiryStatus,
  inquiryStatusValues,
} from '@/lib/db/schema/contactInquiries';
import type { ContactInquiryInsert } from '@/lib/validation/contact';

export type InquiryListItem = Pick<
  ContactInquiryRow,
  | 'id'
  | 'contactName'
  | 'contactEmail'
  | 'contactPhone'
  | 'serviceType'
  | 'budgetRange'
  | 'projectDescription'
  | 'status'
  | 'createdAt'
>;

/**
 * Count inquiries grouped by status. Used by the admin filter bar to show
 * unread counts on each chip. A single query (GROUP BY) is cheaper than four
 * separate `COUNT(*) WHERE status = ?` round-trips.
 */
export async function countInquiriesByStatus(): Promise<
  Record<InquiryStatus | 'all', number>
> {
  const rows = await db
    .select({
      status: contactInquiries.status,
      total: count(),
    })
    .from(contactInquiries)
    .groupBy(contactInquiries.status);

  const base = { new: 0, contacted: 0, closed: 0, all: 0 } as Record<
    InquiryStatus | 'all',
    number
  >;
  for (const r of rows) {
    const n = Number(r.total);
    base[r.status] = n;
    base.all += n;
  }
  return base;
}

/**
 * List inquiries for the admin index. Sorted newest-first so unread `new`
 * rows surface on page 1. Status filter relies on the
 * `contact_inquiries_status_idx` composite index (status, created_at).
 *
 * `q` matches name or email — cap to 100 chars before sending into LIKE so a
 * giant pattern can't force a table scan. Mirrors `listPostsForAdmin`.
 */
export async function listInquiries(input?: {
  status?: InquiryStatus | 'all';
  q?: string;
  page?: number;
  perPage?: number;
}): Promise<{ rows: InquiryListItem[]; total: number; hasMore: boolean }> {
  const status = input?.status ?? 'all';
  const page = Math.max(1, input?.page ?? 1);
  const perPage = Math.min(100, Math.max(1, input?.perPage ?? 25));
  const offset = (page - 1) * perPage;
  const q = input?.q?.trim().slice(0, 100);

  const where = [];
  if (status !== 'all') where.push(eq(contactInquiries.status, status));
  if (q) {
    const pattern = `%${q}%`;
    where.push(
      or(
        like(contactInquiries.contactName, pattern),
        like(contactInquiries.contactEmail, pattern),
      )!,
    );
  }
  const filter = where.length > 0 ? and(...where) : undefined;

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(contactInquiries).where(filter),
    db
      .select({
        id: contactInquiries.id,
        contactName: contactInquiries.contactName,
        contactEmail: contactInquiries.contactEmail,
        contactPhone: contactInquiries.contactPhone,
        serviceType: contactInquiries.serviceType,
        budgetRange: contactInquiries.budgetRange,
        projectDescription: contactInquiries.projectDescription,
        status: contactInquiries.status,
        createdAt: contactInquiries.createdAt,
      })
      .from(contactInquiries)
      .where(filter)
      .orderBy(desc(contactInquiries.createdAt))
      .limit(perPage)
      .offset(offset),
  ]);

  return {
    rows,
    total: Number(total),
    hasMore: page * perPage < Number(total),
  };
}

export async function getInquiryById(
  id: number,
): Promise<ContactInquiryRow | null> {
  const [row] = await db
    .select()
    .from(contactInquiries)
    .where(eq(contactInquiries.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * Insert a new inquiry from the public /contact form. Returns the new id so
 * the action layer can log it / email the admin in V2. No cache busting —
 * inquiries don't surface anywhere public, so there's nothing stale to bust.
 */
export async function createContactInquiry(
  input: ContactInquiryInsert,
): Promise<number> {
  const result = await db.insert(contactInquiries).values({
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone ?? null,
    serviceType: input.serviceType,
    budgetRange: input.budgetRange ?? null,
    projectDescription: input.projectDescription,
    // status defaults to 'new' at the DB level.
  });
  const insertId = (result as unknown as { insertId?: number }[])[0]?.insertId;
  if (!insertId) throw new Error('Failed to insert contact inquiry');
  return insertId;
}

export async function setInquiryStatus(
  id: number,
  status: InquiryStatus,
): Promise<void> {
  if (!inquiryStatusValues.includes(status)) {
    throw new Error(`Invalid inquiry status: ${status}`);
  }
  await db
    .update(contactInquiries)
    .set({ status })
    .where(eq(contactInquiries.id, id));
}

export async function deleteInquiry(id: number): Promise<void> {
  await db.delete(contactInquiries).where(eq(contactInquiries.id, id));
}

/**
 * Lightweight existence check used by the admin detail page to return 404
 * without loading the full row. Currently unused but exposed for parity with
 * other services — remove if no consumer appears.
 */
export async function inquiryExists(id: number): Promise<boolean> {
  const [row] = await db
    .select({ id: sql<number>`1` })
    .from(contactInquiries)
    .where(eq(contactInquiries.id, id))
    .limit(1);
  return Boolean(row);
}
