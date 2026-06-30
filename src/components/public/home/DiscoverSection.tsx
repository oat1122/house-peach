import Link from 'next/link';

import { FadeUp } from '@/components/motion/FadeUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { FeaturedWorkCard } from '@/components/public/home/FeaturedWorkCard';
import type { WorkCardWork } from '@/components/public/work/WorkCard';
import { labels } from '@/lib/i18n/labels';

type Props = {
  featuredWork: WorkCardWork;
  /** Exactly 3 items: small-1, small-2, small-wide */
  smallWorks: WorkCardWork[];
};

export function DiscoverSection({ featuredWork, smallWorks }: Props) {
  if (!featuredWork && smallWorks.length === 0) return null;

  const [small1, small2, smallWide] = smallWorks;

  return (
    <section
      aria-labelledby="discover-heading"
      className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16"
    >
      {/* Section heading row */}
      <FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-brand">
              <span lang="th">{labels.homeDiscoverEyebrow.th}</span>
              <span aria-hidden="true"> · </span>
              <span lang="en">{labels.homeDiscoverEyebrow.en}</span>
            </p>
            <h2
              id="discover-heading"
              className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink mt-2"
            >
              {labels.homeDiscoverH2.th}
            </h2>
          </div>
          <div>
            <p className="text-sm md:text-base text-muted-brand leading-relaxed">
              {labels.homeDiscoverBody.th}
            </p>
          </div>
        </div>
      </FadeUp>

      {/*
        Housify-faithful grid:
        - mobile:  1 col (cards stack)
        - sm:      2 col (small-wide spans 2)
        - lg:      [1.4fr 1fr 1fr] columns × [220px 220px] rows
                   featured fills col-1 across both rows; small-1/small-2 top-right; small-wide bottom-right spanning 2 cols
      */}
      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-[1.4fr_1fr_1fr] lg:grid-rows-[220px_220px]">
        <StaggerItem className="lg:row-span-2 lg:col-start-1 sm:col-span-2 lg:col-span-1">
          <FeaturedWorkCard work={featuredWork} />
        </StaggerItem>
        {small1 && (
          <StaggerItem className="lg:col-start-2 lg:row-start-1">
            <FeaturedWorkCard work={small1} />
          </StaggerItem>
        )}
        {small2 && (
          <StaggerItem className="lg:col-start-3 lg:row-start-1">
            <FeaturedWorkCard work={small2} />
          </StaggerItem>
        )}
        {smallWide && (
          <StaggerItem className="sm:col-span-2 lg:col-start-2 lg:col-span-2 lg:row-start-2">
            <FeaturedWorkCard work={smallWide} />
          </StaggerItem>
        )}
      </Stagger>

      {/* See all link — text-ink (4.5:1) + min-h-[44px] tap target */}
      <div className="mt-8 flex justify-end">
        <Link
          href="/works"
          className="group/all inline-flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-brand-accent hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-md"
        >
          <span>{labels.homeDiscoverSeeAll.th.replace(' →', '')}</span>
          <span className="transition-transform duration-200 group-hover/all:translate-x-1">→</span>
        </Link>
      </div>
    </section>
  );
}
