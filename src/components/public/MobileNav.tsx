'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type NavItem = { href: string; label: string };

/**
 * Mobile hamburger → slide-in nav. Desktop renders inline links in SiteHeader,
 * so this is `md:hidden`. Sheet (base-ui Dialog) gives focus-trap + Esc for free.
 */
export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="เปิดเมนู"
        className="md:hidden inline-flex size-9 items-center justify-center rounded-md text-ink hover:bg-bg2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-bg text-ink border-line">
        <SheetHeader>
          <SheetTitle className="text-ink">เมนู</SheetTitle>
        </SheetHeader>
        <nav aria-label="เมนูหลัก" className="flex flex-col gap-1 px-4 pb-6">
          {items.map((item) => (
            <SheetClose
              key={item.href}
              render={
                <Link
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-bg2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                />
              }
            >
              {item.label}
            </SheetClose>
          ))}
          <SheetClose
            render={
              <Link
                href="/contact"
                className="mt-3 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-accent px-5 font-semibold text-bg hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              />
            }
          >
            ปรึกษาฟรี
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
