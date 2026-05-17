import Link from 'next/link';

import { FadeUp } from '@/components/motion/FadeUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { WorkCard, type WorkCardWork } from '@/components/public/work/WorkCard';
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
          {/* Left: eyebrow + h2 */}
          <div>
            {/* P1 — lang attributes for bilingual eyebrow */}
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

          {/* Right: body paragraph */}
          <div>
            <p className="text-sm md:text-base text-muted-brand leading-relaxed">
              {labels.homeDiscoverBody.th}
            </p>
          </div>
        </div>
      </FadeUp>

      {/* Gallery grid
          Mobile:  featured full-width, then small-1 + small-2 side-by-side, then small-wide full-width
          Desktop: 2-col layout — left = featured, right = sub-grid (small-1, small-2, small-wide col-span-2)
      */}
      <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Featured — spans full left column on desktop (via row-span in sub-grid below) */}
        <StaggerItem>
          {/* P5 — remove priority; only hero image above fold warrants it */}
          <WorkCard work={featuredWork} variant="regular" />
        </StaggerItem>

        {/* Right column on desktop: nested 2-col sub-grid for 3 small cards */}
        <StaggerItem>
          {/* Mobile: small-1 + small-2 side by side */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:hidden">
            {small1 && <WorkCard work={small1} variant="regular" />}
            {small2 && <WorkCard work={small2} variant="regular" />}
          </div>
          {/* Mobile: small-wide full-width */}
          {smallWide && (
            <div className="mt-3 md:hidden">
              <WorkCard work={smallWide} variant="regular" />
            </div>
          )}

          {/* Desktop: 2-col sub-grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-4">
            {small1 && <WorkCard work={small1} variant="regular" />}
            {small2 && <WorkCard work={small2} variant="regular" />}
            {smallWide && (
              <div className="col-span-2">
                <WorkCard work={smallWide} variant="regular" />
              </div>
            )}
          </div>
        </StaggerItem>
      </Stagger>

      {/* See all link — M3: text-ink for 4.5:1 contrast; P2: min-h-[44px] for touch target */}
      <div className="mt-6 text-right">
        <Link
          href="/works"
          className="inline-flex items-center min-h-[44px] gap-1 text-sm text-ink hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm"
        >
          {labels.homeDiscoverSeeAll.th}
        </Link>
      </div>
    </section>
  );
}
