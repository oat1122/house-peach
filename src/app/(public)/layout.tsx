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
      {/* Skip link — WCAG 2.4.1 Level A. Visible only on focus (keyboard nav). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-bg focus:text-ink focus:rounded-md focus:ring-2 focus:ring-brand-accent focus:ring-offset-2"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/*
       * Sticky nav. The blog tag bar / works filter bar offset themselves by
       * `var(--header-h)` — defined globally in src/app/globals.css :root
       * (56px mobile → 64px desktop) so it cascades to those bars (which live
       * in <main>, a sibling of this <header>). `bg-bg/95 backdrop-blur-sm`
       * keeps the header readable while a hint of content shimmers through.
       * Keep this header's rendered height (py-3 → md:py-4) in sync with
       * --header-h so the bars tuck right below it without a phantom gap.
       */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:gap-5 md:px-6 md:py-4">
          <Link
            href="/"
            className="text-base md:text-lg font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm"
          >
            house-peach
          </Link>
          <nav aria-label="หลัก" className="flex items-center gap-3 md:gap-5">
            <Link
              href="/works"
              className="text-sm text-muted-brand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm"
            >
              ผลงาน
            </Link>
            <Link
              href="/blog"
              className="text-sm text-muted-brand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm"
            >
              บทความ
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-brand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm"
            >
              ติดต่อ
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main id="main-content" className="flex-1">{children}</main>
      <footer className="mt-16 border-t border-line bg-bg2/40">
        <div className="mx-auto max-w-6xl px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center text-xs text-muted-brand md:px-6">
          © {new Date().getFullYear()} house-peach — studio ตกแต่งบ้านสไตล์
          warm-tone minimalist
        </div>
      </footer>
    </div>
  );
}
