import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { mediaAssets } from '@/lib/db/schema/mediaAssets';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import {
  getPublishedWorkBySlug,
  listSimilarWorks,
  listLatestOtherWorks,
} from '@/lib/services/work';
import { listWorkImages } from '@/lib/services/workImage';
import { compileWorkMdx } from '@/lib/mdx/compile';
import { buildCreativeWorkLd, buildWorkBreadcrumbLd } from '@/lib/seo/jsonld';
import { buildWorkMetadata } from '@/lib/seo/metadata';
import { resolveRoomTypeLabel } from '@/lib/utils/workLabels';
import { estimateWordCount } from '@/lib/utils/wordCount';
import { FadeUp } from '@/components/motion/FadeUp';
import { WorkHero } from '@/components/public/work/WorkHero';
import { WorkGallerySection } from '@/components/public/work/WorkGallerySection';
import { buildClusters } from '@/components/public/work/WorkGallery';
import {
  composeBeforeAfterEmbed,
  type EmbedPairData,
} from '@/components/public/work/BeforeAfterEmbed';
import type { BeforeAfterImage } from '@/components/public/work/BeforeAfterSlider';
import { WorkStatBand } from '@/components/public/work/WorkStatBand';
import { WorkChapterDivider } from '@/components/public/work/WorkChapterDivider';
import { WorkChapterBody } from '@/components/public/work/WorkChapterBody';
import { WorkChorusBeforeAfter } from '@/components/public/work/WorkChorusBeforeAfter';
import { WorkPullQuote } from '@/components/public/work/WorkPullQuote';
import { WorkConceptSection } from '@/components/public/work/WorkConceptSection';
import { WorkProcessTimeline } from '@/components/public/work/WorkProcessTimeline';
import { WorkDesignerNote } from '@/components/public/work/WorkDesignerNote';
import { WorkCTACard } from '@/components/public/work/WorkCTACard';
import { WorkRelatedSection } from '@/components/public/work/WorkRelatedSection';
import { BeforeAfterCard } from '@/components/public/work/BeforeAfterCard';

export const revalidate = 60; // ISR — 60s per `seo.md §8.1 Render mode`

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  // Next 16 hands `params.slug` URL-encoded on some code paths
  // (e.g., generateMetadata vs. page render) for non-ASCII slugs — confirmed
  // empirically: page got "บ้าน-03" but metadata got "%E0%B8%9A...".
  // Decode unconditionally, then NFC-normalize so the byte sequence matches
  // what slugify() now writes to DB.
  const work = await getPublishedWorkBySlug(decodeSlug(slug));
  if (!work) {
    return { title: 'ไม่พบผลงาน', robots: { index: false } };
  }
  const cover = work.coverMediaAssetId
    ? await fetchAssetPath(work.coverMediaAssetId)
    : null;
  return buildWorkMetadata({ work, coverPath: cover });
}

/**
 * Decode + NFC-normalize an incoming dynamic-route slug. Idempotent on
 * already-decoded input (decodeURIComponent on a string with no `%` escapes
 * returns it unchanged), and our Slug regex disallows literal `%` so there's
 * no ambiguity. Catches malformed escapes by returning the raw slug —
 * downstream lookup will simply miss and the page renders not-found.
 */
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw).normalize('NFC');
  } catch {
    return raw.normalize('NFC');
  }
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
  // See generateMetadata comment above for why we decode here too.
  const work = await getPublishedWorkBySlug(decodeSlug(slug));
  if (!work) notFound();

  // ── Parallel data fetch (spec §14c) ───────────────────────────────────────
  const [images, tagNames, sidebarRelated] = await Promise.all([
    listWorkImages(work.id),
    work.tagIds.length > 0
      ? db
          .select({ name: tagsTable.name })
          .from(tagsTable)
          .where(inArray(tagsTable.id, work.tagIds))
          .then((rows) => rows.map((r) => r.name))
      : Promise.resolve<string[]>([]),
    listSimilarWorks(work.id, work.roomType, work.style, 3),
  ]);

  // Serial: bottomRelated depends on sidebarRelated ids (spec §14c)
  const sidebarIds = sidebarRelated.map((w) => w.id);
  const bottomRelated = await listLatestOtherWorks(work.id, sidebarIds, 3);

  // ── Server-side pre-computation ───────────────────────────────────────────
  const wordCount = estimateWordCount(work.bodyMdx);
  const firstBodyChar = work.bodyMdx.trim()[0] ?? '';

  const cover = work.coverMediaAssetId
    ? images.find((r) => r.mediaAssetId === work.coverMediaAssetId)
    : null;

  const roomTypeLabel = resolveRoomTypeLabel(work.roomType);

  // Floor plan: first kind='plan' image by existing sort order
  const floorPlanImage =
    images.find((i) => i.kind === 'plan')?.asset ?? null;
  const floorPlanForSection = floorPlanImage
    ? {
        path: floorPlanImage.path,
        alt: floorPlanImage.alt || floorPlanImage.title || '',
        width: floorPlanImage.width || 1200,
        height: floorPlanImage.height || 900,
      }
    : null;

  // Before/after pairs — build clusters from paired images
  const beforeAfterImages = images.filter(
    (i) => i.kind === 'before' || i.kind === 'after',
  );
  const beforeAfterClusters = buildClusters(beforeAfterImages);
  const pairClusters = beforeAfterClusters.filter((c) => c.kind === 'pair');

  // Chorus = first pair; additional pairs shown below chorus
  const chorusCluster = pairClusters[0] ?? null;
  const additionalPairClusters = pairClusters.slice(1);

  // Process images (sorted by sort column — already ordered by listWorkImages)
  const processImages = images.filter((i) => i.kind === 'process');

  // Detail images
  const detailImages = images.filter((i) => i.kind === 'detail');
  const detailClusters = buildClusters(detailImages);

  // Build MDX embed closure (BeforeAfter inline component for bodyMdx)
  const pairData = buildPairLookup(images);
  const BeforeAfter = composeBeforeAfterEmbed(pairData);
  const body = await compileWorkMdx(work.bodyMdx, { BeforeAfter });

  // SEO structured data (unchanged from v1)
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

  // areaSqm from DB comes as decimal string — parse to number for stat band
  const areaSqmNum = work.areaSqm != null ? parseFloat(String(work.areaSqm)) : null;

  // Chorus BeforeAfterImage pairs for WorkChorusBeforeAfter
  const chorusPair =
    chorusCluster && chorusCluster.kind === 'pair'
      ? {
          before: toBAImage(
            chorusCluster.before,
            `ก่อนแต่ง — ${work.title}`,
          ),
          after: toBAImage(chorusCluster.after, `หลังแต่ง — ${work.title}`),
          caption:
            chorusCluster.after.caption ?? chorusCluster.before.caption ?? null,
        }
      : null;

  return (
    <>
      {/*
       * Page outer wrapper — max-w-7xl so full-bleed gallery sections can fill
       * wide screens. The `px-4 md:px-6` gutter is cancelled by `-mx-4/-mx-6`
       * on sections that need full-bleed.
       */}
      <article className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:px-6 md:pt-8">

        {/* ── S1: Breadcrumb ─────────────────────────────────────────────────── */}
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

        {/*
         * ── S2 + S3 + S4: Eyebrow + H1 + Summary (one FadeUp unit) ───────────
         * H1 bumped to text-5xl md:text-7xl per spec §S3 + §2 Pillar 1.
         * Eyebrow omits null fields; roomType is always present.
         */}
        <FadeUp className="mt-6 max-w-4xl">
          <header>
            {/* S2: Eyebrow */}
            <p className="text-[11px] uppercase tracking-widest font-sans text-muted-brand">
              {roomTypeLabel}
              {work.style ? ` · ${work.style}` : ''}
              {work.yearCompleted ? ` · ${work.yearCompleted}` : ''}
            </p>

            {/* S3: H1 */}
            <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-ink mt-3">
              {work.title}
            </h1>

            {/* S4: Summary */}
            {work.summary && (
              <p className="mt-3 max-w-prose text-base md:text-lg text-muted-brand leading-[1.65]">
                {work.summary}
              </p>
            )}
          </header>
        </FadeUp>

        {/*
         * ── S5: Hero image ────────────────────────────────────────────────────
         * v2.2: aspect-[16/9] mobile → aspect-[21/9] desktop (cinematic).
         * rounded-none: full-bleed, no border radius (spec §S5, §21 #5).
         * -mx-4/-mx-6 breaks out of the page gutter.
         * No animation wrapper — LCP element (spec §19 + motion.md).
         */}
        {cover && (
          <div className="mt-8 -mx-4 md:-mx-6">
            <WorkHero
              src={cover.asset.path}
              alt={
                cover.asset.alt ||
                `${work.title} — ${roomTypeLabel}${work.style ? `, สไตล์ ${work.style}` : ''}`
              }
              aspectClass="aspect-[16/9] md:aspect-[21/9] md:mt-0"
              className="rounded-none mt-0"
            />
          </div>
        )}

        {/* ── S6: Stat band ─────────────────────────────────────────────────── */}
        <WorkStatBand
          areaSqm={areaSqmNum}
          durationDays={work.durationDays ?? null}
          budgetRange={work.budgetRange ?? null}
          yearCompleted={work.yearCompleted ?? null}
        />

        {/*
         * ── Chapter 01: โจทย์ / The Brief ───────────────────────────────────
         * mt-24 between chapters per spec §2 Pillar 3 (applied at chapter
         * container level, not inside WorkChapterDivider itself).
         */}
        <div className="mt-24">
          <FadeUp>
            <WorkChapterDivider number="01" th="โจทย์" en="The Brief" />
          </FadeUp>

          <FadeUp className="mt-6">
            <WorkChapterBody firstChar={firstBodyChar}>
              {body}
            </WorkChapterBody>
          </FadeUp>
        </div>

        {/*
         * ── Chapter 02: การเปลี่ยนแปลง / Before & After ─────────────────────
         * Entire chapter (divider + chorus + additional pairs + pull quote)
         * is skipped when there are no before/after pairs (spec §22).
         * Chapter number stays "02" even when skipped — stable numbering §25.
         */}
        {chorusPair && (
          <div className="mt-24">
            <FadeUp>
              <WorkChapterDivider
                number="02"
                th="การเปลี่ยนแปลง"
                en="Before & After"
              />
            </FadeUp>

            {/* Chorus — first pair, full-bleed, no rounding */}
            <div className="mt-6">
              <WorkChorusBeforeAfter pair={chorusPair} />
            </div>

            {/* Additional pairs — smaller, side-by-side on desktop */}
            {additionalPairClusters.length > 0 && (
              <div className="mt-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {additionalPairClusters.map((c) => {
                  if (c.kind !== 'pair') return null;
                  const before = toBAImage(c.before, `ก่อนแต่ง — ${work.title}`);
                  const after = toBAImage(c.after, `หลังแต่ง — ${work.title}`);
                  const caption = c.after.caption ?? c.before.caption ?? null;
                  return (
                    <FadeUp key={`addl-${c.pairId}`}>
                      <BeforeAfterCard
                        before={before}
                        after={after}
                        caption={caption}
                        className="rounded-2xl"
                      />
                    </FadeUp>
                  );
                })}
              </div>
            )}

            {/* Pull quote — skips when clientQuote is null */}
            <WorkPullQuote
              quote={work.clientQuote ?? null}
              clientName={work.clientName ?? null}
            />
          </div>
        )}

        {/*
         * ── Chapter 03: แนวคิดและวัสดุ / Concept ─────────────────────────────
         * Chapter number stays "03" regardless of whether chapter 02 rendered.
         * Left column is EMPTY on desktop — bodyMdx rendered once in ch01.
         * WorkConceptSection returns null when there is nothing to show.
         */}
        <div className="mt-24">
          <FadeUp>
            <WorkChapterDivider
              number="03"
              th="แนวคิดและวัสดุ"
              en="Concept"
            />
          </FadeUp>

          <WorkConceptSection
            palette={work.materials ?? null}
            floorPlanImage={floorPlanForSection}
            sidebarRelated={sidebarRelated}
            wordCount={wordCount}
            workTitle={work.title}
          />
        </div>

        {/*
         * ── Chapter 04: กระบวนการ / Process ─────────────────────────────────
         * Entire chapter skipped when processImages is empty (spec §S15 null fallback).
         */}
        {processImages.length > 0 && (
          <div className="mt-24">
            <FadeUp>
              <WorkChapterDivider
                number="04"
                th="กระบวนการ"
                en="Process"
              />
            </FadeUp>

            <div className="mt-8 max-w-5xl mx-auto">
              <WorkProcessTimeline
                images={processImages}
                workTitle={work.title}
              />
            </div>
          </div>
        )}

        {/*
         * ── Chapter 05: รายละเอียด / Details ────────────────────────────────
         * Entire chapter skipped when detailClusters is empty.
         * Uses existing WorkGallerySection (no modification to that component).
         */}
        {detailClusters.length > 0 && (
          <div className="mt-24">
            <FadeUp>
              <WorkChapterDivider
                number="05"
                th="รายละเอียด"
                en="Details"
              />
            </FadeUp>

            <div className="-mx-4 md:-mx-6 mt-8">
              <WorkGallerySection
                label={{ th: 'รายละเอียด', en: 'Details' }}
                clusters={detailClusters}
                displayMode="detail-editorial"
                workTitle={work.title}
              />
            </div>
          </div>
        )}

        {/* ── S18: Designer's note ─────────────────────────────────────────── */}
        <WorkDesignerNote note={work.designerNote ?? null} />

        {/* ── S19: CTA card ────────────────────────────────────────────────── */}
        <WorkCTACard style={work.style ?? null} />

        {/* ── S20: Related works (bottom discovery grid) ─────────────────── */}
        <WorkRelatedSection works={bottomRelated} />

        {/*
         * ── S21: Tags row ─────────────────────────────────────────────────────
         * v2: shown at page bottom for both mobile and desktop
         * (v1 had md:hidden — removed per spec §S21).
         */}
        {tagNames.length > 0 && (
          <ul
            className="mt-10 flex flex-wrap gap-2 px-0"
            aria-label="แท็ก"
          >
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

      {/* JSON-LD structured data — unchanged from v1 (SEO-audited and locked) */}
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

// ── Helpers (unchanged from v1) ───────────────────────────────────────────────

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

function toBAImage(
  row: {
    asset: { path: string; alt: string; title: string; width: number; height: number };
  },
  fallbackAlt: string,
): BeforeAfterImage {
  return {
    src: row.asset.path,
    alt: row.asset.alt || row.asset.title || fallbackAlt,
    width: row.asset.width || 1600,
    height: row.asset.height || 1000,
  };
}
