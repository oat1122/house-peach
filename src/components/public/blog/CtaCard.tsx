import Link from 'next/link';
import { Sparkles } from 'lucide-react';

/**
 * Sidebar / inline CTA card that promotes the interior design service.
 * Wraps in `data-theme="ink"` so all child tokens resolve to the ink preset —
 * creating a dark surface regardless of the active page theme.
 * No animated glow or sparkle — decorative motion is banned per motion.md.
 */
export function CtaCard() {
  return (
    <div data-theme="ink">
      <div className="bg-bg rounded-xl p-6">
        <Sparkles size={32} className="text-brand-accent mb-3" aria-hidden="true" />

        <p className="text-xs uppercase tracking-widest text-muted-brand mb-1">
          บริการตกแต่งบ้าน
        </p>

        <p className="text-lg font-bold text-ink leading-snug mb-2">
          พร้อมเปลี่ยนห้องของคุณ?
        </p>

        <p className="text-sm text-muted-brand leading-relaxed mb-4">
          ทีมเราพร้อมรับฟัง ไม่มีข้อผูกมัด
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
          เริ่มบทสนทนา
        </Link>
      </div>
    </div>
  );
}
