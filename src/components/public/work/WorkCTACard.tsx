import Link from 'next/link';

import { FadeUp } from '@/components/motion/FadeUp';

type Props = {
  style: string | null;
};

/**
 * RSC — Conversion CTA card at page end (spec §S19, §13).
 *
 * Both buttons are `<Link>` (navigation semantics) — not `<button>`.
 * Button 1: "/contact" — primary, full-width on mobile, min-w on desktop.
 * Button 2: "/works?style={style}" — text-link, falls back to "/works" when
 *   work.style is null. Always rendered regardless of filter implementation.
 *
 * Copy is bilingual display pattern (TH primary): spec §13 copy table.
 */
export function WorkCTACard({ style }: Props) {
  const worksHref = style
    ? `/works?style=${encodeURIComponent(style)}`
    : '/works';

  return (
    <FadeUp>
      <div className="max-w-lg mx-auto mt-24 bg-brand-card border border-line rounded-xl p-6 md:p-8 text-center">
        <p className="font-sans font-semibold text-xl text-ink">
          ชอบผลงานนี้?
        </p>
        <p className="font-sans text-base text-muted-brand mt-2 leading-[1.65]">
          ปรึกษาทีมเราได้ฟรี ไม่มีข้อผูกมัด
        </p>

        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-center">
          {/* Primary CTA */}
          <Link
            href="/contact"
            className={
              'inline-flex items-center justify-center w-full md:w-auto md:min-w-[180px] ' +
              'px-6 py-3 rounded-md bg-brand-accent text-bg font-medium text-sm ' +
              'transition-opacity hover:opacity-90 ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2'
            }
          >
            นัดปรึกษาฟรี
          </Link>

          {/* Secondary text-link */}
          <Link
            href={worksHref}
            className={
              'text-sm text-brand-accent underline underline-offset-4 ' +
              'hover:opacity-80 transition-opacity ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm'
            }
          >
            ดูผลงานสไตล์เดียวกัน →
          </Link>
        </div>
      </div>
    </FadeUp>
  );
}
