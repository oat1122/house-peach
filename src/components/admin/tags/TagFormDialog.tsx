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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { createTagAction, updateTagAction } from '@/lib/actions/tag';
import { toast } from '@/lib/toast';
import { slugify, slugifyAscii } from '@/lib/utils/slug';
import { TagInsert, tagKinds } from '@/lib/validation/tag';

type EditDefaults = {
  id: number;
  slug: string;
  name: string;
  kind: (typeof tagKinds)[number];
  sort: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit mode receives existing tag values; create mode = undefined. */
  defaults?: EditDefaults;
};

const KIND_LABELS: Record<(typeof tagKinds)[number], string> = {
  post: 'บทความ (post)',
  work: 'ผลงาน (work)',
  both: 'ทั้งสอง (both)',
};

/**
 * Single dialog handling both create + edit. Mode is inferred from `defaults`:
 * present = edit, absent = create. Mirrors the WorkForm/PostForm shape — RHF
 * + zodResolver, server-action wrap, fieldErrors mapped back to RHF, toast
 * on success.
 */
export function TagFormDialog({ open, onOpenChange, defaults }: Props) {
  const router = useRouter();
  const mode = defaults ? 'edit' : 'create';
  const [saving, startSaving] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const initial: TagInsert = {
    slug: (defaults?.slug ?? '') as TagInsert['slug'],
    name: defaults?.name ?? '',
    kind: defaults?.kind ?? 'both',
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
  } = useForm<TagInsert>({
    resolver: zodResolver(TagInsert) as unknown as Resolver<TagInsert>,
    defaultValues: initial,
    mode: 'onBlur',
  });

  // Reset the form whenever the dialog opens with a new target. Without this,
  // re-opening for a different tag would keep stale RHF state.
  useEffect(() => {
    if (open) {
      reset(initial);
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaults?.id]);

  const nameValue = watch('name');

  const autoSlug = () => {
    setValue('slug', slugify(nameValue) as TagInsert['slug'], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  const autoSlugAscii = () => {
    setValue('slug', slugifyAscii(nameValue) as TagInsert['slug'], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const submit: SubmitHandler<TagInsert> = (data) => {
    setServerError(null);
    startSaving(async () => {
      const result =
        mode === 'create'
          ? await createTagAction(data)
          : await updateTagAction({ ...data, id: defaults!.id });
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            setError(field as keyof TagInsert, {
              type: 'server',
              message: msgs[0],
            });
          }
        }
        toast.error(result.error);
        return;
      }
      toast.success(mode === 'create' ? 'สร้างแท็กแล้ว' : 'บันทึกแล้ว');
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'สร้างแท็กใหม่' : `แก้ไขแท็ก "${defaults?.name}"`}
          </DialogTitle>
          <DialogDescription>
            แท็กใช้ร่วมระหว่างบทความและผลงาน — เลือก kind เพื่อกำหนดว่าจะให้ใช้ได้ที่ไหน
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submit)}
          noValidate
          className="space-y-4"
        >
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
                aria-describedby={
                  errors.slug ? 'slug-error slug-hint' : 'slug-hint'
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoSlug}
                aria-label="สร้าง slug จากชื่อ (เก็บภาษาไทย)"
              >
                Auto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoSlugAscii}
                aria-label="สร้าง slug แบบอักษรละติน"
              >
                EN
              </Button>
            </div>
            <p id="slug-hint" className="text-[11px] text-muted-foreground">
              a-z, 0-9, ไทย, dash · ใช้ใน URL /blog?tag=&lt;slug&gt; และ /works?tag=&lt;slug&gt;
            </p>
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
                      field.onChange(v as (typeof tagKinds)[number])
                    }
                  >
                    <SelectTrigger
                      id="kind"
                      aria-label="ประเภทแท็ก"
                      aria-invalid={errors.kind ? 'true' : undefined}
                      aria-describedby={errors.kind ? 'kind-error' : undefined}
                    >
                      <SelectValue placeholder="เลือกประเภท">
                        {(v) =>
                          v && v in KIND_LABELS
                            ? KIND_LABELS[v as (typeof tagKinds)[number]]
                            : 'เลือกประเภท'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {tagKinds.map((k) => (
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
                aria-describedby={errors.sort ? 'sort-error' : undefined}
              />
            </Field>
          </div>

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
