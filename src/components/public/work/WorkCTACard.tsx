import Link from 'next/link';
import { Sparkles } from 'lucide-react';

type Props = {
  style: string | null;
};

/**
 * Sidebar / inline CTA card inviting the visitor to start a project.
 *
 * Wraps in `data-theme="ink"` so all child tokens resolve to the ink preset —
 * creating a dark surface regardless of the active page theme (parity with
 * blog's CtaCard pattern). This gives the sidebar a strong focal point
 * against the warm-tone page background without hardcoding hex.
 *
 * Two links:
 *   1. Primary — "/contact" — pill on muted bg2 surface (dark in ink preset).
 *   2. Secondary — `/works?style=…` (falls back to `/works`) — text link below.
 *
 * No animated glow or sparkle — decorative motion is banned per motion.md.
 */
export function WorkCTACard({ style }: Props) {
  const worksHref = style
    ? `/works?style=${encodeURIComponent(style)}`
    : '/works';

  return (
    <div data-theme="ink">
      <div className="bg-bg rounded-xl p-6">
        <Sparkles
          size={32}
          className="text-brand-accent mb-3"
          aria-hidden="true"
        />

        <p className="text-xs uppercase tracking-widest text-muted-brand mb-1">
          บริการตกแต่งบ้าน
        </p>

        <p className="text-lg font-bold text-ink leading-snug mb-2">
          เริ่มโปรเจกต์ของคุณ
        </p>

        <p className="text-sm text-muted-brand leading-relaxed mb-4">
          ปรึกษาทีมเราได้ฟรี ไม่มีข้อผูกมัด
        </p>

        <Link
          href="/contact"
          className={
            'inline-flex items-center justify-center w-full ' +
            'px-4 py-2.5 rounded-full bg-bg2 text-ink text-sm font-medium ' +
            'transition-colors hover:opacity-90 ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2'
          }
        >
          นัดปรึกษาฟรี
        </Link>

        <Link
          href={worksHref}
          className={
            'mt-3 block text-center text-xs text-muted-brand underline underline-offset-2 ' +
            'hover:text-ink transition-colors ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm'
          }
        >
          ดูผลงานสไตล์เดียวกัน →
        </Link>
      </div>
    </div>
  );
}
