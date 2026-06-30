'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { createContactInquiryAction } from '@/lib/actions/contact';
import { ContactInquiryInsert, serviceTypes } from '@/lib/validation/contact';
import { budgetRanges } from '@/lib/validation/work';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// Schema extended with two honeypot fields. Names MUST match the constants
// in `lib/actions/contact.ts` (HONEYPOT_FIELD + TIMING_FIELD) — bot lists
// recognise `website` / `email` / `subject`; `_hp_extra` does not appear in
// any common trained name list.
//
// zodResolver (zod v4 overload) types useForm with z4.input<T> — i.e. the
// INPUT shape of the schema, not the output. We derive FormValues from
// z.input so the types line up without casting.
import { z } from 'zod';
const FormSchema = ContactInquiryInsert.extend({
  _hp_extra: z.string().max(0).default(''),
  _hp_started_at: z.union([z.string(), z.number()]).optional(),
});
type FormValues = z.input<typeof FormSchema>;

// Service type values → display label
const SERVICE_LABEL: Record<(typeof serviceTypes)[number], string> = {
  full_design: 'ออกแบบทั้งหมด',
  consultation: 'ปรึกษาออกแบบ',
  partial: 'บางส่วน / ห้องเดียว',
  other: 'อื่น ๆ',
};

// Budget range values → display label
const BUDGET_LABEL: Record<(typeof budgetRanges)[number], string> = {
  under_100k: 'ต่ำกว่า 100,000',
  '100k_300k': '100,000 – 300,000',
  '300k_700k': '300,000 – 700,000',
  '700k_1.5m': '700,000 – 1.5M',
  '1.5m_plus': '1.5M ขึ้นไป',
};

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  // Mount-time stamp for the timing honeypot. Computed once via useMemo so
  // re-renders don't reset it; the server rejects submissions with delta
  // < 2 s (bot autofill) or > 24 h (stale/replay).
  const mountedAt = useMemo(() => Date.now(), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      serviceType: undefined,
      budgetRange: undefined,
      projectDescription: '',
      _hp_extra: '',
      _hp_started_at: mountedAt,
    },
    mode: 'onBlur',
  });

  const { register, handleSubmit, formState, watch, setError, reset } = form;
  const { errors, isValid } = formState;

  const descriptionValue = watch('projectDescription') ?? '';

  function onSubmit(values: FormValues) {
    setGenericError(null);
    startTransition(async () => {
      const result = await createContactInquiryAction(values);
      if (result.ok) {
        reset();
        setSubmitted(true);
        // Defer focus so the element is painted before we focus it
        setTimeout(() => {
          successHeadingRef.current?.focus();
        }, 50);
      } else {
        if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const key = field as keyof FormValues;
            setError(key, { message: (messages as string[])[0] });
          }
        } else {
          setGenericError(result.error ?? 'ส่งข้อความไม่สำเร็จ — ลองใหม่อีกครั้ง');
        }
      }
    });
  }

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center gap-6 py-12 text-center"
        role="region"
        aria-label="ขอบคุณ — ได้รับข้อความแล้ว"
      >
        <CheckCircle2
          size={48}
          className="text-brand-accent mx-auto"
          aria-hidden="true"
        />
        <div>
          {/*
           * tabIndex=-1 lets us call .focus() so screen readers announce the
           * success state immediately. The focus ring stays default-visible
           * — sighted keyboard users get a clear indicator of where focus
           * landed, which matters when they Shift+Tab back toward the form.
           */}
          <h2
            ref={successHeadingRef}
            tabIndex={-1}
            className="text-2xl font-semibold text-ink mb-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            ขอบคุณ — ได้รับข้อความแล้ว
          </h2>
          <p className="text-base text-muted-brand leading-[1.65] max-w-prose mx-auto">
            เราจะตอบกลับทางอีเมลของคุณภายใน 2 วันทำการ
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/works"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-md bg-ink text-bg text-sm font-medium hover:bg-ink/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            ดูผลงานของเรา
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-md border border-line text-ink text-sm font-medium hover:bg-bg2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            อ่านเพิ่มเติม
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="แบบฟอร์มติดต่อ"
    >
      {/*
       * Honeypot fields — both hidden from real users.
       *
       *   _hp_extra      — text trap; bots fill any input, users never see it.
       *                    Name is intentionally obscure (not `website`/`url`)
       *                    so trained bot lists don't auto-skip it.
       *   _hp_started_at — mount timestamp; server checks submission delta is
       *                    ≥ 2 s and ≤ 24 h.
       *
       * Wrapped in a sr-only container; individual fields also carry
       * tabIndex / aria-hidden / autoComplete=off so AT and pointer flow
       * skip them cleanly.
       */}
      <div aria-hidden="true" className="sr-only" data-testid="hp">
        <label htmlFor="_hp_extra">Leave this field empty</label>
        <input
          id="_hp_extra"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('_hp_extra')}
        />
        <input
          type="hidden"
          {...register('_hp_started_at', { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-6">
        {/* contactName */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactName">
            ชื่อของคุณ
            <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="contactName"
            type="text"
            autoComplete="name"
            aria-required="true"
            aria-invalid={!!errors.contactName}
            aria-describedby={errors.contactName ? 'contactName-error' : undefined}
            className="min-h-[44px]"
            {...register('contactName')}
          />
          {errors.contactName && (
            <span
              id="contactName-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.contactName.message}
            </span>
          )}
        </div>

        {/* contactEmail */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail">
            อีเมล
            <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="contactEmail"
            type="email"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.contactEmail}
            aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
            className="min-h-[44px]"
            {...register('contactEmail')}
          />
          {errors.contactEmail && (
            <span
              id="contactEmail-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.contactEmail.message}
            </span>
          )}
        </div>

        {/* contactPhone */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPhone">
            เบอร์โทร (ไม่บังคับ)
          </Label>
          <Input
            id="contactPhone"
            type="tel"
            autoComplete="tel"
            aria-invalid={!!errors.contactPhone}
            aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
            className="min-h-[44px]"
            {...register('contactPhone')}
          />
          {errors.contactPhone && (
            <span
              id="contactPhone-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.contactPhone.message}
            </span>
          )}
        </div>

        {/* serviceType */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="serviceType">
            ประเภทบริการ
            <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
          </Label>
          <select
            id="serviceType"
            aria-required="true"
            aria-invalid={!!errors.serviceType}
            aria-describedby={errors.serviceType ? 'serviceType-error' : undefined}
            className="min-h-[44px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-ink transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
            {...register('serviceType')}
          >
            <option value="">เลือกประเภทบริการ</option>
            {serviceTypes.map((value) => (
              <option key={value} value={value}>
                {SERVICE_LABEL[value]}
              </option>
            ))}
          </select>
          {errors.serviceType && (
            <span
              id="serviceType-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.serviceType.message}
            </span>
          )}
        </div>

        {/* budgetRange */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budgetRange">
            งบประมาณ (ไม่บังคับ)
          </Label>
          <select
            id="budgetRange"
            aria-invalid={!!errors.budgetRange}
            aria-describedby={errors.budgetRange ? 'budgetRange-error' : undefined}
            className="min-h-[44px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-ink transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
            {...register('budgetRange')}
          >
            <option value="">เลือกช่วงงบประมาณ</option>
            {budgetRanges.map((value) => (
              <option key={value} value={value}>
                {BUDGET_LABEL[value]}
              </option>
            ))}
          </select>
          {errors.budgetRange && (
            <span
              id="budgetRange-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.budgetRange.message}
            </span>
          )}
        </div>

        {/* projectDescription */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="projectDescription">
              เล่าเกี่ยวกับโปรเจกต์ของคุณ
              <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
            </Label>
            {/*
             * Decorative counter — visible feedback only. aria-hidden so the
             * screen reader does NOT announce every keystroke (that would be
             * intolerable). SR users get the constraint from the textarea's
             * built-in maxlength + the help text linked via aria-describedby.
             */}
            <span
              aria-hidden="true"
              className="text-xs text-muted-brand tabular-nums"
            >
              {descriptionValue.length}/2000
            </span>
          </div>
          <Textarea
            id="projectDescription"
            rows={5}
            maxLength={2000}
            aria-required="true"
            aria-invalid={!!errors.projectDescription}
            aria-describedby={[
              'projectDescription-help',
              errors.projectDescription ? 'projectDescription-error' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            className="min-h-[132px] resize-y"
            {...register('projectDescription')}
          />
          <span
            id="projectDescription-help"
            className="text-xs text-muted-brand"
          >
            ประเภทห้อง สไตล์ที่ชอบ ช่วงเวลา หรือสิ่งใดก็ตามที่จะช่วยให้เราเข้าใจห้องของคุณ
          </span>
          {errors.projectDescription && (
            <span
              id="projectDescription-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.projectDescription.message}
            </span>
          )}
        </div>

        {/* Generic error */}
        {genericError && (
          <div role="alert" className="text-sm text-destructive">
            {genericError}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending || !isValid}
          aria-busy={isPending}
          className="w-full md:w-auto min-h-[44px] px-6 bg-ink text-bg hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Spinner className="mr-2 size-4" aria-hidden="true" />
              <span>กำลังส่ง…</span>
            </>
          ) : (
            'ส่งข้อความ'
          )}
        </Button>
      </div>
    </form>
  );
}
