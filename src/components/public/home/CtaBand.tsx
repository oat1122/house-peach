import Link from 'next/link';

import { FadeUp } from '@/components/motion/FadeUp';

/** Dark inverted call-to-action band before the footer. */
export function CtaBand() {
  return (
    <section aria-labelledby="cta-heading" className="px-4 pb-16 md:px-6 md:pb-24">
      <FadeUp>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink px-6 py-12 text-center text-bg md:px-16 md:py-20">
          {/* Warm accent glow (token-based, decorative) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-brand-accent/30"
          />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
              เริ่มต้นง่าย ๆ
            </span>
            <h2
              id="cta-heading"
              className="mx-auto mt-3.5 max-w-[20ch] font-serif text-3xl font-bold leading-tight tracking-tight text-bg md:text-5xl"
            >
              พร้อมเริ่มต้นบ้านในแบบของคุณหรือยัง?
            </h2>
            <p className="mx-auto mt-4 max-w-prose text-sm leading-relaxed text-bg/75 md:text-base">
              นัดคุยกับเราได้เลย ไม่มีค่าใช้จ่าย — เราพร้อมรับฟังและช่วยออกแบบบ้านที่อบอุ่นในแบบของคุณ
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-brand-accent px-7 font-semibold text-bg transition-colors hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                เริ่มโปรเจกต์ <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/works"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-[1.5px] border-bg/35 px-7 font-semibold text-bg transition-colors hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                ดูผลงาน
              </Link>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
