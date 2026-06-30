import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { ConfirmProvider } from '@/components/common/ConfirmProvider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { auth } from '@/lib/auth';
import { getAdminNavCounts } from '@/lib/services/dashboard';

export const metadata: Metadata = {
  title: { template: '%s — house-peach admin', default: 'house-peach admin' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.role);

  // The sidebar persists collapsed/expanded across reloads via cookie.
  // Read it server-side so SSR markup matches the eventual client state.
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  // Unauthenticated routes (e.g. /admin/login) still pass through the layout
  // but should not render the sidebar / topbar chrome.
  if (!isLoggedIn) {
    return (
      <ConfirmProvider>
        <div className="min-h-svh bg-bg text-ink">{children}</div>
        <Toaster position="top-right" richColors closeButton />
      </ConfirmProvider>
    );
  }

  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    role: session?.user?.role ?? 'editor',
  };
  const navCounts = await getAdminNavCounts();

  return (
    <TooltipProvider delay={120}>
      <ConfirmProvider>
        {/* Skip link — visually hidden until keyboard-focused; jumps past
            sidebar + topbar to the page <main>. WCAG 2.4.1 Bypass Blocks. */}
        <a
          href="#admin-main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-foreground focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-background focus-visible:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          ข้ามไปยังเนื้อหา
        </a>

        <SidebarProvider defaultOpen={sidebarOpen}>
          <AdminSidebar user={user} counts={navCounts} />
          <SidebarInset>
            <AdminTopbar />
            <main
              id="admin-main"
              tabIndex={-1}
              className="flex flex-1 flex-col focus-visible:outline-none"
            >
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster position="top-right" richColors closeButton />
      </ConfirmProvider>
    </TooltipProvider>
  );
}
