'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Controller,
  useForm,
  type Resolver,
  type SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileText,
  ImagePlus,
  Search,
  Settings as SettingsIcon,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  MediaPicker,
  type PickerAsset,
} from '@/components/admin/media/MediaPicker';
import { useConfirm } from '@/components/common/ConfirmProvider';
import {
  createPostAction,
  deletePostAction,
  setPostStatusAction,
  updatePostAction,
} from '@/lib/actions/post';
import { toast } from '@/lib/toast';
import { slugify, slugifyAscii } from '@/lib/utils/slug';
import {
  PostInsert,
  contentStatuses,
  type ContentStatus,
} from '@/lib/validation/post';

import { EMPTY_TIPTAP_DOC } from '@/lib/tiptap/text';

import { TiptapEditor } from './TiptapEditor';
import { PostSeoPreview } from './PostSeoPreview';

type TagOption = { id: number; name: string; slug: string };

type DefaultValues = Partial<PostInsert> & {
  id?: number;
  /** Read-only metadata shown in the Settings tab; never goes to the action. */
  createdAt?: Date | null;
  updatedAt?: Date | null;
  viewCount?: number;
  readingTimeMin?: number | null;
};

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'ฉบับร่าง (draft)',
  published: 'เผยแพร่ (published)',
  archived: 'เก็บถาวร (archived)',
};

export function PostForm({
  mode,
  defaultValues,
  tagOptions,
  categoryOptions,
  libraryAssets,
  authorName,
  coverAssetCache,
}: {
  mode: 'new' | 'edit';
  defaultValues?: DefaultValues;
  tagOptions: TagOption[];
  categoryOptions: { id: number; name: string }[];
  libraryAssets: PickerAsset[];
  /** Author display name for the SEO preview. The action takes the author id
   *  from session — never from this prop. */
  authorName: string | null;
  /** Pre-resolved cover row used to show the current thumbnail + alt without
   *  rewalking `libraryAssets`. Required on edit when the cover was set; can
   *  be omitted on new. */
  coverAssetCache?: PickerAsset | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [saving, startSaving] = useTransition();
  const [publishing, startPublishing] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverAsset, setCoverAsset] = useState<PickerAsset | null>(
    coverAssetCache ?? null,
  );

  const initial: PostInsert = {
    title: defaultValues?.title ?? '',
    slug: (defaultValues?.slug ?? '') as PostInsert['slug'],
    excerpt: defaultValues?.excerpt ?? '',
    body: defaultValues?.body ?? EMPTY_TIPTAP_DOC,
    tagIds: defaultValues?.tagIds ?? [],
    coverMediaAssetId: defaultValues?.coverMediaAssetId ?? null,
    categoryId: defaultValues?.categoryId ?? null,
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
  } = useForm<PostInsert>({
    resolver: zodResolver(PostInsert) as unknown as Resolver<PostInsert>,
    defaultValues: initial,
    mode: 'onBlur',
  });

  const titleValue = watch('title');
  const slugValue = watch('slug');
  const excerptValue = watch('excerpt');
  const bodyValue = watch('body');
  const status = watch('status');
  const selectedTagIds = watch('tagIds');
  const selectedTagNames = tagOptions
    .filter((t) => selectedTagIds.includes(t.id))
    .map((t) => t.name);

  const submit: SubmitHandler<PostInsert> = (data) => {
    setServerError(null);
    startSaving(async () => {
      const result =
        mode === 'new'
          ? await createPostAction(data)
          : await updatePostAction({ ...data, id: defaultValues!.id! });
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            setError(field as keyof PostInsert, {
              type: 'server',
              message: msgs[0],
            });
          }
        }
        toast.error(result.error);
        return;
      }
      toast.success(mode === 'new' ? 'สร้างบทความแล้ว' : 'บันทึกแล้ว');
      if (mode === 'new' && 'value' in result && result.value) {
        router.push(`/admin/posts/${result.value.id}/edit`);
      } else {
        router.refresh();
      }
    });
  };

  const handlePublishToggle = () => {
    if (mode !== 'edit' || !defaultValues?.id) return;
    const current = getValues('status');
    const next: ContentStatus = current === 'published' ? 'draft' : 'published';
    setServerError(null);
    startPublishing(async () => {
      const result = await setPostStatusAction({
        id: defaultValues.id,
        status: next,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setValue('status', next, { shouldDirty: false });
      toast.success(
        next === 'published' ? 'เผยแพร่แล้ว' : 'เก็บกลับเป็น draft',
      );
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !defaultValues?.id) return;
    const ok = await confirm({
      title: 'ลบบทความนี้?',
      description: 'รูปและแท็กที่ผูกอยู่จะหายไปด้วย (cascade) — media asset ยังคงอยู่ใน library',
      confirmLabel: 'ลบ',
      tone: 'destructive',
    });
    if (!ok) return;
    startDeleting(async () => {
      const result = await deletePostAction({ id: defaultValues.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('ลบบทความแล้ว');
      router.push('/admin/posts');
    });
  };

  const toggleTag = (tagId: number) => {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setValue('tagIds', next, { shouldDirty: true });
  };

  const autoSlug = () => {
    setValue('slug', slugify(titleValue) as PostInsert['slug'], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const autoSlugAscii = () => {
    setValue('slug', slugifyAscii(titleValue) as PostInsert['slug'], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handlePickCover = (assetId: number) => {
    const asset = libraryAssets.find((a) => a.id === assetId);
    if (!asset) return;
    setCoverAsset(asset);
    setValue('coverMediaAssetId', asset.id, { shouldDirty: true });
    setCoverPickerOpen(false);
  };

  const clearCover = () => {
    setCoverAsset(null);
    setValue('coverMediaAssetId', null, { shouldDirty: true });
  };

  const isPublished = status === 'published';
  const pendingAny = saving || publishing || deleting;

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
        <header className="mb-4 space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            {mode === 'new' ? 'สร้างบทความใหม่' : 'แก้ไขบทความ'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'new'
              ? 'กรอกเนื้อหา · เลือก cover · เลือก tag → บันทึก'
              : 'แก้ field ที่ต้องการ → บันทึก ระบบ revalidate cache ให้อัตโนมัติ'}
          </p>
        </header>

        {serverError && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </p>
        )}

        <Tabs defaultValue="content" className="gap-6">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="content">
              <FileText aria-hidden /> เนื้อหา
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search aria-hidden /> SEO Preview
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon aria-hidden /> ตั้งค่า
            </TabsTrigger>
          </TabsList>

          {/* ── Content tab ──────────────────────────────────────────── */}
          <TabsContent value="content" className="space-y-6">
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
                  className="text-base font-semibold"
                />
              </Field>

              <Field
                id="slug"
                label="Slug (URL)"
                error={errors.slug?.message}
                required
              >
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
                    aria-label="สร้าง slug จากหัวข้อ (เก็บภาษาไทย)"
                  >
                    Auto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={autoSlugAscii}
                    aria-label="สร้าง slug แบบอักษรละติน (แชร์บน social ได้สวยกว่า)"
                  >
                    EN
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  a-z, 0-9, ไทย, dash · URL = /blog/&lt;slug&gt;
                </p>
              </Field>
            </Section>

            <Section title="รูปหน้าปก (Cover)">
              <CoverPreview
                asset={coverAsset}
                onPick={() => setCoverPickerOpen(true)}
                onClear={clearCover}
              />
            </Section>

            <Section title="สรุปสั้น (excerpt)">
              <Field
                id="excerpt"
                label="ใช้สำหรับ card preview + meta description"
                error={errors.excerpt?.message}
                required
              >
                <Textarea
                  id="excerpt"
                  {...register('excerpt')}
                  maxLength={280}
                  rows={3}
                />
                <Counter value={excerptValue.length} min={80} max={280} />
              </Field>
            </Section>

            <Section title="เนื้อหา">
              <Field
                id="body"
                label="เขียนเนื้อหาแบบ WYSIWYG — หัวข้อ ตัวหนา รายการ ลิงก์ รูป"
                error={errors.body?.message}
                required
              >
                <Controller
                  control={control}
                  name="body"
                  render={({ field }) => (
                    <TiptapEditor
                      id="body"
                      value={field.value}
                      onChange={field.onChange}
                      ariaLabel="เนื้อหาบทความ"
                      libraryAssets={libraryAssets}
                    />
                  )}
                />
                <p className="text-[11px] text-muted-foreground">
                  หัวข้อในเนื้อหาเริ่มที่ H2 — title ของบทความแสดงนอกเนื้อหาแล้ว
                </p>
              </Field>
            </Section>

            <Section
              title="แท็ก"
              description={
                tagOptions.length > 0
                  ? `เลือกได้หลายอัน · ${selectedTagIds.length}/${tagOptions.length}`
                  : undefined
              }
            >
              {tagOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ยังไม่มีแท็กที่กำหนดสำหรับ post — เพิ่มจาก{' '}
                  <a href="/admin/tags" className="underline">
                    /admin/tags
                  </a>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((t) => {
                    const active = selectedTagIds.includes(t.id);
                    return (
                      <Badge
                        key={t.id}
                        variant={active ? 'default' : 'outline'}
                        className="cursor-pointer select-none px-3 py-0.5"
                        render={
                          <button
                            type="button"
                            onClick={() => toggleTag(t.id)}
                            aria-pressed={active}
                          >
                            {t.name}
                          </button>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </Section>

            <Section
              title="หมวดหมู่"
              description="เลือกได้ 1 หมวด (ไม่บังคับ) — ต่างจากแท็กที่เลือกได้หลายอัน"
            >
              {categoryOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ยังไม่มีหมวดหมู่สำหรับ post — เพิ่มจาก{' '}
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
                        aria-label="หมวดหมู่"
                        className="max-w-xs"
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
            </Section>
          </TabsContent>

          {/* ── SEO tab ──────────────────────────────────────────────── */}
          <TabsContent value="seo" className="space-y-4">
            <PostSeoPreview
              title={titleValue}
              slug={slugValue}
              excerpt={excerptValue}
              body={bodyValue}
              coverPath={coverAsset?.path ?? null}
              coverAlt={coverAsset?.alt ?? null}
              status={status}
              tagNames={selectedTagNames}
              authorName={authorName}
            />
          </TabsContent>

          {/* ── Settings tab ─────────────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-6">
            <Section title="สถานะ + วันที่">
              <div className="grid gap-4 md:grid-cols-2">
                <Field id="status" label="สถานะ" error={errors.status?.message}>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) =>
                          field.onChange(v as ContentStatus)
                        }
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

                <Field
                  id="publishedAt"
                  label="วันที่เผยแพร่"
                  error={errors.publishedAt?.message}
                >
                  <Controller
                    control={control}
                    name="publishedAt"
                    render={({ field }) => (
                      <Input
                        id="publishedAt"
                        type="datetime-local"
                        value={toLocalInput(field.value)}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? new Date(e.target.value) : null,
                          )
                        }
                      />
                    )}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    เว้นว่าง = ใช้เวลาที่ publish ครั้งแรก
                  </p>
                </Field>
              </div>
            </Section>

            {mode === 'edit' && (
              <Section title="ข้อมูลระบบ">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <Meta label="ID" value={String(defaultValues?.id ?? '—')} />
                  <Meta label="ผู้เขียน" value={authorName ?? '—'} />
                  <Meta
                    label="สร้างเมื่อ"
                    value={formatDate(defaultValues?.createdAt)}
                  />
                  <Meta
                    label="แก้ไขล่าสุด"
                    value={formatDate(defaultValues?.updatedAt)}
                  />
                  <Meta
                    label="ยอดเข้าชม"
                    value={String(defaultValues?.viewCount ?? 0)}
                  />
                  <Meta
                    label="เวลาอ่าน"
                    value={`${defaultValues?.readingTimeMin ?? 1} นาที`}
                  />
                </dl>
              </Section>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MediaPicker
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        mode="assets"
        assets={libraryAssets}
        pairs={[]}
        selection="single"
        onPick={(result) => {
          if (result.kind === 'assets' && result.ids[0]) {
            handlePickCover(result.ids[0]);
          }
        }}
      />

      {/* Sticky bottom action bar — same chrome as WorkForm */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/posts')}
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
                      ? 'เปลี่ยนสถานะอย่างเดียว — การแก้ form ที่ยังไม่บันทึกจะไม่ถูกบันทึก'
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

// ── Local helpers ────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm" role="region" aria-label={title}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
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

function Counter({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}) {
  const tone =
    value === 0
      ? 'text-destructive'
      : value < min || value > max
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground';
  return (
    <p className={`text-[11px] ${tone}`}>
      {value}/{max} — แนะนำ {min}–{max}
    </p>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </>
  );
}

function CoverPreview({
  asset,
  onPick,
  onClear,
}: {
  asset: PickerAsset | null;
  onPick: () => void;
  onClear: () => void;
}) {
  if (!asset) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="group flex aspect-[16/10] w-full max-w-md flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-bg2/40 px-4 py-6 text-muted-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ImagePlus className="size-8" aria-hidden />
        <span className="text-xs font-medium">เลือกรูปจากคลัง</span>
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative aspect-[16/10] w-full max-w-sm overflow-hidden rounded-xl border border-border bg-bg2">
        <Image
          src={asset.path}
          alt={asset.alt || asset.title || 'cover'}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 384px, 100vw"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          {asset.title || asset.alt || `media #${asset.id}`}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onPick}>
            เปลี่ยนรูป
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden /> ลบ
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Date → `YYYY-MM-DDTHH:mm` (local time) for a `<input type="datetime-local">`.
 * Returns empty string for null/undefined.
 */
function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
