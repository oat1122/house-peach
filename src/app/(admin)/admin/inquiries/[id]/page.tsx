import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail, Phone } from 'lucide-react';

import { InquiryDeleteButton } from '@/components/admin/inquiries/InquiryDeleteButton';
import { InquiryStatusBadge } from '@/components/admin/inquiries/InquiryStatusBadge';
import { InquiryStatusSelect } from '@/components/admin/inquiries/InquiryStatusSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { requireRole } from '@/lib/auth-guard';
import { getInquiryById } from '@/lib/services/contact';
import type { BudgetRange } from '@/lib/validation/work';
import type { ServiceType } from '@/lib/validation/contact';

export const dynamic = 'force-dynamic';

/**
 * Strip CR/LF (and percent-encoded equivalents) from an email before inlining
 * into a mailto: href — defence against stored CRLF/header injection.
 * Mirrors the helper in InquiryRowActions; if a third caller appears, lift
 * this into `lib/utils/`.
 */
function sanitizeMailtoAddress(email: string): string {
  return email.replace(/(\r|\n|%0a|%0d)/gi, '');
}

const SERVICE_LABEL: Record<ServiceType, string> = {
  full_design: 'ออกแบบทั้งหมด',
  consultation: 'ปรึกษาออกแบบ',
  partial: 'บางส่วน / ห้องเดียว',
  other: 'อื่น ๆ',
};

const BUDGET_LABEL: Record<BudgetRange, string> = {
  under_100k: 'ต่ำกว่า 100,000',
  '100k_300k': '100,000 – 300,000',
  '300k_700k': '300,000 – 700,000',
  '700k_1.5m': '700,000 – 1.5M',
  '1.5m_plus': '1.5M ขึ้นไป',
};

const MAILTO_SUBJECT = encodeURIComponent('Re: คำขอจาก house-peach');

export default async function AdminInquiryDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireRole();
  const { id: idStr } = await props.params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const inquiry = await getInquiryById(id);
  if (!inquiry) notFound();

  return (
    <section className="w-full space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <nav aria-label="Breadcrumb">
            <Link
              href="/admin/inquiries"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Inquiries
            </Link>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">
              #{inquiry.id} — {inquiry.contactName}
            </h1>
            <InquiryStatusBadge status={inquiry.status} />
          </div>
        </div>
      </div>

      {/* Two-column layout on lg+ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Project description */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="space-y-2 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                รายละเอียดโปรเจกต์
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {inquiry.projectDescription}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Contact info */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="space-y-4 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                ข้อมูลติดต่อ
              </h2>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    ชื่อ
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {inquiry.contactName}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    อีเมล
                  </dt>
                  <dd className="mt-0.5">
                    <a
                      href={`mailto:${sanitizeMailtoAddress(inquiry.contactEmail)}?subject=${MAILTO_SUBJECT}`}
                      className="inline-flex items-center gap-1 font-mono text-xs text-foreground hover:underline"
                    >
                      <Mail className="size-3 text-muted-foreground" aria-hidden />
                      {inquiry.contactEmail}
                    </a>
                  </dd>
                </div>

                {inquiry.contactPhone && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">
                      เบอร์โทร
                    </dt>
                    <dd className="mt-0.5">
                      <a
                        href={`tel:${inquiry.contactPhone}`}
                        className="inline-flex items-center gap-1 font-mono text-xs text-foreground hover:underline"
                      >
                        <Phone className="size-3 text-muted-foreground" aria-hidden />
                        {inquiry.contactPhone}
                      </a>
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    ประเภทบริการ
                  </dt>
                  <dd className="mt-0.5 text-foreground">
                    {SERVICE_LABEL[inquiry.serviceType] ?? inquiry.serviceType}
                  </dd>
                </div>

                {inquiry.budgetRange && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">
                      งบประมาณ
                    </dt>
                    <dd className="mt-0.5 text-foreground">
                      {BUDGET_LABEL[inquiry.budgetRange as BudgetRange] ??
                        inquiry.budgetRange}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    วันที่ส่ง
                  </dt>
                  <dd className="mt-0.5 text-foreground">
                    {formatDateTime(inquiry.createdAt)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <InquiryStatusSelect id={inquiry.id} current={inquiry.status} />

        <a
          href={`mailto:${sanitizeMailtoAddress(inquiry.contactEmail)}?subject=${MAILTO_SUBJECT}`}
          target="_blank"
          rel="noreferrer"
        >
          <Button variant="outline" size="sm">
            <Mail className="size-4" aria-hidden />
            ตอบกลับทางอีเมล
          </Button>
        </a>

        <div className="ml-auto">
          <InquiryDeleteButton id={inquiry.id} name={inquiry.contactName} />
        </div>
      </div>
    </section>
  );
}

function formatDateTime(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}
