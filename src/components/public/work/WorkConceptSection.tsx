import Image from 'next/image';

import { FadeUp } from '@/components/motion/FadeUp';

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
  /** Work title — used as floor plan alt fallback */
  workTitle: string;
};

/**
 * RSC — Chapter 03 "แนวคิดและวัสดุ" content section.
 *
 * Layout (post page-level-sidebar redesign):
 *   Desktop: palette (left) | floor plan (right) in a 2-col grid.
 *   Mobile: stack — palette above, floor plan below.
 *
 * Returns null when there is nothing to show. The "related works in sidebar"
 * affordance moved to the page-level RecentWorksCard sidebar item — keeping
 * this section focused on materials + the spatial plan reading.
 */
export function WorkConceptSection({
  palette,
  floorPlanImage,
  workTitle,
}: Props) {
  const hasPalette = palette != null && palette.length > 0;
  const hasFloorPlan = floorPlanImage != null;

  if (!hasPalette && !hasFloorPlan) return null;

  const paletteBlock = hasPalette ? (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-muted-brand mb-4">
        วัสดุที่ใช้ · Materials
      </h3>
      <WorkMaterialPalette materials={palette} />
    </div>
  ) : null;

  const floorPlanBlock = hasFloorPlan ? (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-muted-brand mb-4">
        แปลนห้อง · Floor plan
      </h3>
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md bg-bg2">
        <Image
          src={floorPlanImage.path}
          alt={floorPlanImage.alt || `แปลนห้อง — ${workTitle}`}
          fill
          sizes="(max-width: 768px) calc(100vw - 2rem), 480px"
          className="object-cover"
          unoptimized
        />
      </div>
    </div>
  ) : null;

  // Layout: 2-col when both blocks are present; single-col otherwise.
  const useTwoCol = hasPalette && hasFloorPlan;

  return (
    <FadeUp>
      <div
        className={
          useTwoCol
            ? 'mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start max-w-5xl mx-auto'
            : 'mt-8 max-w-prose mx-auto'
        }
      >
        {paletteBlock}
        {floorPlanBlock}
      </div>
    </FadeUp>
  );
}

// ── WorkMaterialPalette ───────────────────────────────────────────────────────

/**
 * Inline sub-component — material chip strip. Returns null if materials is
 * null or empty. Mobile uses wrap; desktop uses column to read like a
 * spec sheet.
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
