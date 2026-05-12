import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { mediaAssets } from '@/lib/db/schema/mediaAssets';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { getPublishedWorkBySlug } from '@/lib/services/work';
import { listWorkImages } from '@/lib/services/workImage';
import { compileWorkMdx } from '@/lib/mdx/compile';
import { buildCreativeWorkLd, buildWorkBreadcrumbLd } from '@/lib/seo/jsonld';
import { buildWorkMetadata } from '@/lib/seo/metadata';
import { WorkGallery } from '@/components/public/work/WorkGallery';
import {
  composeBeforeAfterEmbed,
  type EmbedPairData,
} from '@/components/public/work/BeforeAfterEmbed';
import type { BeforeAfterImage } from '@/components/public/work/BeforeAfterSlider';

export const revalidate = 60; // ISR — 60s per `seo.md §8.1 Render mode`

const ROOM_TYPE_LABELS_TH: Record<string, string> = {
  living: 'ห้องนั่งเล่น',
  bedroom: 'ห้องนอน',
  kitchen: 'ห้องครัว',
  bathroom: 'ห้องน้ำ',
  office: 'ห้องทำงาน',
  outdoor: 'พื้นที่ภายนอก',
  full_house: 'ทั้งบ้าน',
  other: 'อื่น ๆ',
};

const BUDGET_LABELS_TH: Record<string, string> = {
  under_100k: 'ต่ำกว่า 100,000',
  '100k_300k': '100,000 – 300,000',
  '300k_700k': '300,000 – 700,000',
  '700k_1.5m': '700,000 – 1.5M',
  '1.5m_plus': '1.5M ขึ้นไป',
};

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const work = await getPublishedWorkBySlug(slug);
  if (!work) {
    return { title: 'ไม่พบผลงาน — house-peach', robots: { index: false } };
  }
  const cover = work.coverMediaAssetId
    ? await fetchAssetPath(work.coverMediaAssetId)
    : null;
  return buildWorkMetadata({ work, coverPath: cover });
}

async function fetchAssetPath(id: number): Promise<string | null> {
  const [row] = await db
    .select({ path: mediaAssets.path })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  return row?.path ?? null;
}

export default async function WorkDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const work = await getPublishedWorkBySlug(slug);
  if (!work) notFound();

  const [images, tagNames] = await Promise.all([
    listWorkImages(work.id),
    work.tagIds.length > 0
      ? db
          .select({ name: tagsTable.name })
          .from(tagsTable)
          .where(inArray(tagsTable.id, work.tagIds))
          .then((rows) => rows.map((r) => r.name))
      : Promise.resolve<string[]>([]),
  ]);

  const cover = work.coverMediaAssetId
    ? images.find((r) => r.mediaAssetId === work.coverMediaAssetId)
    : null;

  // Build per-work pair lookup → MDX embed component closure.
  const pairData = buildPairLookup(images);
  const BeforeAfter = composeBeforeAfterEmbed(pairData);

  const body = await compileWorkMdx(work.bodyMdx, { BeforeAfter });

  const galleryPaths = images
    .filter((r) => r.mediaAssetId !== work.coverMediaAssetId)
    .map((r) => r.asset.path);

  const creativeWorkLd = buildCreativeWorkLd({
    work,
    coverPath: cover?.asset.path ?? null,
    galleryPaths,
    tagNames,
  });
  const breadcrumbLd = buildWorkBreadcrumbLd(work);

  return (
    <>
      <article className="mx-auto max-w-4xl px-4 pt-8 pb-12 lg:px-6">
        <nav aria-label="breadcrumb" className="text-xs text-muted-brand">
          <Link href="/" className="hover:text-ink">
            หน้าแรก
          </Link>{' '}
          /{' '}
          <Link href="/works" className="hover:text-ink">
            ผลงาน
          </Link>{' '}
          / <span className="text-ink">{work.title}</span>
        </nav>

        <header className="mt-4 space-y-3">
          <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">
            {work.title}
          </h1>
          <p className="max-w-prose text-base text-muted-brand md:text-lg">
            {work.summary}
          </p>

          <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-muted-brand">
            <Meta label="ประเภท" value={ROOM_TYPE_LABELS_TH[work.roomType]} />
            {work.style && <Meta label="สไตล์" value={work.style} />}
            {work.yearCompleted && (
              <Meta label="ปีที่เสร็จ" value={String(work.yearCompleted)} />
            )}
            {work.location && <Meta label="สถานที่" value={work.location} />}
            {work.areaSqm != null && (
              <Meta label="พื้นที่" value={`${work.areaSqm} ตร.ม.`} />
            )}
            {work.budgetRange && (
              <Meta
                label="งบประมาณ"
                value={BUDGET_LABELS_TH[work.budgetRange] ?? work.budgetRange}
              />
            )}
          </dl>
        </header>

        {cover && (
          <div
            className="relative mt-8 overflow-hidden rounded-2xl bg-bg2"
            style={{
              aspectRatio: `${cover.asset.width || 2000} / ${cover.asset.height || 1000}`,
            }}
          >
            <Image
              src={cover.asset.path}
              alt={cover.asset.alt || work.title}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        )}

        <div className="prose prose-stone mt-10 max-w-prose dark:prose-invert">
          {body}
        </div>

        {tagNames.length > 0 && (
          <ul className="mt-10 flex flex-wrap gap-2">
            {tagNames.map((name) => (
              <li
                key={name}
                className="rounded-full bg-bg2 px-3 py-1 text-xs text-ink"
              >
                #{name}
              </li>
            ))}
          </ul>
        )}
      </article>

      <WorkGallery images={images} coverAssetId={work.coverMediaAssetId} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <dt className="text-muted-brand/80">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </span>
  );
}

function buildPairLookup(
  images: Awaited<ReturnType<typeof listWorkImages>>,
): Map<number, EmbedPairData> {
  const map = new Map<number, EmbedPairData>();
  const rowsByPair = new Map<number, typeof images>();
  for (const row of images) {
    if (row.pairId == null) continue;
    const list = rowsByPair.get(row.pairId) ?? [];
    list.push(row);
    rowsByPair.set(row.pairId, list);
  }
  for (const [pairId, rows] of rowsByPair) {
    if (rows.length !== 2) continue;
    const before = rows.find((r) => r.kind === 'before');
    const after = rows.find((r) => r.kind === 'after');
    if (!before || !after) continue;
    map.set(pairId, {
      id: pairId,
      before: toBA(before),
      after: toBA(after),
      caption: after.caption ?? before.caption ?? null,
    });
  }
  return map;
}

function toBA(row: {
  asset: { path: string; alt: string; title: string; width: number; height: number };
}): BeforeAfterImage {
  return {
    src: row.asset.path,
    alt: row.asset.alt || row.asset.title || '',
    width: row.asset.width || 1600,
    height: row.asset.height || 1000,
  };
}
