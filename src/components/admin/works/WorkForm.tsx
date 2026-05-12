'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Controller,
  useForm,
  type Resolver,
  type SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// zod's branded types (Slug, HexColor) widen the schema output past what RHF
// infers for the form values, so the generic Resolver returned by zodResolver
// trips the assignability check. Cast through a typed Resolver — runtime
// behavior is unchanged; we just tell the type system the brands round-trip.

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/components/common/ConfirmProvider';
import {
  createWorkAction,
  deleteWorkAction,
  setWorkStatusAction,
  updateWorkAction,
} from '@/lib/actions/work';
import { toast } from '@/lib/toast';
import { slugify, slugifyAscii } from '@/lib/utils/slug';
import {
  WorkInsert,
  budgetRanges,
  roomTypes,
  type BudgetRange,
  type RoomType,
} from '@/lib/validation/work';
import { contentStatuses, type ContentStatus } from '@/lib/validation/post';

type TagOption = { id: number; name: string; slug: string };

type DefaultValues = Partial<WorkInsert> & {
  id?: number;
};

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  living: 'ห้องนั่งเล่น',
  bedroom: 'ห้องนอน',
  kitchen: 'ห้องครัว',
  bathroom: 'ห้องน้ำ',
  office: 'ห้องทำงาน',
  outdoor: 'พื้นที่ภายนอก',
  full_house: 'ทั้งบ้าน',
  other: 'อื่น ๆ',
};

const BUDGET_LABELS: Record<BudgetRange, string> = {
  under_100k: 'ต่ำกว่า 100,000',
  '100k_300k': '100,000 – 300,000',
  '300k_700k': '300,000 – 700,000',
  '700k_1.5m': '700,000 – 1.5M',
  '1.5m_plus': '1.5M ขึ้นไป',
};
/** Sentinel value for the budget "no selection" option — Select.Item can't
 *  use empty string or null, so we use a unique non-overlapping token and map
 *  it back to null in `onValueChange`. */
const BUDGET_NONE = '__none__' as const;

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'ฉบับร่าง (draft)',
  published: 'เผยแพร่ (published)',
  archived: 'เก็บถาวร (archived)',
};

export function WorkForm({
  mode,
  defaultValues,
  tagOptions,
  slotRight,
}: {
  mode: 'new' | 'edit';
  defaultValues?: DefaultValues;
  /** Optional column rendered alongside the form fields on desktop. When
   *  provided, the form switches from single-column (max-w-3xl) to a 2-col
   *  grid (max-w-7xl), with this slot pinned `sticky` on lg+ so the gallery
   *  stays visible while the admin scrolls form sections. */
  slotRight?: React.ReactNode;
  tagOptions: TagOption[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [saving, startSaving] = useTransition();
  const [publishing, startPublishing] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const initial: WorkInsert = {
    title: defaultValues?.title ?? '',
    slug: (defaultValues?.slug ?? '') as WorkInsert['slug'],
    summary: defaultValues?.summary ?? '',
    bodyMdx: defaultValues?.bodyMdx ?? '',
    roomType: defaultValues?.roomType ?? 'living',
    style: defaultValues?.style ?? '',
    yearCompleted: defaultValues?.yearCompleted ?? null,
    location: defaultValues?.location ?? null,
    areaSqm: defaultValues?.areaSqm ?? null,
    budgetRange: defaultValues?.budgetRange ?? null,
    coverMediaAssetId: defaultValues?.coverMediaAssetId ?? null,
    tone: (defaultValues?.tone ?? '#f5d6c0') as WorkInsert['tone'],
    accent: (defaultValues?.accent ?? '#a87856') as WorkInsert['accent'],
    tagIds: defaultValues?.tagIds ?? [],
    status: defaultValues?.status ?? 'draft',
    publishedAt: defaultValues?.publishedAt ?? null,
  };

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    getValues,
    control,
    formState: { errors, isDirty },
  } = useForm<WorkInsert>({
    resolver: zodResolver(WorkInsert) as unknown as Resolver<WorkInsert>,
    defaultValues: initial,
    mode: 'onBlur',
  });

  const selectedTagIds = watch('tagIds');
  const titleValue = watch('title');
  const toneValue = watch('tone');
  const accentValue = watch('accent');

  const submit: SubmitHandler<WorkInsert> = (data) => {
    setServerError(null);
    startSaving(async () => {
      const result =
        mode === 'new'
          ? await createWorkAction(data)
          : await updateWorkAction({ ...data, id: defaultValues!.id! });
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            setError(field as keyof WorkInsert, {
              type: 'server',
              message: msgs[0],
            });
          }
        }
        toast.error(result.error);
        return;
      }
      toast.success(mode === 'new' ? 'สร้างผลงานแล้ว' : 'บันทึกแล้ว');
      if (mode === 'new' && 'value' in result && result.value) {
        router.push(`/admin/works/${result.value.id}/edit`);
      } else {
        router.refresh();
      }
    });
  };

  const handlePublishToggle = () => {
    if (mode !== 'edit' || !defaultValues?.id) return;
    const current = getValues('status');
    const next: ContentStatus =
      current === 'published' ? 'draft' : 'published';
    setServerError(null);
    startPublishing(async () => {
      const result = await setWorkStatusAction({ id: defaultValues.id, status: next });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setValue('status', next, { shouldDirty: false });
      toast.success(next === 'published' ? 'เผยแพร่แล้ว' : 'เก็บกลับเป็น draft');
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !defaultValues?.id) return;
    const ok = await confirm({
      title: 'ลบผลงานนี้?',
      description: 'รูปและ tag ที่ผูกอยู่จะหายไปด้วย (cascade) แต่ media asset ยังคงอยู่ใน library',
      confirmLabel: 'ลบ',
      tone: 'destructive',
    });
    if (!ok) return;
    startDeleting(async () => {
      const result = await deleteWorkAction({ id: defaultValues.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('ลบผลงานแล้ว');
      router.push('/admin/works');
    });
  };

  const toggleTag = (tagId: number) => {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setValue('tagIds', next, { shouldDirty: true });
  };

  const autoSlug = () => {
    setValue('slug', slugify(titleValue) as WorkInsert['slug'], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const autoSlugAscii = () => {
    setValue('slug', slugifyAscii(titleValue) as WorkInsert['slug'], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const status = watch('status');
  const isPublished = status === 'published';
  const pendingAny = saving || publishing || deleting;

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="pb-24">
      <div
        className={
          'mx-auto w-full px-4 py-6 lg:px-6 lg:py-8 ' +
          (slotRight
            ? 'max-w-7xl grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-8'
            : 'max-w-3xl')
        }
      >
        <div className="min-w-0 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            {mode === 'new' ? 'สร้างผลงานใหม่' : 'แก้ไขผลงาน'}
          </h1>
          <p className="text-sm text-muted-foreground">
            กรอกข้อมูลผลงาน · gallery composition อยู่ในแท็บถัดไป (Phase B)
          </p>
        </header>

        {serverError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </p>
        )}

        <Section title="หัวข้อ & URL">
          <Field id="title" label="หัวข้อ" error={errors.title?.message} required>
            <Input
              id="title"
              {...register('title')}
              onBlur={(e) => {
                register('title').onBlur(e);
                if (!initial.slug || mode === 'new') autoSlug();
              }}
              maxLength={180}
              autoComplete="off"
            />
          </Field>

          <Field id="slug" label="Slug (URL)" error={errors.slug?.message} required>
            <div className="flex gap-2">
              <Input
                id="slug"
                {...register('slug')}
                maxLength={140}
                autoComplete="off"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoSlug}
                title="สร้าง slug จากหัวข้อ — เก็บไทยไว้"
              >
                Auto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoSlugAscii}
                title="สร้าง slug แบบอังกฤษล้วน — แชร์บน social ได้สวยกว่า"
              >
                EN
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              a-z, 0-9, ไทย, dash · ใช้ใน URL /works/&lt;slug&gt; · slug ภาษาอังกฤษล้วน
              จะเป็น URL ที่อ่านง่ายและแชร์ได้สวยกว่า (ไม่มี %E0%B8%…)
            </p>
          </Field>
        </Section>

        <Section title="เนื้อหา">
          <Field
            id="summary"
            label="สรุปสั้น (สำหรับ card + meta description)"
            error={errors.summary?.message}
            required
          >
            <Textarea
              id="summary"
              {...register('summary')}
              maxLength={280}
              rows={3}
            />
          </Field>

          <Field id="bodyMdx" label="เนื้อหา (MDX)" error={errors.bodyMdx?.message} required>
            <Textarea
              id="bodyMdx"
              {...register('bodyMdx')}
              rows={10}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              รองรับ Markdown + MDX components · Phase 4 จะเปลี่ยนเป็น CodeMirror
            </p>
          </Field>
        </Section>

        <Section title="รายละเอียดโครงการ">
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="roomType" label="ประเภทพื้นที่" error={errors.roomType?.message} required>
              <Controller
                control={control}
                name="roomType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as RoomType)}
                  >
                    <SelectTrigger id="roomType" aria-label="ประเภทพื้นที่">
                      <SelectValue placeholder="เลือกประเภท">
                        {(v) =>
                          v && v in ROOM_TYPE_LABELS
                            ? ROOM_TYPE_LABELS[v as RoomType]
                            : 'เลือกประเภท'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROOM_TYPE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field id="style" label="สไตล์" error={errors.style?.message} required>
              <Input
                id="style"
                {...register('style')}
                placeholder="เช่น japandi, minimalist"
              />
            </Field>

            <Field id="yearCompleted" label="ปีที่เสร็จ" error={errors.yearCompleted?.message}>
              <Input
                id="yearCompleted"
                type="number"
                inputMode="numeric"
                min={1990}
                max={2100}
                {...register('yearCompleted', { valueAsNumber: true, setValueAs: (v) => (v === '' || Number.isNaN(v) ? null : Number(v)) })}
              />
            </Field>

            <Field id="location" label="สถานที่" error={errors.location?.message}>
              <Input
                id="location"
                {...register('location', { setValueAs: (v) => (v ? String(v) : null) })}
                placeholder="เช่น อารีย์, กรุงเทพฯ"
              />
            </Field>

            <Field id="areaSqm" label="พื้นที่ (ตร.ม.)" error={errors.areaSqm?.message}>
              <Input
                id="areaSqm"
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register('areaSqm', { setValueAs: (v) => (v === '' || Number.isNaN(Number(v)) ? null : Number(v)) })}
              />
            </Field>

            <Field id="budgetRange" label="ช่วงงบประมาณ" error={errors.budgetRange?.message}>
              <Controller
                control={control}
                name="budgetRange"
                render={({ field }) => (
                  <Select
                    value={field.value ?? BUDGET_NONE}
                    onValueChange={(v) =>
                      field.onChange(v === BUDGET_NONE ? null : (v as BudgetRange))
                    }
                  >
                    <SelectTrigger id="budgetRange" aria-label="ช่วงงบประมาณ">
                      <SelectValue placeholder="— ไม่ระบุ —">
                        {(v) =>
                          v && v !== BUDGET_NONE && v in BUDGET_LABELS
                            ? BUDGET_LABELS[v as BudgetRange]
                            : '— ไม่ระบุ —'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BUDGET_NONE}>— ไม่ระบุ —</SelectItem>
                      {budgetRanges.map((b) => (
                        <SelectItem key={b} value={b}>
                          {BUDGET_LABELS[b]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
        </Section>

        <Section title="สีของ card">
          <div className="grid gap-4 md:grid-cols-2">
            <ColorField
              id="tone"
              label="โทนพื้นหลัง"
              value={toneValue}
              {...register('tone')}
            />
            <ColorField
              id="accent"
              label="สีเน้น"
              value={accentValue}
              {...register('accent')}
            />
          </div>
          <div
            className="mt-3 flex h-12 items-center gap-3 rounded-md px-4 text-sm"
            style={{ backgroundColor: toneValue, color: accentValue }}
            aria-hidden
          >
            ตัวอย่าง · text uses accent on tone background
          </div>
        </Section>

        <Section title="แท็ก">
          {tagOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีแท็กที่กำหนดให้ใช้กับผลงาน — เพิ่มจาก{' '}
              <a href="/admin/tags" className="underline">
                /admin/tags
              </a>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((t) => {
                const active = selectedTagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    aria-pressed={active}
                    className={
                      'rounded-full border px-3 py-1 text-xs transition ' +
                      (active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-foreground hover:bg-muted')
                    }
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="สถานะ">
          <Field id="status" label="สถานะ" error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as ContentStatus)}
                >
                  <SelectTrigger id="status" aria-label="สถานะ">
                    <SelectValue placeholder="เลือกสถานะ">
                      {(v) =>
                        v && v in STATUS_LABELS
                          ? STATUS_LABELS[v as ContentStatus]
                          : 'เลือกสถานะ'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {contentStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </Section>
        </div>

        {slotRight && (
          <aside
            aria-label="แกลเลอรีของผลงาน"
            className="min-w-0 lg:sticky lg:top-16 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
          >
            {slotRight}
          </aside>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div
          className={
            'mx-auto flex items-center justify-between gap-3 px-4 py-3 lg:px-6 ' +
            (slotRight ? 'max-w-7xl' : 'max-w-3xl')
          }
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/works')}
            disabled={pendingAny}
          >
            ← กลับไป list
          </Button>
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={pendingAny}
                  aria-busy={deleting}
                >
                  {deleting ? <Spinner className="size-4" /> : null}
                  ลบ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePublishToggle}
                  disabled={pendingAny}
                  aria-busy={publishing}
                  title={
                    isDirty
                      ? 'กำลังเปลี่ยนสถานะเท่านั้น — การแก้ form ที่ยังไม่บันทึกจะไม่ถูกบันทึก'
                      : undefined
                  }
                >
                  {publishing ? <Spinner className="size-4" /> : null}
                  {isPublished ? 'เปลี่ยนเป็น draft' : 'เผยแพร่ตอนนี้'}
                </Button>
              </>
            )}
            <Button type="submit" disabled={pendingAny} aria-busy={saving}>
              {saving ? (
                <>
                  <Spinner className="size-4" />
                  <span>กำลังบันทึก…</span>
                </>
              ) : mode === 'new' ? (
                'สร้าง'
              ) : (
                'บันทึก'
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          {...rest}
          className="h-8 w-12 cursor-pointer rounded border border-input bg-transparent"
        />
        <code className="text-xs text-muted-foreground">{value}</code>
      </div>
    </div>
  );
}
