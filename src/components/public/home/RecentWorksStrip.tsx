import Link from 'next/link';

import { FadeUp } from '@/components/motion/FadeUp';
import { RecentWorksClient } from '@/components/public/home/RecentWorksClient';
import type { WorkCardWork } from '@/components/public/work/WorkCard';
import { labels } from '@/lib/i18n/labels';

type Props = {
  /**
   * Pool of recent works to feed the client-side filter.
   * The client child shows up to 4 matching the active chip.
   */
  works: WorkCardWork[];
};

export function RecentWorksStrip({ works }: Props) {
  if (works.length === 0) return null;

  return (
    <section
      aria-labelledby="recent-works-heading"
      className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16"
    >
      {/* Centered heading */}
      <FadeUp>
        <div className="mb-6 text-center">
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

      {/* Chips + filtered grid live in the client child */}
      <RecentWorksClient pool={works} />

      {/* Pagination dots — visual placeholder for future carousel */}
      <div className="flex justify-center gap-1.5 mt-7" aria-hidden="true">
        <span className="w-4 h-1.5 rounded-full bg-ink" />
        <span className="w-1.5 h-1.5 rounded-full bg-line" />
        <span className="w-1.5 h-1.5 rounded-full bg-line" />
        <span className="w-1.5 h-1.5 rounded-full bg-line" />
        <span className="w-1.5 h-1.5 rounded-full bg-line" />
      </div>

      {/* See all link */}
      <div className="mt-6 text-center">
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
