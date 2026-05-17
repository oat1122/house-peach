import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { eq, inArray } from 'drizzle-orm';

import { env } from '@/env';
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
import { FadeUp } from '@/components/motion/FadeUp';
import { ReadingProgress } from '@/components/motion/ReadingProgress';
import { BackToTop } from '@/components/public/blog/BackToTop';
import { WorkBreadcrumb } from '@/components/public/work/WorkBreadcrumb';
import { WorkMetaRow } from '@/components/public/work/WorkMetaRow';
import { WorkHero } from '@/components/public/work/WorkHero';
import { WorkChaptersNav, type ChapterEntry } from '@/components/public/work/WorkChaptersNav';
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
import { WorkFooter } from '@/components/public/work/WorkFooter';
import { WorkRelatedSection } from '@/components/public/work/WorkRelatedSection';
import { RecentWorksCard } from '@/components/public/work/RecentWorksCard';
import { BeforeAfterCard } from '@/components/public/work/BeforeAfterCard';

export const revalidate = 60; // ISR — 60s per `seo.md §8.1 Render mode`

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
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
  const work = await getPublishedWorkBySlug(decodeSlug(slug));
  if (!work) notFound();

  // ── Parallel data fetch ──────────────────────────────────────────────────
  const [images, tagRows, sidebarRelated] = await Promise.all([
    listWorkImages(work.id),
    work.tagIds.length > 0
      ? db
          .select({ id: tagsTable.id, slug: tagsTable.slug, name: tagsTable.name })
          .from(tagsTable)
          .where(inArray(tagsTable.id, work.tagIds))
      : Promise.resolve<{ id: number; slug: string; name: string }[]>([]),
    listSimilarWorks(work.id, work.roomType, work.style, 3),
  ]);

  // Serial: bottomRelated depends on sidebarRelated ids
  const sidebarIds = sidebarRelated.map((w) => w.id);
  const bottomRelated = await listLatestOtherWorks(work.id, sidebarIds, 3);

  // ── Server-side pre-computation ──────────────────────────────────────────
  const firstBodyChar = work.bodyMdx.trim()[0] ?? '';

  const cover = work.coverMediaAssetId
    ? images.find((r) => r.mediaAssetId === work.coverMediaAssetId)
    : null;

  const roomTypeLabel = resolveRoomTypeLabel(work.roomType);
  const tagNames = tagRows.map((t) => t.name);

  // Floor plan: first kind='plan' image by existing sort order
  const floorPlanImage = images.find((i) => i.kind === 'plan')?.asset ?? null;
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
  const chorusCluster = pairClusters[0] ?? null;
  const additionalPairClusters = pairClusters.slice(1);

  // Process / detail images
  const processImages = images.filter((i) => i.kind === 'process');
  const detailImages = images.filter((i) => i.kind === 'detail');
  const detailClusters = buildClusters(detailImages);

  // Build MDX embed closure (BeforeAfter inline component for bodyMdx)
  const pairData = buildPairLookup(images);
  const BeforeAfter = composeBeforeAfterEmbed(pairData);
  const body = await compileWorkMdx(work.bodyMdx, { BeforeAfter });

  // ── Chapter presence map — drives WorkChaptersNav filtering ─────────────
  const hasChorus = chorusCluster != null;
  const hasConcept =
    (work.materials != null && work.materials.length > 0) ||
    floorPlanForSection != null;
  const hasProcess = processImages.length > 0;
  const hasDetail = detailClusters.length > 0;

  const allChapters: (ChapterEntry & { present: boolean })[] = [
    { id: 'chapter-01', number: '01', th: 'โจทย์', en: 'The Brief', present: true },
    { id: 'chapter-02', number: '02', th: 'การเปลี่ยนแปลง', en: 'Before & After', present: hasChorus },
    { id: 'chapter-03', number: '03', th: 'แนวคิดและวัสดุ', en: 'Concept', present: hasConcept },
    { id: 'chapter-04', number: '04', th: 'กระบวนการ', en: 'Process', present: hasProcess },
    { id: 'chapter-05', number: '05', th: 'รายละเอียด', en: 'Details', present: hasDetail },
  ];
  const presentChapters: ChapterEntry[] = allChapters
    .filter((c) => c.present)
    .map(({ id, number, th, en }) => ({ id, number, th, en }));

  // ── SEO structured data ─────────────────────────────────────────────────
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

  // areaSqm from DB comes as decimal string — parse to number
  const areaSqmNum =
    work.areaSqm != null ? parseFloat(String(work.areaSqm)) : null;

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

  // URL for ShareRow — encodeURIComponent on slug for non-ASCII safety
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const workUrl = `${origin}/works/${encodeURIComponent(work.slug)}`;

  // Tag chips shown in the hero meta row (top 2 — full list at footer below)
  const heroTags = tagRows.slice(0, 2).map((t) => ({ name: t.name, slug: t.slug }));

  return (
    <>
      {/* Reading progress bar — fixed top, parity with blog */}
      <ReadingProgress />

      {/* ── HERO BLOCK ─────────────────────────────────────────────────── */}
      <article className="mx-auto max-w-7xl px-4 pt-6 pb-0 md:px-6 md:pt-8">
        <WorkBreadcrumb workTitle={work.title} />

        <FadeUp className="mt-6 max-w-4xl">
          <header>
            {/* Meta row replaces the legacy single-line eyebrow */}
            <WorkMetaRow
              roomTypeLabel={roomTypeLabel}
              style={work.style ?? null}
              yearCompleted={work.yearCompleted ?? null}
              location={work.location ?? null}
              areaSqm={areaSqmNum}
              durationDays={work.durationDays ?? null}
              tags={heroTags}
            />

            <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-ink mt-5">
              {work.title}
            </h1>

            {work.summary && (
              <p className="mt-3 max-w-prose text-base md:text-lg text-muted-brand leading-[1.65]">
                {work.summary}
              </p>
            )}
          </header>
        </FadeUp>

        {/*
         * Hero cover image — full-bleed cinematic 16:9 → 21:9, rounded-none.
         * Kept as work's portfolio identity (not the blog's contained 16:9
         * rounded card). LCP element — no FadeUp wrapper per motion.md.
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

        <WorkStatBand
          areaSqm={areaSqmNum}
          durationDays={work.durationDays ?? null}
          budgetRange={work.budgetRange ?? null}
          yearCompleted={work.yearCompleted ?? null}
        />
      </article>

      {/* ── BODY GRID (article + sidebar) ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 pb-24">
        {/* Mobile: chapter nav inline above article */}
        {presentChapters.length > 1 && (
          <div className="lg:hidden mb-8">
            <WorkChaptersNav chapters={presentChapters} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-16 items-start">
          {/* Main column — chapters live here */}
          <div className="min-w-0">
            {/* ── Ch 01 · The Brief ──────────────────────────────────── */}
            <div>
              <FadeUp>
                <WorkChapterDivider number="01" th="โจทย์" en="The Brief" />
              </FadeUp>
              <FadeUp className="mt-6">
                <WorkChapterBody firstChar={firstBodyChar}>{body}</WorkChapterBody>
              </FadeUp>
            </div>

            {/* ── Ch 02 · Before & After ─────────────────────────────── */}
            {chorusPair && (
              <div className="mt-24">
                <FadeUp>
                  <WorkChapterDivider
                    number="02"
                    th="การเปลี่ยนแปลง"
                    en="Before & After"
                  />
                </FadeUp>

                <div className="mt-6">
                  <WorkChorusBeforeAfter pair={chorusPair} />
                </div>

                {additionalPairClusters.length > 0 && (
                  <div className="mt-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {additionalPairClusters.map((c) => {
                      if (c.kind !== 'pair') return null;
                      const before = toBAImage(
                        c.before,
                        `ก่อนแต่ง — ${work.title}`,
                      );
                      const after = toBAImage(
                        c.after,
                        `หลังแต่ง — ${work.title}`,
                      );
                      const caption =
                        c.after.caption ?? c.before.caption ?? null;
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

                <WorkPullQuote
                  quote={work.clientQuote ?? null}
                  clientName={work.clientName ?? null}
                />
              </div>
            )}

            {/* ── Ch 03 · Concept ─────────────────────────────────────── */}
            {hasConcept && (
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
                  workTitle={work.title}
                />
              </div>
            )}

            {/* ── Ch 04 · Process ─────────────────────────────────────── */}
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

            {/* ── Ch 05 · Details ────────────────────────────────────── */}
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

            {/* ── Designer's note ─────────────────────────────────────── */}
            <WorkDesignerNote note={work.designerNote ?? null} />

            {/* ── Footer (share + back link) ─────────────────────────── */}
            <WorkFooter url={workUrl} title={work.title} />

            {/* Tags row — full list at page end */}
            {tagNames.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-2 px-0" aria-label="แท็ก">
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

            {/* Mobile: sidebar items reflow below footer */}
            <div className="lg:hidden mt-8 space-y-4">
              <WorkCTACard style={work.style ?? null} />
              <RecentWorksCard works={sidebarRelated} />
            </div>
          </div>

          {/* Sidebar — desktop only, sticky */}
          <aside
            className="hidden lg:flex flex-col gap-4 sticky top-[6.5rem] max-h-[calc(100vh-7rem)] min-h-0"
            aria-label="แถบข้างผลงาน"
          >
            {presentChapters.length > 1 && (
              <WorkChaptersNav chapters={presentChapters} />
            )}
            <FadeUp>
              <WorkCTACard style={work.style ?? null} />
            </FadeUp>
            {sidebarRelated.length > 0 && (
              <FadeUp delay={0.05}>
                <RecentWorksCard works={sidebarRelated} />
              </FadeUp>
            )}
          </aside>
        </div>
      </div>

      {/* ── Related works strip (bg-bg2 alt section, parity with blog) ── */}
      <WorkRelatedSection works={bottomRelated} />

      {/* Back-to-top FAB */}
      <BackToTop />

      {/* JSON-LD structured data — unchanged from v1 (SEO-locked) */}
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
