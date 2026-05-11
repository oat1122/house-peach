import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminNav } from '@/components/admin/AdminNav';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: { template: '%s — house-peach admin', default: 'house-peach admin' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.role);

  return (
    <div className="flex min-h-svh flex-col bg-bg text-ink">
      {isLoggedIn && (
        <AdminNav
          user={{
            name: session?.user?.name ?? null,
            email: session?.user?.email ?? null,
            role: session?.user?.role ?? 'editor',
          }}
        />
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
