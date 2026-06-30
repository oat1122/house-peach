import Image from 'next/image';
import type { ReactNode } from 'react';

import { FadeUp } from '@/components/motion/FadeUp';
import { labels } from '@/lib/i18n/labels';
import { HeroSearchForm } from './HeroSearchForm';

type Props = {
  imagePath: string;
  imageAlt: string;
  styleChoices: string[];
  /** Desktop: absolutely positioned card inside hero. Mobile: rendered after hero in document flow. */
  statsSlot?: ReactNode;
};

export function HeroSection({ imagePath, imageAlt, styleChoices, statsSlot }: Props) {
  return (
    <section aria-labelledby="hero-title">
      {/* Hero card wrapper */}
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <div className="relative w-full overflow-hidden rounded-2xl bg-bg2 min-h-[500px] md:h-[540px]">
          {/* Background image */}
          <Image
            src={imagePath}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1280px) calc(100vw - 48px), 1200px"
            className="object-cover"
            unoptimized
          />

          {/* Gradient overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/35 to-transparent"
          />

          {/* Text content */}
          <div className="absolute inset-0 flex items-end p-6 md:p-12 lg:p-16">
            <FadeUp immediate className="max-w-xl w-full">
              {/* Eyebrow — P1: lang attributes so TTS switches synthesiser correctly */}
              <p className="text-xs uppercase tracking-widest text-white/70 mb-3">
                <span lang="th">{labels.homeHeroEyebrow.th}</span>
                <span aria-hidden="true"> · </span>
                <span lang="en">{labels.homeHeroEyebrow.en}</span>
              </p>

              {/* h1 */}
              <h1 id="hero-title" className="font-serif text-4xl md:text-5xl lg:text-[52px] font-bold tracking-[-0.02em] text-white leading-[1.05]">
                {labels.homeHeroH1Line1.th}
                <br />
                {labels.homeHeroH1Line2.th}
              </h1>

              {/* Lead */}
              <p className="mt-4 text-sm text-white/90 max-w-xs md:max-w-sm leading-relaxed">
                {labels.homeHeroLead.th}
              </p>

              {/* Hero Search Form - Client Component */}
              <HeroSearchForm styleChoices={styleChoices} />
            </FadeUp>
          </div>

          {/* StatsCard — desktop: absolute bottom-right inside hero */}
          {statsSlot && (
            <div className="hidden md:block absolute bottom-6 right-6 w-[340px]">
              {statsSlot}
            </div>
          )}
        </div>
      </div>

      {/* StatsCard — mobile: below hero in normal flow */}
      {statsSlot && (
        <div className="md:hidden px-4 mt-4">
          {statsSlot}
        </div>
      )}
    </section>
  );
}

