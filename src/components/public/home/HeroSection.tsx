import Image from 'next/image';

import { FadeUp } from '@/components/motion/FadeUp';
import { HeroSearchForm } from './HeroSearchForm';
import { TrustStats } from './TrustStats';

type Props = {
  imagePath: string;
  imageAlt: string;
  styleChoices: string[];
};

export function HeroSection({ imagePath, imageAlt, styleChoices }: Props) {
  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-4 pt-6 md:px-6 md:pt-7">
      {/* Hero image card */}
      <div className="relative min-h-[440px] overflow-hidden rounded-3xl md:min-h-[560px]">
        <Image
          src={imagePath}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 1280px) calc(100vw - 32px), 1200px"
          className="object-cover"
          unoptimized
        />
        {/* Top→bottom dark gradient for legible copy on any photo */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/70"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16">
          <FadeUp immediate className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-accent" />
              Interior Studio · Bangkok
            </span>
            <h1
              id="hero-title"
              className="mt-4 font-serif text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-white md:text-5xl lg:text-6xl"
            >
              ออกแบบบ้านอบอุ่น เรียบง่าย และมีรสนิยม
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/90 md:text-base">
              สตูดิโอออกแบบภายในสไตล์ warm-tone minimalist — ดูแลครบตั้งแต่ concept จนถึงบ้านที่พร้อมอยู่จริง
            </p>
          </FadeUp>
        </div>
      </div>

      {/* Overlapping search card */}
      <FadeUp className="relative z-10 -mt-12 px-0 sm:-mt-14 md:mx-8">
        <div className="rounded-2xl border border-line bg-bg p-4 shadow-[0_30px_60px_-34px_rgba(60,42,24,0.4)] md:p-5">
          <HeroSearchForm styleChoices={styleChoices} />
        </div>
      </FadeUp>

      {/* Trust row */}
      <div className="px-2 pt-6">
        <TrustStats />
      </div>
    </section>
  );
}
