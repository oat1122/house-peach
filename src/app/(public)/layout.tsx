import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/public/SiteFooter';
import { SiteHeader } from '@/components/public/SiteHeader';

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

      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
