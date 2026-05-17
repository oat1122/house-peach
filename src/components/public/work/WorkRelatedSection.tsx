import { FadeUp } from '@/components/motion/FadeUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { WorkCard } from '@/components/public/work/WorkCard';
import type { WorkListItem } from '@/lib/services/work';

type Props = {
  works: WorkListItem[];
};

/**
 * RSC — Bottom related works section (spec §S20, updated post-redesign).
 *
 * Purpose: broad post-reading discovery — "งานล่าสุดจาก house-peach".
 * Distinct from the sidebar's RecentWorksCard:
 *   Sidebar    = confidence during reading (style-matched, 3 cards)
 *   Bottom strip = discovery after reading (latest other works, 3 cards)
 *
 * Visual update (mirrors blog's RelatedPostsSection): wrapped in an alt-bg
 * strip (`bg-bg2 border-t border-line py-16`) for a visible "you've reached
 * the end" beat. Returns null when works.length === 0 — no empty strip.
 *
 * Grid: 1-col mobile, 3-col desktop. Heading centered like blog parity.
 * Motion: `<Stagger>` on cards, 3 max (total ≤ 0.18s).
 */
export function WorkRelatedSection({ works }: Props) {
  if (works.length === 0) return null;

  return (
    <section
      aria-label="ผลงานล่าสุดจาก house-peach"
      className="bg-bg2 border-t border-line py-16"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <FadeUp>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-serif text-ink">
              ผลงานล่าสุดจาก house-peach
            </h2>
          </div>
        </FadeUp>

        <Stagger
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0"
          as="ul"
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
      </div>
    </section>
  );
}
