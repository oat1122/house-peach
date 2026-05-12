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
import { resolveRoomTypeLabel, resolveBudgetLabel } from '@/lib/utils/workLabels';
import { WorkHero } from '@/components/public/work/WorkHero';
import { WorkMetaSidebar } from '@/components/public/work/WorkMetaSidebar';
import { WorkProseSection } from '@/components/public/work/WorkProseSection';
import { WorkGallerySection } from '@/components/public/work/WorkGallerySection';
import { buildClusters } from '@/components/public/work/WorkGallery';
import {
  composeBeforeAfterEmbed,
  type EmbedPairData,
} from '@/components/public/work/BeforeAfterEmbed';
import type { BeforeAfterImage } from '@/components/public/work/BeforeAfterSlider';
import { FadeUp } from '@/components/motion/FadeUp';

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

  // Resolve human-readable labels (extracted from local constants to util).
  const roomTypeLabel = resolveRoomTypeLabel(work.roomType);
  const budgetLabel = resolveBudgetLabel(work.budgetRange ?? null);

  // Build gallery clusters per kind (cover excluded from gallery).
  const galleryItems = images.filter(
    (r) => r.mediaAssetId !== work.coverMediaAssetId,
  );
  const beforeAfterClusters = buildClusters(
    galleryItems.filter((r) => r.kind === 'before' || r.kind === 'after'),
  );
  const processClusters = buildClusters(
    galleryItems.filter((r) => r.kind === 'process'),
  );
  const detailClusters = buildClusters(
    galleryItems.filter((r) => r.kind === 'detail'),
  );

  // Sidebar renders null when all meta fields are absent. In that case skip
  // the two-column grid class so the prose zone gets the full available width.
  const hasSidebarContent =
    !!work.style ||
    !!work.yearCompleted ||
    !!work.location ||
    work.areaSqm != null ||
    !!work.budgetRange ||
    tagNames.length > 0;

  // Shared sidebar props — reused for mobile strip + desktop panel.
  const sidebarProps = {
    roomTypeLabel,
    style: work.style ?? null,
    yearCompleted: work.yearCompleted ?? null,
    location: work.location ?? null,
    areaSqm: work.areaSqm ?? null,
    budgetLabel,
    tagNames,
  };

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
      {/*
       * Page outer wrapper — max-w-7xl so full-bleed gallery sections can fill
       * wide screens. The `px-4 md:px-6` gutter is cancelled by `-mx-4/-mx-6`
       * on sections that need full-bleed.
       */}
      <article className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:px-6 md:pt-8">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
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
         * ── H1 + Summary block ──────────────────────────────────────────────
         * FadeUp wraps both elements as a single animated unit.
         * max-w-3xl constrains the heading width so long titles don't spread
         * to the full 7xl container on widescreen.
         */}
        <FadeUp className="mt-4 max-w-3xl">
          <header>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-ink leading-tight md:text-5xl">
              {work.title}
            </h1>
            {work.summary && (
              <p className="mt-3 max-w-prose text-base text-muted-brand md:text-lg">
                {work.summary}
              </p>
            )}
          </header>
        </FadeUp>

        {/*
         * ── Mobile meta strip ─────────────────────────────────────────────────
         * Spec § Mobile mockup: strip appears after summary, before hero.
         * Hidden on desktop (the sidebar is in the prose two-column zone below).
         * -mx-4 extends the strip to the screen edge on mobile.
         */}
        {hasSidebarContent && (
          <div className="mt-4 -mx-4 md:hidden">
            <WorkMetaSidebar {...sidebarProps} slot="mobile" />
          </div>
        )}

        {/*
         * ── Hero image ────────────────────────────────────────────────────────
         * LCP element — no animation wrapper per spec § Motion plan.
         * -mx-4/-mx-6 breaks out of the page gutter to full max-w-7xl width.
         * aspect-[3/2] mobile → aspect-[2/1] desktop (controlled inside WorkHero).
         */}
        {cover && (
          <div className="-mx-4 md:-mx-6">
            <WorkHero
              src={cover.asset.path}
              alt={
                // Hero is the LCP image and the strongest Google Image
                // Search signal on the page. When admin leaves asset.alt
                // blank, build a descriptive fallback from the work's own
                // room + style data (per .claude/rules/seo.md § Image SEO).
                cover.asset.alt ||
                `${work.title} — ${roomTypeLabel}${
                  work.style ? `, สไตล์ ${work.style}` : ''
                }`
              }
            />
          </div>
        )}

        {/*
         * ── Before & After section ─────────────────────────────────────────
         * Spec § Desktop mockup: before/after appears immediately after hero,
         * before the MDX prose body. Returns null when empty.
         * -mx-4/-mx-6 breaks out of the page gutter.
         */}
        <div className="-mx-4 md:-mx-6">
          <WorkGallerySection
            label={{ th: 'ก่อน/หลัง', en: 'Before & After' }}
            clusters={beforeAfterClusters}
            displayMode="before-after"
            workTitle={work.title}
          />
        </div>

        {/*
         * ── Two-column zone: MDX prose body + desktop sticky sidebar ────────
         * Left column: prose body (max-w-prose constrained inside the 1fr col).
         * Right column: sticky sidebar (16rem / w-64) — desktop only via slot="desktop".
         * Sidebar `sticky top-24 self-start` pins when the prose column scrolls.
         * When hasSidebarContent=false, the grid class is omitted so prose gets full width.
         * Placed after before/after per spec § section ordering.
         */}
        <div className="mx-auto mt-12 max-w-5xl md:mt-16">
          <div
            className={
              hasSidebarContent
                ? 'grid grid-cols-1 md:grid-cols-[1fr_16rem] gap-x-12 items-start'
                : ''
            }
          >
            {/* Left: prose body */}
            <FadeUp>
              <WorkProseSection body={body} />
            </FadeUp>

            {/* Right: desktop sidebar (slot="desktop" → hidden md:block) */}
            {hasSidebarContent && (
              <WorkMetaSidebar {...sidebarProps} slot="desktop" />
            )}
          </div>
        </div>

        {/*
         * ── Process & Detail gallery sections ─────────────────────────────
         * Spec § Desktop mockup: process grid after prose body, detail after that.
         * Each returns null when its kind group is empty.
         * -mx-4/-mx-6 breaks out of the page gutter.
         */}
        <div className="-mx-4 md:-mx-6">
          <WorkGallerySection
            label={{ th: 'กระบวนการ', en: 'Process' }}
            clusters={processClusters}
            displayMode="process-grid"
            workTitle={work.title}
          />
          <WorkGallerySection
            label={{ th: 'รายละเอียด', en: 'Details' }}
            clusters={detailClusters}
            displayMode="detail-editorial"
            workTitle={work.title}
          />
        </div>

        {/*
         * ── Tags row (mobile only) ────────────────────────────────────────────
         * Desktop: tags appear inside the sidebar. Mobile: rendered here at
         * page bottom since the sidebar (slot="desktop") is hidden on mobile.
         */}
        {tagNames.length > 0 && (
          <ul
            className="mt-10 flex flex-wrap gap-2 md:hidden"
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
