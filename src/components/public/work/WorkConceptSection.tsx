import Image from 'next/image';

import { FadeUp } from '@/components/motion/FadeUp';
import type { WorkCompact } from '@/lib/services/work';

import { WorkCardCompact } from './WorkCardCompact';

type Material = {
  name: string;
  colorHex: string;
};

type FloorPlanImage = {
  path: string;
  alt: string;
  width: number;
  height: number;
};

type Props = {
  /**
   * Material palette from `work.materials` JSON column.
   * Max 8 items enforced at zod layer. Null/empty → palette hidden.
   */
  palette: Material[] | null;
  /**
   * First `kind='plan'` image from work_images.
   * Null → floor plan thumb hidden.
   */
  floorPlanImage: FloorPlanImage | null;
  /**
   * Similar works from `listSimilarWorks` — passed from page RSC.
   * Up to 3 cards. Empty → sidebar related block (heading + list) collapses.
   */
  sidebarRelated: WorkCompact[];
  /**
   * Pre-computed word count of `bodyMdx` via `estimateWordCount()`.
   *
   * Layout branch (spec §S13c):
   * - wordCount >= 250 → desktop two-column grid [1fr 280px]
   *   Left column is intentionally empty (prose rendered in chapter 01).
   * - wordCount < 250 → single-column flow: palette → floor plan → related cards.
   *
   * 250 is a soft layout heuristic; admin can influence it by writing more
   * or less concept text in the single `bodyMdx` field.
   */
  wordCount: number;
  /** Work title — used as floor plan alt fallback */
  workTitle: string;
};

/** Threshold below which the two-column grid collapses to single-column flow */
const TWO_COL_WORD_THRESHOLD = 250;

/**
 * RSC — Chapter 03 "แนวคิดและวัสดุ" content section (spec §S13, §S13c, §S13d).
 *
 * The left column of the desktop two-column grid is EMPTY — concept prose was
 * already rendered in chapter 01 (bodyMdx renders exactly once). The grid is
 * present purely for spacing the sidebar into the right gutter.
 *
 * Mobile dual-slot pattern (spec §S13d):
 * - Slot A: palette + floor plan inside `<aside class="hidden md:block">` (desktop only)
 * - Slot B: palette + floor plan in `<div class="block md:hidden">` (mobile only)
 * Both slots are in the DOM; CSS `display:none` removes the hidden slot from
 * the accessibility tree. No `aria-hidden` needed — display:none achieves this.
 *
 * The sidebar related cards (WorkCardCompact list) are desktop-only — they are
 * NOT rendered in Slot B (mobile). Mobile discovery is handled by the bottom
 * related grid (WorkRelatedSection).
 */
export function WorkConceptSection({
  palette,
  floorPlanImage,
  sidebarRelated,
  wordCount,
  workTitle,
}: Props) {
  const hasPalette = palette != null && palette.length > 0;
  const hasFloorPlan = floorPlanImage != null;
  const hasRelated = sidebarRelated.length > 0;
  const hasSidebarContent = hasPalette || hasFloorPlan || hasRelated;

  // When there is nothing to show in the sidebar, skip the whole section
  if (!hasSidebarContent) return null;

  const useTwoCol = wordCount >= TWO_COL_WORD_THRESHOLD;

  const sidebarContent = (
    <>
      {/* Material palette */}
      <WorkMaterialPalette materials={palette} />

      {/* Floor plan thumb */}
      {hasFloorPlan && (
        <div className="mt-4">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md bg-bg2">
            <Image
              src={floorPlanImage.path}
              alt={
                floorPlanImage.alt ||
                floorPlanImage.alt ||
                `แปลนห้อง — ${workTitle}`
              }
              fill
              sizes="(max-width: 768px) calc(100vw - 2rem), 280px"
              className="object-cover"
              unoptimized
            />
          </div>
          <p className="text-xs text-muted-brand text-center mt-2 italic font-sans">
            แปลนห้อง — Floor plan
          </p>
        </div>
      )}
    </>
  );

  return (
    <FadeUp>
      {useTwoCol ? (
        /* ── Two-column layout (wordCount ≥ 250) ─────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-16 items-start mt-8 max-w-5xl mx-auto">
          {/* Left column: intentionally empty — prose is in chapter 01 */}
          <div aria-hidden="true" />

          {/* Right column: sidebar (desktop only) */}
          <aside
            aria-label="วัสดุ แปลน และผลงานที่เกี่ยวข้อง"
            className="self-start hidden md:block"
          >
            {/* Slot A — desktop palette + floor plan */}
            {sidebarContent}

            {/* Related works block — desktop-only, never in mobile Slot B */}
            {hasRelated && (
              <>
                <hr className="border-t border-line mt-6 mb-6" />
                <h3 className="text-xs uppercase tracking-widest text-muted-brand mb-4">
                  ผลงานสไตล์เดียวกัน
                </h3>
                <ul role="list" className="space-y-4">
                  {sidebarRelated.map((work) =>
                    work.coverPath ? (
                      <li key={work.id}>
                        <WorkCardCompact
                          slug={work.slug}
                          title={work.title}
                          coverPath={work.coverPath}
                          roomType={work.roomType}
                          style={work.style}
                          yearCompleted={work.yearCompleted}
                        />
                      </li>
                    ) : null,
                  )}
                </ul>
              </>
            )}
          </aside>
        </div>
      ) : (
        /* ── Single-column flow (wordCount < 250) ─────────────────────────── */
        <div className="mt-8 max-w-prose mx-auto">
          {sidebarContent}

          {hasRelated && (
            <>
              <hr className="border-t border-line mt-6 mb-6" />
              <h3 className="text-xs uppercase tracking-widest text-muted-brand mb-4 hidden md:block">
                ผลงานสไตล์เดียวกัน
              </h3>
              <ul role="list" className="space-y-4 hidden md:block">
                {sidebarRelated.map((work) =>
                  work.coverPath ? (
                    <li key={work.id}>
                      <WorkCardCompact
                        slug={work.slug}
                        title={work.title}
                        coverPath={work.coverPath}
                        roomType={work.roomType}
                        style={work.style}
                        yearCompleted={work.yearCompleted}
                      />
                    </li>
                  ) : null,
                )}
              </ul>
            </>
          )}
        </div>
      )}

      {/*
       * Slot B — mobile-only palette + floor plan.
       * Rendered in single-column flow below the grid on mobile.
       * Related cards are intentionally EXCLUDED from Slot B — mobile
       * discovery is handled by the bottom WorkRelatedSection grid.
       * Note: both Slot A (inside hidden md:block aside) and Slot B
       * (block md:hidden) are in the DOM. CSS display:none removes the
       * hidden slot from the accessibility tree (verified behaviour for
       * NVDA/VoiceOver with display:none).
       */}
      {useTwoCol && (hasPalette || hasFloorPlan) && (
        <div className="block md:hidden mt-8 max-w-prose mx-auto">
          {sidebarContent}
        </div>
      )}
    </FadeUp>
  );
}

// ── WorkMaterialPalette ───────────────────────────────────────────────────────

/**
 * Inline sub-component — material chip strip (spec §9).
 * Kept in this file per spec §9 (under 40 LOC combined).
 * Returns null if materials is null or empty.
 *
 * Desktop right column: vertical list (`flex flex-col gap-2`).
 * Mobile: horizontal wrap (`flex flex-wrap gap-2`).
 */
function WorkMaterialPalette({
  materials,
}: {
  materials: Material[] | null;
}) {
  if (!materials || materials.length === 0) return null;

  return (
    <ul
      role="list"
      aria-label="วัสดุที่ใช้"
      className="flex flex-wrap md:flex-col gap-2"
    >
      {materials.map((item, idx) => (
        <li key={idx} className="list-none">
          <div className="inline-flex items-center gap-2 rounded-full bg-bg2 px-3 py-1.5 text-sm text-ink">
            {/* Color swatch — aria-hidden; decorative */}
            <span
              aria-hidden="true"
              className="size-4 rounded-sm flex-none border border-line"
              style={{ backgroundColor: item.colorHex }}
            />
            <span>{item.name}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
