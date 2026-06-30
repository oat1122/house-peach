'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type Resolver,
  type SubmitHandler,
  type UseFormRegister,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// zod's branded types (Slug, HexColor) widen the schema output past what RHF
// infers for the form values, so the generic Resolver returned by zodResolver
// trips the assignability check. Cast through a typed Resolver — runtime
// behavior is unchanged; we just tell the type system the brands round-trip.

import { X } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import {
  EditActionBar,
  EditCard,
  EditGrid,
  FormField,
  SlugField,
  STATUS_DOT,
  StatusRadioGroup,
  ToggleSwitch,
} from '@/components/admin/EditFormChrome';
import { useConfirm } from '@/components/common/ConfirmProvider';
import {
  createWorkAction,
  deleteWorkAction,
  updateWorkAction,
} from '@/lib/actions/work';
import { toast } from '@/lib/toast';
import { slugify, slugifyAscii } from '@/lib/utils/slug';
import {
  WorkInsert,
  budgetRanges,
  roomTypes,
  type BudgetRange,
  type HomeSection,
  type RoomType,
} from '@/lib/validation/work';
import { contentStatuses, type ContentStatus } from '@/lib/validation/post';
import { EMPTY_TIPTAP_DOC } from '@/lib/tiptap/text';
import { TiptapEditor } from '@/components/admin/posts/TiptapEditor';

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

const STATUS_OPTIONS = contentStatuses.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
  dot: STATUS_DOT[s],
}));

export function WorkForm({
  mode,
  defaultValues,
  tagOptions,
  categoryOptions,
  slotRight,
}: {
  mode: 'new' | 'edit';
  defaultValues?: DefaultValues;
  /** Gallery editor (edit mode only). Rendered as a full-width card in the
   *  main column — it is too rich for the 312px meta sidebar. */
  slotRight?: React.ReactNode;
  tagOptions: TagOption[];
  categoryOptions: { id: number; name: string }[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const initial: WorkInsert = {
    title: defaultValues?.title ?? '',
    slug: (defaultValues?.slug ?? '') as WorkInsert['slug'],
    summary: defaultValues?.summary ?? '',
    body: defaultValues?.body ?? EMPTY_TIPTAP_DOC,
    roomType: defaultValues?.roomType ?? 'living',
    style: defaultValues?.style ?? '',
    yearCompleted: defaultValues?.yearCompleted ?? null,
    location: defaultValues?.location ?? null,
    areaSqm: defaultValues?.areaSqm ?? null,
    budgetRange: defaultValues?.budgetRange ?? null,
    coverMediaAssetId: defaultValues?.coverMediaAssetId ?? null,
    categoryId: defaultValues?.categoryId ?? null,
    tone: (defaultValues?.tone ?? '#f5d6c0') as WorkInsert['tone'],
    accent: (defaultValues?.accent ?? '#a87856') as WorkInsert['accent'],
    tagIds: defaultValues?.tagIds ?? [],
    status: defaultValues?.status ?? 'draft',
    publishedAt: defaultValues?.publishedAt ?? null,
    homeSection: defaultValues?.homeSection ?? 'none',
    // v2.2 editorial fields — treat DB null as empty for the form
    durationDays: defaultValues?.durationDays ?? null,
    clientQuote: defaultValues?.clientQuote ?? null,
    clientName: defaultValues?.clientName ?? null,
    designerNote: defaultValues?.designerNote ?? null,
    materials: defaultValues?.materials ?? [],
  };

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    control,
    formState: { errors },
  } = useForm<WorkInsert>({
    resolver: zodResolver(WorkInsert) as unknown as Resolver<WorkInsert>,
    defaultValues: initial,
    mode: 'onBlur',
  });

  const selectedTagIds = watch('tagIds');
  const titleValue = watch('title');
  const toneValue = watch('tone');
  const accentValue = watch('accent');
  const status = watch('status');
  const homeSection = watch('homeSection');

  const submit: SubmitHandler<WorkInsert> = (data) => {
    setServerError(null);
    // Normalise: RHF stores materials as [] when no items are added,
    // but the DB column expects null for "no materials". Convert back.
    const payload: WorkInsert = {
      ...data,
      materials:
        data.materials && data.materials.length > 0 ? data.materials : null,
    };
    startSaving(async () => {
      const result =
        mode === 'new'
          ? await createWorkAction(payload)
          : await updateWorkAction({ ...payload, id: defaultValues!.id! });
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

  const pendingAny = saving || deleting;

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="pb-16">
      <EditActionBar
        heading={mode === 'new' ? 'สร้างผลงานใหม่' : 'แก้ไขผลงาน'}
        onCancel={() => router.push('/admin/works')}
        onDelete={mode === 'edit' ? handleDelete : undefined}
        deleting={deleting}
        saving={saving}
        pending={pendingAny}
        saveLabel={mode === 'new' ? 'สร้าง' : 'บันทึก'}
      />

      <EditGrid
        main={
          <>
            {serverError && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {serverError}
              </p>
            )}

            <EditCard>
              <FormField
                id="title"
                label="หัวข้อ"
                error={errors.title?.message}
                required
              >
                <Input
                  id="title"
                  {...register('title')}
                  onBlur={(e) => {
                    register('title').onBlur(e);
                    if (!initial.slug || mode === 'new') autoSlug();
                  }}
                  maxLength={180}
                  autoComplete="off"
                  className="text-base font-semibold"
                />
              </FormField>

              <SlugField
                prefix="/works/"
                registerProps={register('slug')}
                onAuto={autoSlug}
                onAutoAscii={autoSlugAscii}
                error={errors.slug?.message}
              />

              <FormField
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
              </FormField>
            </EditCard>

            <EditCard title="ข้อมูลโปรเจกต์">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="roomType"
                  label="ประเภทพื้นที่"
                  error={errors.roomType?.message}
                  required
                >
                  <Controller
                    control={control}
                    name="roomType"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v as RoomType)}
                      >
                        <SelectTrigger
                          id="roomType"
                          aria-label="ประเภทพื้นที่"
                          className="w-full"
                        >
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
                </FormField>

                <FormField
                  id="style"
                  label="สไตล์"
                  error={errors.style?.message}
                  required
                >
                  <Input
                    id="style"
                    {...register('style')}
                    placeholder="เช่น japandi, minimalist"
                  />
                </FormField>

                <FormField
                  id="yearCompleted"
                  label="ปีที่เสร็จ"
                  error={errors.yearCompleted?.message}
                >
                  <Input
                    id="yearCompleted"
                    type="number"
                    inputMode="numeric"
                    min={1990}
                    max={2100}
                    {...register('yearCompleted', {
                      valueAsNumber: true,
                      setValueAs: (v) =>
                        v === '' || Number.isNaN(v) ? null : Number(v),
                    })}
                  />
                </FormField>

                <FormField
                  id="location"
                  label="สถานที่"
                  error={errors.location?.message}
                >
                  <Input
                    id="location"
                    {...register('location', {
                      setValueAs: (v) => (v ? String(v) : null),
                    })}
                    placeholder="เช่น อารีย์, กรุงเทพฯ"
                  />
                </FormField>

                <FormField
                  id="areaSqm"
                  label="พื้นที่ (ตร.ม.)"
                  error={errors.areaSqm?.message}
                >
                  <Input
                    id="areaSqm"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register('areaSqm', {
                      setValueAs: (v) =>
                        v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                    })}
                  />
                </FormField>

                <FormField
                  id="budgetRange"
                  label="ช่วงงบประมาณ"
                  error={errors.budgetRange?.message}
                >
                  <Controller
                    control={control}
                    name="budgetRange"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? BUDGET_NONE}
                        onValueChange={(v) =>
                          field.onChange(
                            v === BUDGET_NONE ? null : (v as BudgetRange),
                          )
                        }
                      >
                        <SelectTrigger
                          id="budgetRange"
                          aria-label="ช่วงงบประมาณ"
                          className="w-full"
                        >
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
                </FormField>
              </div>
            </EditCard>

            <EditCard title="เนื้อหา (The Brief)">
              <FormField id="body" label="เนื้อหา" error={errors.body?.message} required>
                <Controller
                  control={control}
                  name="body"
                  render={({ field }) => (
                    <TiptapEditor
                      id="body"
                      value={field.value}
                      onChange={field.onChange}
                      ariaLabel="เนื้อหาผลงาน"
                    />
                  )}
                />
              </FormField>
            </EditCard>

            {slotRight && <EditCard title="แกลเลอรีภาพ">{slotRight}</EditCard>}

            <EditCard title="เนื้อหาเพิ่มเติม · Editorial">
              <FormField
                id="durationDays"
                label="ระยะเวลา (วัน)"
                error={errors.durationDays?.message}
                hint='จะแสดงเป็น "45 วัน", "6 สัปดาห์" หรือ "3 เดือน" อัตโนมัติ'
              >
                <Input
                  id="durationDays"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={3650}
                  placeholder="เช่น 45"
                  {...register('durationDays', {
                    setValueAs: (v) =>
                      v === '' || v === null || Number.isNaN(Number(v))
                        ? null
                        : Number(v),
                  })}
                />
              </FormField>

              <FormField
                id="clientQuote"
                label="คำพูดจากลูกค้า"
                error={errors.clientQuote?.message}
                hint="จะแสดงเป็น Pull Quote กลางหน้า"
              >
                <Textarea
                  id="clientQuote"
                  {...register('clientQuote', {
                    setValueAs: (v) => (v === '' ? null : v ?? null),
                  })}
                  maxLength={500}
                  rows={4}
                  placeholder="ใส่คำพูดโดยไม่ต้องมีเครื่องหมายคำพูด"
                />
              </FormField>

              <FormField
                id="clientName"
                label="ชื่อลูกค้า"
                error={errors.clientName?.message}
                hint="แสดงเป็นที่มาของคำพูด (— คุณสมศรี)"
              >
                <Input
                  id="clientName"
                  {...register('clientName', {
                    setValueAs: (v) => (v === '' ? null : v ?? null),
                  })}
                  maxLength={80}
                  placeholder="เช่น คุณสมศรี หรือ เจ้าของบ้าน"
                />
              </FormField>

              <FormField
                id="designerNote"
                label="หมายเหตุจากนักออกแบบ"
                error={errors.designerNote?.message}
                hint='จะแสดงก่อน CTA card พร้อมลายเซ็น "— ทีม house-peach"'
              >
                <Textarea
                  id="designerNote"
                  {...register('designerNote', {
                    setValueAs: (v) => (v === '' ? null : v ?? null),
                  })}
                  maxLength={1000}
                  rows={6}
                />
              </FormField>

              <MaterialsField control={control} register={register} errors={errors} />
            </EditCard>

            <EditCard title="สีของ card">
              <div className="grid gap-4 sm:grid-cols-2">
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
            </EditCard>
          </>
        }
        side={
          <>
            <EditCard title="การเผยแพร่">
              <FormField label="สถานะ" error={errors.status?.message}>
                <StatusRadioGroup
                  value={status}
                  onChange={(v) =>
                    setValue('status', v, { shouldDirty: true })
                  }
                  options={STATUS_OPTIONS}
                />
              </FormField>

              <div className="border-t border-border pt-4">
                <ToggleSwitch
                  id="homeSection"
                  checked={homeSection === 'discover'}
                  onChange={(next) =>
                    setValue(
                      'homeSection',
                      (next ? 'discover' : 'none') as HomeSection,
                      { shouldDirty: true },
                    )
                  }
                  label="แนะนำหน้าแรก"
                  description='โชว์ในส่วน "ค้นพบงานออกแบบ" บนหน้า Home (สูงสุด 4 · ต้องเผยแพร่ด้วย)'
                />
              </div>
            </EditCard>

            <EditCard title="แท็ก">
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
            </EditCard>

            <EditCard title="หมวดหมู่" description="เลือกได้ 1 หมวด (ไม่บังคับ)">
              {categoryOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ยังไม่มีหมวดหมู่สำหรับผลงาน — เพิ่มจาก{' '}
                  <a href="/admin/categories" className="underline">
                    /admin/categories
                  </a>
                </p>
              ) : (
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value == null ? 'none' : String(field.value)}
                      onValueChange={(v) =>
                        field.onChange(v === 'none' ? null : Number(v))
                      }
                    >
                      <SelectTrigger
                        id="categoryId"
                        aria-label="หมวดหมู่"
                        className="w-full"
                      >
                        <SelectValue placeholder="เลือกหมวดหมู่">
                          {(v) => {
                            if (!v || v === 'none') return '— ไม่มีหมวดหมู่ —';
                            return (
                              categoryOptions.find((c) => String(c.id) === v)
                                ?.name ?? 'เลือกหมวดหมู่'
                            );
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— ไม่มีหมวดหมู่ —</SelectItem>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </EditCard>
          </>
        }
      />
    </form>
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

function MaterialsField({
  control,
  register,
  errors,
}: {
  control: Control<WorkInsert>;
  register: UseFormRegister<WorkInsert>;
  errors: FieldErrors<WorkInsert>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'materials' as never,
  });

  const MAX_MATERIALS = 8;
  // Safe cast: materials errors are per-item objects when present
  const materialErrors = errors.materials as
    | Array<{ name?: { message?: string }; colorHex?: { message?: string } } | undefined>
    | undefined;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">
        วัสดุที่ใช้ (สูงสุด {MAX_MATERIALS})
      </p>
      {fields.length > 0 && (
        <ul className="space-y-2">
          {fields.map((field, index) => {
            const nameError = materialErrors?.[index]?.name?.message;
            return (
              <li key={field.id} className="flex items-center gap-2">
                <Input
                  {...register(`materials.${index}.name` as const)}
                  placeholder="ชื่อวัสดุ เช่น Travertine"
                  maxLength={60}
                  className="h-8 flex-1 text-xs"
                  aria-label={`ชื่อวัสดุที่ ${index + 1}`}
                  aria-invalid={!!nameError}
                />
                <div className="flex shrink-0 items-center gap-1.5">
                  <input
                    {...register(`materials.${index}.colorHex` as const)}
                    type="color"
                    className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent"
                    aria-label={`สีวัสดุที่ ${index + 1}`}
                  />
                  <MaterialHexDisplay control={control} index={index} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => remove(index)}
                  aria-label={`ลบวัสดุที่ ${index + 1}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({ name: '', colorHex: '#cccccc' as NonNullable<NonNullable<WorkInsert['materials']>[number]>['colorHex'] })
        }
        disabled={fields.length >= MAX_MATERIALS}
        className="text-xs"
      >
        + เพิ่มวัสดุ
      </Button>
      <p className="text-[11px] text-muted-foreground">
        ใช้เพิ่ม chip palette ใน Concept section ของหน้าโปรเจกต์
      </p>
    </div>
  );
}

/** Shows the live hex value of a material's colorHex — reads via useWatch. */
function MaterialHexDisplay({
  control,
  index,
}: {
  control: Control<WorkInsert>;
  index: number;
}) {
  const hex = useWatch({ control, name: `materials.${index}.colorHex` as const });
  return <code className="w-[5.5rem] text-[10px] text-muted-foreground">{hex ?? '#cccccc'}</code>;
}
