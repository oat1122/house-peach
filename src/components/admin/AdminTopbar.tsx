'use client';

import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

/**
 * Minimal top bar mounted above page content inside <SidebarInset>. Renders
 * the sidebar trigger (hamburger / collapse) plus a breadcrumb derived from
 * the current path. Page-specific actions can be injected via children.
 */
const SEGMENT_LABELS: Record<string, string> = {
  admin: 'แดชบอร์ด',
  posts: 'บทความ',
  works: 'ผลงาน',
  categories: 'หมวดหมู่',
  tags: 'แท็ก',
  media: 'มีเดีย',
  inquiries: 'ติดต่อ',
  new: 'สร้างใหม่',
  edit: 'แก้ไข',
  login: 'เข้าสู่ระบบ',
};

function labelFor(segment: string) {
  return SEGMENT_LABELS[segment] ?? segment;
}

export function AdminTopbar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  // First segment is always "admin" — display its label as the root crumb.
  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    isLast: i === segments.length - 1,
  }));

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <nav aria-label="breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {crumbs.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden className="text-muted-foreground/50">
                  /
                </span>
              )}
              <span
                className={
                  c.isLast ? 'truncate font-medium text-foreground' : 'truncate'
                }
                aria-current={c.isLast ? 'page' : undefined}
              >
                {c.label}
              </span>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex items-center gap-1.5">
        {children}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-brand-card px-3 py-1.5 text-xs text-muted-brand transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">ดูเว็บไซต์</span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
