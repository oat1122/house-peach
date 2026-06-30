'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Controller,
  useForm,
  type Resolver,
  type SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  createCategoryAction,
  updateCategoryAction,
} from '@/lib/actions/category';
import { toast } from '@/lib/toast';
import { slugify, slugifyAscii } from '@/lib/utils/slug';
import { CategoryInsert, categoryKinds } from '@/lib/validation/category';

type FormValues = {
  slug: string;
  name: string;
  kind: (typeof categoryKinds)[number];
  color?: string;
  summary?: string;
  sort: number;
};

type EditDefaults = FormValues & { id: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults?: EditDefaults;
};

const KIND_LABELS: Record<(typeof categoryKinds)[number], string> = {
  post: 'บทความ (post)',
  work: 'ผลงาน (work)',
  both: 'ทั้งสอง (both)',
};

// Warm swatch palette (these mirror the design's category colours). Stored as
// HexColor; clicking the active swatch again clears it (uncategorised colour).
const COLOR_SWATCHES = [
  '#b89b7a',
  '#8fa088',
  '#c08a5e',
  '#7a8bb0',
  '#b07a9a',
  '#9c8463',
];

export function CategoryFormDialog({ open, onOpenChange, defaults }: Props) {
  const router = useRouter();
  const mode = defaults ? 'edit' : 'create';
  const [saving, startSaving] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const initial: FormValues = {
    slug: defaults?.slug ?? '',
    name: defaults?.name ?? '',
    kind: defaults?.kind ?? 'both',
    color: defaults?.color,
    summary: defaults?.summary ?? '',
    sort: defaults?.sort ?? 0,
  };

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CategoryInsert) as unknown as Resolver<FormValues>,
    defaultValues: initial,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (open) {
      reset(initial);
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaults?.id]);

  const nameValue = watch('name');

  const submit: SubmitHandler<FormValues> = (data) => {
    setServerError(null);
    startSaving(async () => {
      const result =
        mode === 'create'
          ? await createCategoryAction(data)
          : await updateCategoryAction({ ...data, id: defaults!.id });
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            setError(field as keyof FormValues, {
              type: 'server',
              message: msgs[0],
            });
          }
        }
        toast.error(result.error);
        return;
      }
      toast.success(mode === 'create' ? 'สร้างหมวดหมู่แล้ว' : 'บันทึกแล้ว');
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? 'สร้างหมวดหมู่ใหม่'
              : `แก้ไขหมวดหมู่ "${defaults?.name}"`}
          </DialogTitle>
          <DialogDescription>
            หมวดหมู่จัดกลุ่มเนื้อหา 1 ชิ้นได้ 1 หมวด — เลือก kind เพื่อกำหนดว่าใช้กับ post / work
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          {serverError && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {serverError}
            </p>
          )}

          <Field id="name" label="ชื่อ" error={errors.name?.message} required>
            <Input
              id="name"
              {...register('name')}
              maxLength={80}
              autoComplete="off"
              autoFocus
              aria-required="true"
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
          </Field>

          <Field id="slug" label="Slug" error={errors.slug?.message} required>
            <div className="flex gap-2">
              <Input
                id="slug"
                {...register('slug')}
                maxLength={80}
                autoComplete="off"
                className="font-mono"
                aria-required="true"
                aria-invalid={errors.slug ? 'true' : undefined}
                aria-describedby={errors.slug ? 'slug-error' : undefined}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setValue('slug', slugify(nameValue), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                aria-label="สร้าง slug จากชื่อ (เก็บภาษาไทย)"
              >
                Auto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setValue('slug', slugifyAscii(nameValue), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                aria-label="สร้าง slug แบบอักษรละติน"
              >
                EN
              </Button>
            </div>
          </Field>

          <Field id="summary" label="คำอธิบาย" error={errors.summary?.message}>
            <Textarea
              id="summary"
              {...register('summary')}
              rows={2}
              maxLength={280}
              placeholder="อธิบายสั้น ๆ ว่าหมวดนี้ใช้กับเนื้อหาแบบไหน"
              aria-invalid={errors.summary ? 'true' : undefined}
              aria-describedby={errors.summary ? 'summary-error' : undefined}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="kind" label="ประเภท" error={errors.kind?.message}>
              <Controller
                control={control}
                name="kind"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange(v as (typeof categoryKinds)[number])
                    }
                  >
                    <SelectTrigger id="kind" aria-label="ประเภทหมวดหมู่">
                      <SelectValue placeholder="เลือกประเภท">
                        {(v) =>
                          v && v in KIND_LABELS
                            ? KIND_LABELS[v as (typeof categoryKinds)[number]]
                            : 'เลือกประเภท'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categoryKinds.map((k) => (
                        <SelectItem key={k} value={k}>
                          {KIND_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field id="sort" label="ลำดับ" error={errors.sort?.message}>
              <Input
                id="sort"
                type="number"
                inputMode="numeric"
                min={0}
                max={9999}
                {...register('sort', {
                  setValueAs: (v) =>
                    v === '' || v === null || Number.isNaN(Number(v))
                      ? 0
                      : Number(v),
                })}
                aria-invalid={errors.sort ? 'true' : undefined}
              />
            </Field>
          </div>

          <Field id="color" label="สีประจำหมวด" error={errors.color?.message}>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2" role="group" aria-label="สีประจำหมวด">
                  {COLOR_SWATCHES.map((c) => {
                    const active = field.value === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        title={c}
                        aria-label={`เลือกสี ${c}`}
                        aria-pressed={active}
                        onClick={() => field.onChange(active ? undefined : c)}
                        className={cn(
                          'grid size-7 place-items-center rounded-md border transition',
                          active
                            ? 'border-foreground ring-2 ring-ring ring-offset-1'
                            : 'border-border',
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {active && (
                          <Check className="size-3.5 text-white" aria-hidden />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={saving} aria-busy={saving}>
              {saving ? (
                <>
                  <Spinner className="size-4" />
                  <span>กำลังบันทึก…</span>
                </>
              ) : mode === 'create' ? (
                'สร้าง'
              ) : (
                'บันทึก'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
