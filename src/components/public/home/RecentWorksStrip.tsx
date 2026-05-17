import Link from 'next/link';

import { FadeUp } from '@/components/motion/FadeUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { WorkCard, type WorkCardWork } from '@/components/public/work/WorkCard';
import { labels } from '@/lib/i18n/labels';

type Props = {
  /** Exactly 4 work cards for the strip. */
  works: WorkCardWork[];
};

export function RecentWorksStrip({ works }: Props) {
  if (works.length === 0) return null;

  return (
    <section
      aria-labelledby="recent-works-heading"
      className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16"
    >
      {/* Heading row */}
      <FadeUp>
        <div className="mb-8">
          {/* P1 — lang attributes for bilingual eyebrow */}
          <p className="text-xs uppercase tracking-widest text-muted-brand">
            <span lang="th">{labels.homeRecentEyebrow.th}</span>
            <span aria-hidden="true"> · </span>
            <span lang="en">{labels.homeRecentEyebrow.en}</span>
          </p>
          <h2
            id="recent-works-heading"
            className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink mt-2"
          >
            {labels.homeRecentH2.th}
          </h2>
        </div>
      </FadeUp>

      {/* TODO(phase-2): swap to Embla carousel */}
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* P4 — no priority; all 4 cards are below the fold */}
        {works.map((work) => (
          <StaggerItem key={work.slug}>
            <WorkCard work={work} variant="regular" />
          </StaggerItem>
        ))}
      </Stagger>

      {/* See all link — M3: text-ink for 4.5:1 contrast; P2: min-h-[44px] for touch target */}
      <div className="mt-6 text-right">
        <Link
          href="/works"
          className="inline-flex items-center min-h-[44px] gap-1 text-sm text-ink hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm"
        >
          {labels.homeRecentSeeAll.th}
        </Link>
      </div>
    </section>
  );
}
