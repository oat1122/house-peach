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

  return (
    <TooltipProvider delay={120}>
      <ConfirmProvider>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <AdminSidebar user={user} />
          <SidebarInset>
            <AdminTopbar />
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        <Toaster position="top-right" richColors closeButton />
      </ConfirmProvider>
    </TooltipProvider>
  );
}
