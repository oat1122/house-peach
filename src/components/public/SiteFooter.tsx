import Link from 'next/link';

import { SOCIAL_LINKS } from '@/components/public/SocialIcons';

const FOOTER_NAV = [
  { href: '/works', label: 'ผลงาน' },
  { href: '/blog', label: 'บทความ' },
  { href: '/contact', label: 'ติดต่อ' },
] as const;

/** Dark inverted footer — brand statement, sitemap, contact, bottom bar. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-bg/70">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-10 px-4 pt-12 pb-8 md:px-6 md:pt-16">
        {/* Brand */}
        <div className="max-w-sm flex-1 basis-72">
          <div className="mb-3 inline-flex items-center gap-2 text-xl font-bold text-bg">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-brand-accent" />
            house<span className="text-brand-accent">·</span>peach
          </div>
          <p className="text-sm leading-relaxed">
            สตูดิโอตกแต่งบ้านสไตล์ warm-tone minimalist กรุงเทพฯ — ออกแบบบ้านที่อบอุ่นและมีรสนิยม
          </p>
          <div className="mt-5 flex gap-2.5">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex size-9 items-center justify-center rounded-lg bg-bg/10 text-bg/80 hover:bg-bg/20 hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="flex flex-wrap gap-10 md:gap-16">
          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-bg">เมนู</h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-bg">ติดต่อ</h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a href="tel:021234567" className="hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm">
                  02-123-4567
                </a>
              </li>
              <li>
                <a href="mailto:hello@housepeach.co" className="hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm">
                  hello@housepeach.co
                </a>
              </li>
              <li>กรุงเทพมหานคร</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-bg/15">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-xs md:px-6">
          <span>© {year} house·peach · Bangkok</span>
          <span>Designed with warmth</span>
        </div>
      </div>
    </footer>
  );
}
