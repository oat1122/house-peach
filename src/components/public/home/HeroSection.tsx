// Hero text is white on a photo overlay — not a theme token violation;
// text sits on a darkened gradient over a photograph (not a token surface).
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { FadeUp } from '@/components/motion/FadeUp';
import { Button } from '@/components/ui/button';
import { labels } from '@/lib/i18n/labels';

type Props = {
  imagePath: string;
  imageAlt: string;
  /** Desktop: absolutely positioned card inside hero. Mobile: rendered after hero in document flow. */
  statsSlot?: ReactNode;
};

export function HeroSection({ imagePath, imageAlt, statsSlot }: Props) {
  return (
    <section aria-labelledby="hero-title">
      {/* Hero card wrapper */}
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <div className="relative w-full overflow-hidden rounded-2xl bg-bg2 aspect-[16/9] md:aspect-[21/9] lg:max-h-[600px]">
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
            className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/20 to-transparent"
          />

          {/* Text content */}
          <div className="absolute inset-0 flex items-end p-6 md:p-12 lg:p-16">
            <FadeUp immediate className="max-w-xl">
              {/* Eyebrow — P1: lang attributes so TTS switches synthesiser correctly */}
              <p className="text-xs uppercase tracking-widest text-white/70 mb-3">
                <span lang="th">{labels.homeHeroEyebrow.th}</span>
                <span aria-hidden="true"> · </span>
                <span lang="en">{labels.homeHeroEyebrow.en}</span>
              </p>

              {/* h1 */}
              <h1 id="hero-title" className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                {labels.homeHeroH1Line1.th}
                <br />
                {labels.homeHeroH1Line2.th}
              </h1>

              {/* Lead */}
              <p className="mt-4 text-sm md:text-base text-white/80 max-w-xs md:max-w-sm leading-relaxed">
                {labels.homeHeroLead.th}
              </p>

              {/* CTA row */}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button
                  render={<Link href="/works" />}
                  nativeButton={false}
                  className="bg-brand-accent hover:bg-brand-accent/90 text-bg rounded-full px-6 py-3 focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 border-0"
                >
                  {labels.homeHeroCtaPrimary.th}
                </Button>
                <Link
                  href="/contact"
                  className="text-sm text-white/90 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm"
                >
                  {labels.homeHeroCtaSecondary.th}
                </Link>
              </div>
            </FadeUp>
          </div>

          {/* StatsCard — desktop: absolute bottom-right inside hero */}
          {statsSlot && (
            <div className="hidden md:block absolute bottom-6 right-6 w-72">
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
