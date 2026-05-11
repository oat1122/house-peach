import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { signOutAction } from '@/lib/actions/auth';
import type { UserRole } from '@/lib/db/schema/users';

const navItems = [
  { href: '/admin', label: 'แดชบอร์ด' },
  { href: '/admin/posts', label: 'บทความ' },
  { href: '/admin/works', label: 'ผลงาน' },
  { href: '/admin/tags', label: 'แท็ก' },
  { href: '/admin/media', label: 'มีเดีย' },
] as const;

export function AdminNav({
  user,
}: {
  user: { name: string | null; email: string | null; role: UserRole };
}) {
  return (
    <header className="border-b border-line bg-brand-card">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/admin" className="text-sm font-semibold text-ink">
          house-peach · admin
        </Link>
        <nav aria-label="ส่วนของผู้ดูแล" className="hidden gap-4 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-brand hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right text-xs text-muted-brand sm:block">
            <div className="text-ink">{user.name ?? user.email}</div>
            <div>{user.role}</div>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              ออกจากระบบ
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
