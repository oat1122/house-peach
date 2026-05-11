import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ — house-peach',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.role) redirect('/admin');

  return (
    <main className="flex min-h-svh items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-brand-card p-6 shadow-sm ring-1 ring-line">
        <header className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold text-ink">เข้าสู่ระบบผู้ดูแล</h1>
          <p className="text-sm text-muted-brand">
            สำหรับทีม house-peach เท่านั้น
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  );
}
