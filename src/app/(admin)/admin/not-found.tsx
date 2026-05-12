import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  FolderKanban,
  Images,
  SearchX,
  Tag as TagIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

const QUICK_LINKS = [
  { href: '/admin/posts', label: 'บทความ', Icon: FileText },
  { href: '/admin/works', label: 'ผลงาน', Icon: FolderKanban },
  { href: '/admin/media', label: 'มีเดีย', Icon: Images },
  { href: '/admin/tags', label: 'แท็ก', Icon: TagIcon },
] as const;

/**
 * Admin 404 — fires for unmatched `/admin/*` paths and for `notFound()` calls
 * from any admin route. Renders inside the admin shell (sidebar + topbar)
 * since this file sits below `app/(admin)/admin/layout.tsx`.
 */
export default function AdminNotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center lg:py-24">
      <SearchX
        className="size-12 text-muted-foreground"
        aria-hidden
      />
      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        ไม่พบหน้าที่ค้นหา
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        URL อาจพิมพ์ผิด หรือหน้านี้ถูกย้ายแล้ว · ลองไปที่ส่วนใดส่วนหนึ่งด้านล่าง
      </p>

      <Button
        className="mt-6"
        render={<Link href="/admin" />}
        nativeButton={false}
      >
        <ArrowLeft className="size-4" aria-hidden />
        กลับแดชบอร์ด
      </Button>

      <ul className="mt-10 grid w-full gap-2 sm:grid-cols-2">
        {QUICK_LINKS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition hover:border-foreground/30 hover:bg-muted"
            >
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
