import {
  bigint,
  index,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

import { budgetRangeValues } from './works';

export const serviceTypeValues = [
  'full_design',
  'consultation',
  'partial',
  'other',
] as const;
export type ServiceType = (typeof serviceTypeValues)[number];

export const inquiryStatusValues = ['new', 'contacted', 'closed'] as const;
export type InquiryStatus = (typeof inquiryStatusValues)[number];

export const contactInquiries = mysqlTable(
  'contact_inquiries',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    contactName: varchar('contact_name', { length: 120 }).notNull(),
    contactEmail: varchar('contact_email', { length: 255 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 40 }),
    serviceType: mysqlEnum('service_type', serviceTypeValues).notNull(),
    budgetRange: mysqlEnum('budget_range', budgetRangeValues),
    projectDescription: varchar('project_description', { length: 2000 }).notNull(),
    status: mysqlEnum('status', inquiryStatusValues).notNull().default('new'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('contact_inquiries_status_idx').on(t.status, t.createdAt)],
);

export type ContactInquiryRow = typeof contactInquiries.$inferSelect;
export type ContactInquiryInsertRow = typeof contactInquiries.$inferInsert;
