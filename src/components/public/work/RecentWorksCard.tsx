import { Sparkles } from 'lucide-react';

import { SideCard } from '@/components/public/SideCard';
import { WorkCardCompact } from '@/components/public/work/WorkCardCompact';
import type { WorkCompact } from '@/lib/services/work';

type Props = {
  /** Works to render. Caller decides count (typically 3). */
  works: WorkCompact[];
  /** Override the card title — defaults to the discovery framing. */
  title?: string;
};

/**
 * Sidebar card showing related/recent works as compact mini-rows.
 *
 * Parallel to blog's RecentPostsCard. Consumes `WorkCompact` (the shape
 * returned by `listSimilarWorks`) so the page can pass its style-matched
 * sidebar set directly. Returns null when there is nothing to show so the
 * sidebar reflows cleanly.
 */
export function RecentWorksCard({ works, title = 'ผลงานที่คล้ายกัน' }: Props) {
  if (works.length === 0) return null;

  return (
    <SideCard
      title={title}
      icon={
        <Sparkles
          size={18}
          className="text-muted-brand"
          aria-hidden="true"
        />
      }
    >
      <ul className="space-y-3">
        {works.map((w) => (
          <li key={w.id}>
            <WorkCardCompact
              slug={w.slug}
              title={w.title}
              coverPath={w.coverPath}
              roomType={w.roomType}
              style={w.style}
              yearCompleted={w.yearCompleted}
            />
          </li>
        ))}
      </ul>
    </SideCard>
  );
}
