import type { Metadata } from 'next';
import { Mail, Clock } from 'lucide-react';

import { env } from '@/env';
import { FadeUp } from '@/components/motion/FadeUp';
import { ContactForm } from '@/components/public/contact/ContactForm';
import { ObfuscatedEmail } from '@/components/public/contact/ObfuscatedEmail';

export const dynamic = 'force-static';

// ── SEO ───────────────────────────────────────────────────────────────────────

const META_DESCRIPTION =
  'ติดต่อ house-peach เพื่อเริ่มต้นโปรเจกต์ตกแต่งบ้านของคุณ บริการออกแบบห้อง ปรึกษาออกแบบ และบริการบางส่วน ทีมเราพร้อมตอบกลับภายใน 2 วันทำการ';

export async function generateMetadata(): Promise<Metadata> {
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return {
    title: 'ติดต่อ',
    description: META_DESCRIPTION,
    alternates: {
      canonical: `${origin}/contact`,
    },
    openGraph: {
      type: 'website',
      title: 'ติดต่อ — house-peach',
      description: META_DESCRIPTION,
    },
    twitter: {
      card: 'summary',
      title: 'ติดต่อ — house-peach',
      description: META_DESCRIPTION,
    },
  };
}

// ── JSON-LD ───────────────────────────────────────────────────────────────────

function ContactJsonLd() {
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': `${origin}/contact`,
        name: 'ติดต่อ — house-peach',
        description: META_DESCRIPTION,
        url: `${origin}/contact`,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'หน้าแรก',
              item: origin,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'ติดต่อ',
              item: `${origin}/contact`,
            },
          ],
        },
      },
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'house-peach',
        url: origin,
        logo: `${origin}/og/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: ['Thai', 'English'],
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <>
      <ContactJsonLd />

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <FadeUp>
          <div className="pt-10 md:pt-12">
            <p className="text-xs uppercase tracking-widest text-muted-brand mb-3">
              Start a project · เริ่มโปรเจกต์
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-ink break-words">
              มาคุยเรื่องบ้านที่คุณฝันถึงกัน
            </h1>
            <p className="text-base md:text-lg text-muted-brand leading-[1.65] max-w-prose mt-3 break-words">
              เล่ารายละเอียดเกี่ยวกับห้องของคุณสักหน่อย เราจะตอบกลับภายใน 2 วันทำการ
            </p>
          </div>
        </FadeUp>
      </div>

      {/* 2-column layout: form + info card */}
      <div className="mx-auto max-w-6xl px-4 md:px-6 mt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
          {/* Form — spans 2 cols on md+ */}
          <div className="md:col-span-2">
            <ContactForm />
          </div>

          {/* Info card — 1 col on md+ */}
          <aside
            className="bg-brand-card border border-line rounded-xl p-6 space-y-5"
            aria-label="ข้อมูลการติดต่อ"
          >
            <div className="flex items-start gap-3">
              <Mail
                size={20}
                className="text-brand-accent mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">อีเมล</p>
                {/* Obfuscated against naïve scrapers — server renders
                    `hello [at] house-peach [dot] com`, client swaps to a real
                    mailto link after hydration. */}
                <div className="mt-0.5">
                  <ObfuscatedEmail user="hello" domain="house-peach.com" />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock
                size={20}
                className="text-brand-accent mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-ink">เวลาตอบกลับ</p>
                <p className="text-sm text-muted-brand mt-0.5">
                  ภายใน 2 วันทำการ
                </p>
              </div>
            </div>

            <hr className="border-line" />

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-brand mb-2">
                บริการของเรา
              </p>
              <ul className="space-y-1.5 text-sm text-muted-brand">
                <li>ออกแบบทั้งหมด</li>
                <li>ปรึกษาออกแบบ</li>
                <li>บางส่วน / ห้องเดียว</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
