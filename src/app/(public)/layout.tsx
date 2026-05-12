import Link from 'next/link';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/common/ThemeToggle';

/**
 * Minimal public chrome — Phase 6 will replace this with full AppHeader +
 * Footer once the rest of the storefront screens land. Keeping it simple now
 * unblocks `/works/[slug]` so admin can preview live.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-bg text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <Link href="/" className="text-lg font-semibold text-ink">
            house-peach
          </Link>
          <nav aria-label="หลัก" className="flex items-center gap-5">
            <Link
              href="/works"
              className="text-sm text-muted-brand hover:text-ink"
            >
              ผลงาน
            </Link>
            <Link
              href="/blog"
              className="text-sm text-muted-brand hover:text-ink"
            >
              บทความ
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-brand hover:text-ink"
            >
              เกี่ยวกับเรา
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-16 border-t border-line bg-bg2/40">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-muted-brand lg:px-6">
          © {new Date().getFullYear()} house-peach — studio ตกแต่งบ้านสไตล์
          warm-tone minimalist
        </div>
      </footer>
    </div>
  );
}
