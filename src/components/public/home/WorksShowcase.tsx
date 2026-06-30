import Link from 'next/link';

import { FadeUp } from '@/components/motion/FadeUp';
import { WorksShowcaseClient } from '@/components/public/home/WorksShowcaseClient';
import type { WorkCardWork } from '@/components/public/work/WorkCard';

export function WorksShowcase({ works }: { works: WorkCardWork[] }) {
  if (works.length === 0) return null;

  return (
    <section aria-labelledby="works-heading" className="bg-bg2">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <FadeUp>
          <div className="mx-auto mb-8 max-w-xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
              <span lang="th">ผลงานล่าสุด</span>
              <span aria-hidden="true"> · </span>
              <span lang="en">Recent works</span>
            </span>
            <h2
              id="works-heading"
              className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink md:text-4xl"
            >
              ผลงานที่เราภูมิใจ
            </h2>
          </div>
        </FadeUp>

        <WorksShowcaseClient works={works} />

        <div className="mt-12 text-center">
          <Link
            href="/works"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-[1.5px] border-ink px-7 font-semibold text-ink transition-colors hover:bg-ink hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            ดูผลงานทั้งหมด <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
