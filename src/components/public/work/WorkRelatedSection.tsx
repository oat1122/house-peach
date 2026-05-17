import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { WorkCard } from '@/components/public/work/WorkCard';
import type { WorkListItem } from '@/lib/services/work';

type Props = {
  works: WorkListItem[];
};

/**
 * RSC — Bottom related works grid (spec §S20).
 *
 * Purpose: broad post-reading discovery — "งานล่าสุดจาก house-peach".
 * Distinct from the sidebar's style-matched block:
 *   Sidebar = confidence during reading (similar style)
 *   Bottom grid = discovery after reading (latest other works)
 *
 * Returns null when works.length === 0 — no empty section.
 *
 * Grid: 2-col mobile, 3-col desktop — same as listing page.
 * Motion: `<Stagger>` on cards, 3 max (total ≤ 0.18s).
 *
 * Heading: "ผลงานล่าสุดจาก house-peach" — NOT "ที่เกี่ยวข้อง" (the sidebar
 * covers that semantic).
 */
export function WorkRelatedSection({ works }: Props) {
  if (works.length === 0) return null;

  return (
    <section
      aria-label="ผลงานล่าสุดจาก house-peach"
      className="mt-16 max-w-6xl mx-auto px-4 md:px-6"
    >
      <h2 className="text-xl font-semibold text-ink">
        ผลงานล่าสุดจาก house-peach
      </h2>

      <Stagger
        as="ul"
        className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 list-none p-0"
      >
        {works.slice(0, 3).map((work) => (
          <StaggerItem as="li" key={work.id}>
            <WorkCard
              work={{
                slug: work.slug,
                title: work.title,
                summary: work.summary,
                roomType: work.roomType,
                style: work.style,
                location: work.location ?? null,
                yearCompleted: work.yearCompleted ?? null,
                areaSqm: work.areaSqm ?? null,
                budgetRange: work.budgetRange ?? null,
                durationDays: work.durationDays ?? null,
                coverPath: work.coverPath,
                coverAlt: work.coverAlt,
              }}
              variant="regular"
            />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
