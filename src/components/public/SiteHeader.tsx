import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';

import { ThemeToggle } from '@/components/common/ThemeToggle';
import { MobileNav } from '@/components/public/MobileNav';
import { SOCIAL_LINKS } from '@/components/public/SocialIcons';

const NAV = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/works', label: 'ผลงาน' },
  { href: '/blog', label: 'บทความ' },
  { href: '/contact', label: 'ติดต่อ' },
] as const;

function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-bold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm ${className ?? ''}`}
    >
      <span aria-hidden="true" className="size-2.5 rounded-full bg-brand-accent" />
      <span>
        house<span className="text-brand-accent">·</span>peach
      </span>
    </Link>
  );
}

/** Public site chrome — dark info top bar + sticky header (logo, nav, CTA). */
export function SiteHeader() {
  return (
    <>
      {/* Top bar — inverted band (dark in light themes). Not sticky: scrolls away. */}
      <div className="bg-ink text-bg/85 text-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-4 py-2 md:px-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-brand-accent" aria-hidden="true" />
              กรุงเทพมหานคร, ประเทศไทย
            </span>
            <a
              href="tel:021234567"
              className="inline-flex items-center gap-1.5 hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm"
            >
              <Phone className="size-3.5 text-brand-accent" aria-hidden="true" />
              02-123-4567
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="hidden sm:inline opacity-85">เปิด จันทร์–เสาร์ · 09:00–18:00</span>
            <span className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-bg/85 hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky header. Height (py-3 → md:py-4) kept in sync with --header-h. */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
          <Logo className="text-lg md:text-xl" />

          <nav aria-label="หลัก" className="hidden md:flex items-center gap-7">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-brand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/contact"
              className="hidden md:inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-accent px-5 text-sm font-semibold text-bg hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 transition-colors"
            >
              ปรึกษาฟรี
            </Link>
            <MobileNav items={NAV} />
          </div>
        </div>
      </header>
    </>
  );
}
