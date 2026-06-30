import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { eq } from 'drizzle-orm';

import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireRole } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { workTags } from '@/lib/db/schema/works';
import { getCategoryById } from '@/lib/services/category';
import { getWorkById } from '@/lib/services/work';
import { listWorkImages } from '@/lib/services/workImage';
import { renderTiptap } from '@/lib/tiptap/render';
import type { WorkImageListItem } from '@/lib/services/workImage';

export const dynamic = 'force-dynamic';

const ROOM_TYPE_LABELS: Record<string, string> = {
  living: 'ห้องนั่งเล่น',
  bedroom: 'ห้องนอน',
  kitchen: 'ห้องครัว',
  bathroom: 'ห้องน้ำ',
  office: 'ห้องทำงาน',
  outdoor: 'พื้นที่ภายนอก',
  full_house: 'บ้านทั้งหลัง',
  other: 'อื่นๆ',
};

const BUDGET_LABELS: Record<string, string> = {
  under_100k: 'ต่ำกว่า 100,000 บาท',
  '100k_300k': '100,000–300,000 บาท',
  '300k_700k': '300,000–700,000 บาท',
  '700k_1.5m': '700,000–1,500,000 บาท',
  '1.5m_plus': 'มากกว่า 1,500,000 บาท',
};

/** Group gallery items into before/after pairs by their shared pairId. */
function extractPairs(
  gallery: WorkImageListItem[],
): { before: WorkImageListItem; after: WorkImageListItem }[] {
  const pairMap = new Map<
    number,
    { before?: WorkImageListItem; after?: WorkImageListItem }
  >();
  for (const img of gallery) {
    if (img.pairId == null) continue;
    const entry = pairMap.get(img.pairId) ?? {};
    if (img.kind === 'before') entry.before = img;
    else if (img.kind === 'after') entry.after = img;
    pairMap.set(img.pairId, entry);
  }
  const pairs: { before: WorkImageListItem; after: WorkImageListItem }[] = [];
  for (const { before, after } of pairMap.values()) {
    if (before && after) pairs.push({ before, after });
  }
  return pairs;
}

export default async function WorkDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireRole();
  const { id } = await props.params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

  const [work, galleryRows] = await Promise.all([
    getWorkById(numId),
    listWorkImages(numId),
  ]);
  if (!work) notFound();

  const [tagRows, category] = await Promise.all([
    db
      .select({ name: tagsTable.name })
      .from(workTags)
      .innerJoin(tagsTable, eq(tagsTable.id, workTags.tagId))
      .where(eq(workTags.workId, work.id)),
    work.categoryId ? getCategoryById(work.categoryId) : Promise.resolve(null),
  ]);

  const tagNames = tagRows.map((r) => r.name);
  const coverImage = galleryRows.find((r) => r.isCover) ?? galleryRows[0] ?? null;
  const thumbnails = galleryRows.filter((r) => !r.isCover).slice(0, 8);
  const pairs = extractPairs(galleryRows);
  const body = renderTiptap(work.body);
  const fmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
      {/* Back link */}
      <Link
        href="/admin/works"
        className="inline-flex items-center gap-1.5 text-sm text-muted-brand transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden />
        กลับไปที่ผลงาน
      </Link>

      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl leading-tight text-ink md:text-3xl">
              {work.title}
            </h1>
            <StatusBadge status={work.status} />
          </div>
          <p className="truncate font-mono text-xs text-muted-brand">{work.slug}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {work.status === 'published' && (
            <Link
              href={`/works/${work.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:bg-bg2"
            >
              ดูหน้าเว็บ
            </Link>
          )}
          <Link
            href={`/admin/works/${work.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm text-bg transition-opacity hover:opacity-90"
          >
            <PencilLine size={14} aria-hidden />
            แก้ไข
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-5">
          {/* Cover image */}
          {coverImage && (
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-line">
              <Image
                src={coverImage.asset.path}
                alt={
                  coverImage.asset.alt ||
                  `${work.title} — ${ROOM_TYPE_LABELS[work.roomType] ?? work.roomType}`
                }
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Thumbnail strip */}
          {thumbnails.length > 0 && (
            <div className="grid grid-cols-4 gap-2.5">
              {thumbnails.map((img) => (
                <div
                  key={img.mediaAssetId}
                  className="relative aspect-square overflow-hidden rounded-md border border-line"
                >
                  <Image
                    src={img.asset.path}
                    alt={img.asset.alt || `${work.title} — ${img.kind}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}

          {/* Before/after panels */}
          {pairs.map(({ before, after }, idx) => (
            <div
              key={idx}
              className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={before.asset.path}
                  alt={before.asset.alt || `${work.title} — ก่อน`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute left-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] text-bg">
                  ก่อน
                </span>
              </div>
              <div className="relative aspect-[4/3] border-l border-line">
                <Image
                  src={after.asset.path}
                  alt={after.asset.alt || `${work.title} — หลัง`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute right-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] text-bg">
                  หลัง
                </span>
              </div>
            </div>
          ))}

          {/* Body */}
          <section className="rounded-2xl border border-line bg-brand-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-brand">เนื้อหา</h2>
            <div className="prose-post max-w-none">{body}</div>
          </section>

          {/* Materials */}
          {work.materials && work.materials.length > 0 && (
            <section className="rounded-2xl border border-line bg-brand-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-muted-brand">วัสดุ & โทนสี</h2>
              <ul className="flex flex-wrap gap-3">
                {work.materials.map((m, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span
                      className="size-4 shrink-0 rounded-full border border-line"
                      style={{ backgroundColor: m.colorHex }}
                      aria-label={m.colorHex}
                    />
                    <span className="text-sm text-ink">{m.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Side column */}
        <aside className="sticky top-4">
          <section className="rounded-2xl border border-line bg-brand-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-brand">รายละเอียด</h2>
            <dl className="space-y-2.5 text-sm">
              {category && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">หมวดหมู่</dt>
                  <dd>
                    <span className="rounded-full bg-bg2 px-2.5 py-0.5 text-xs text-ink">
                      {category.name}
                    </span>
                  </dd>
                </div>
              )}
              {tagNames.length > 0 && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">แท็ก</dt>
                  <dd className="flex flex-wrap justify-end gap-1">
                    {tagNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-bg2 px-2.5 py-0.5 text-xs text-ink"
                      >
                        {name}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <dt className="shrink-0 text-muted-brand">ประเภทห้อง</dt>
                <dd className="text-right text-ink">
                  {ROOM_TYPE_LABELS[work.roomType] ?? work.roomType}
                </dd>
              </div>
              {work.style && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">สไตล์</dt>
                  <dd className="text-right text-ink">{work.style}</dd>
                </div>
              )}
              {work.yearCompleted && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">ปีที่เสร็จ</dt>
                  <dd className="text-ink">{work.yearCompleted}</dd>
                </div>
              )}
              {work.areaSqm != null && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">พื้นที่</dt>
                  <dd className="text-ink">{Number(work.areaSqm)} ตร.ม.</dd>
                </div>
              )}
              {work.location && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">ทำเล</dt>
                  <dd className="text-right text-ink">{work.location}</dd>
                </div>
              )}
              {work.budgetRange && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">งบประมาณ</dt>
                  <dd className="text-right text-ink">
                    {BUDGET_LABELS[work.budgetRange] ?? work.budgetRange}
                  </dd>
                </div>
              )}
              {work.publishedAt && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-brand">เผยแพร่เมื่อ</dt>
                  <dd className="text-ink">{fmt.format(work.publishedAt)}</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
