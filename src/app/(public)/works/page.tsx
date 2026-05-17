import { Suspense } from 'react';
import type { Metadata } from 'next';
import { z } from 'zod';

import { FadeUp } from '@/components/motion/FadeUp';
import { WorksFilterBar } from '@/components/public/work/WorksFilterBar';
import { WorksListing } from '@/components/public/work/WorksListing';
import { Skeleton } from '@/components/ui/skeleton';
import { listPublishedWorks, listDistinctWorkStyles } from '@/lib/services/work';
import { roomTypeValues, type RoomType } from '@/lib/db/schema/works';
import { env } from '@/env';

/**
 * ISR with 60s revalidation. Underlying DB queries (`listPublishedWorks`,
 * `listDistinctWorkStyles`) are wrapped in `unstable_cache` keyed on input
 * args and tagged with `'works'` — admin mutations bust the tag via
 * `bumpWorkById()`, so filter combinations stay fresh without `force-dynamic`.
 *
 * Filter swap correctness (the bug that previously forced `force-dynamic`):
 * `/works` does not use `<Link prefetch>` for filter chips — `WorksFilterBar`
 * uses a `<Select>` + `router.push()` flow, so Next's pathname-keyed router
 * cache cannot cross-contaminate filter variants. The blog equivalent uses
 * `<Link prefetch={false}>` on its chips for the same reason.
 */
export const revalidate = 60;

// ── SEO ──────────────────────────────────────────────────────────────────────

const META_DESCRIPTION =
  'รวมผลงานออกแบบและตกแต่งบ้านโดย house-peach — ห้องนั่งเล่น ห้องนอน ห้องครัว สไตล์อบอุ่นแบบเรียบง่าย ดูตัวอย่างจริงพร้อมภาพก่อน-หลังและรายละเอียดการใช้งาน';

// NOTE: Static `metadata` export is removed — we use `generateMetadata` instead
// so filter pages can set robots: noindex. Next.js does not allow both exports
// in the same file.

// ── Search params schema ──────────────────────────────────────────────────────

const SearchParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  room: z
    .enum(roomTypeValues)
    .optional()
    .catch(undefined), // silently ignore invalid room values
  style: z.string().max(60).optional().catch(undefined),
  // Tag slug filter — silently dropped if invalid. Service layer resolves the
  // slug → tag id; missing tags return an empty list rather than 404 so a stale
  // bookmark still renders a clean empty state.
  tag: z.string().max(80).optional().catch(undefined),
});

// ── Page ──────────────────────────────────────────────────────────────────────

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorksPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  // Flatten arrays — take first value if multiple (e.g. ?room=living&room=kitchen)
  const flattened = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const parsed = SearchParams.safeParse(flattened);
  const params = parsed.success
    ? parsed.data
    : { page: 1, room: undefined, style: undefined, tag: undefined };

  const isFiltered = !!(params.room || params.style || params.tag);

  // Per spec §7: "Load more" uses `page` param to expand the visible set.
  // We fetch all items up to current page to simulate cumulative load-more.
  const PAGE_SIZE = 12;
  const limit = params.page * PAGE_SIZE;

  const [{ items, total, hasMore }, availableStyles] = await Promise.all([
    listPublishedWorks({
      page: 1,          // always start from top — we use limit to show N*page items
      limit,
      roomType: params.room as RoomType | undefined,
      style: params.style,
      tagSlug: params.tag,
    }),
    listDistinctWorkStyles(),
  ]);

  // listDistinctWorkStyles may return nulls from nullable DB column; filter them
  const styleOptions = availableStyles.filter((s): s is string => s != null);

  // For filtered / paginated pages, override metadata to noindex
  // (handled via generateMetadata when params are active — static `metadata`
  // export is the base; we generate dynamic only when needed)

  const siteOrigin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

  const collectionPageLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'ผลงาน — house-peach',
    description: META_DESCRIPTION,
    url: `${siteOrigin}/works`,
    publisher: {
      '@type': 'Organization',
      name: 'house-peach',
      url: siteOrigin,
    },
  };

  // 2-item BreadcrumbList for the listing page (home → ผลงาน)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: `${siteOrigin}/` },
      { '@type': 'ListItem', position: 2, name: 'ผลงาน', item: `${siteOrigin}/works` },
    ],
  };

  const filterParams = {
    room: params.room as string | undefined,
    style: params.style,
    tag: params.tag,
  };

  const countLabel = isFiltered
    ? `งาน ${total} ชิ้น ที่ตรงกัน`
    : `งาน ${total} ชิ้น`;

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Lead block: eyebrow H1 + lead paragraph + count */}
        <FadeUp>
          <div className="pt-10 md:pt-12">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-ink break-words">
              ผลงาน · Works
            </h1>
            <p className="text-base md:text-lg text-muted-brand leading-[1.65] max-w-prose mt-3 break-words">
              สตูดิโอออกแบบและตกแต่งบ้านแนวอบอุ่นแบบเรียบง่าย — เลือกดูผลงานตามประเภทห้อง
              สไตล์ หรือดูทั้งหมดเพื่อหาแรงบันดาลใจของบ้านในแบบของคุณ
            </p>
            <p className="text-xs uppercase tracking-widest text-muted-brand mt-4">
              {countLabel}
            </p>
          </div>
        </FadeUp>
      </div>

      {/* Filter bar — sticky, sits below AppHeader (z-10 < AppHeader z-20).
           Suspense required: WorksFilterBar calls useSearchParams() inside a
           client component. Without Suspense, Next.js would bail out of static
           optimization for the whole page. */}
      <div className="mt-6">
        <Suspense
          fallback={
            <div className="sticky top-[var(--header-h,56px)] z-10 bg-bg/90 backdrop-blur-sm border-b border-line">
              <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex gap-3">
                <Skeleton className="h-11 w-32 rounded-lg" />
                <Skeleton className="h-11 w-32 rounded-lg" />
              </div>
            </div>
          }
        >
          <WorksFilterBar availableStyles={styleOptions} />
        </Suspense>
      </div>

      {/* Listing grid */}
      <div className="mx-auto max-w-6xl px-4 md:px-6 mt-10 pb-16">
        <WorksListing
          items={items}
          total={total}
          hasMore={hasMore}
          isFiltered={isFiltered}
          currentPage={params.page}
          filterParams={filterParams}
        />
      </div>

      {/* JSON-LD — omit on filtered pages (noindex; Google ignores their
           structured data anyway). Emit both CollectionPage + BreadcrumbList
           on the canonical /works listing. */}
      {!isFiltered && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
          />
        </>
      )}
    </>
  );
}

// ── Dynamic metadata for filtered / paginated pages ───────────────────────────

/**
 * Overrides the static `metadata` export ONLY when filter or pagination params
 * are present. Base /works (no params) uses the static export above.
 *
 * Per seo.md: filter pages → noindex. Paginated unfiltered pages → index.
 */
export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const rawParams = await searchParams;
  const flattened = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = SearchParams.safeParse(flattened);
  const params = parsed.success
    ? parsed.data
    : { page: 1, room: undefined, style: undefined };

  const hasFilter = !!(params.room || params.style || params.tag);
  const hasPagination = params.page > 1;

  // Base page — full metadata including OG/Twitter for social previews
  if (!hasFilter && !hasPagination) {
    return {
      title: 'ผลงาน',
      description: META_DESCRIPTION,
      alternates: { canonical: '/works' },
      openGraph: {
        title: 'ผลงาน',
        description: META_DESCRIPTION,
        url: '/works',
        type: 'website',
      },
      twitter: { card: 'summary', title: 'ผลงาน', description: META_DESCRIPTION },
    };
  }

  // Filter pages: noindex (duplicate content)
  // Paginated unfiltered pages: index (real content)
  const shouldNoindex = hasFilter;

  return {
    title: 'ผลงาน',
    description: META_DESCRIPTION,
    alternates: { canonical: '/works' },
    robots: shouldNoindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}
