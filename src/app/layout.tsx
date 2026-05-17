import type { Metadata } from 'next';
import { Geist, Geist_Mono, DM_Serif_Display } from 'next/font/google';

import { ThemeProvider } from '@/components/common/ThemeProvider';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * DM Serif Display — editorial serif used for H1 hero, drop cap, and pull
 * quote. Only the 400 weight exists (no bold cut); bold headings are achieved
 * via tracking-tight + large size.
 *
 * Thai subset note: DM Serif Display does NOT include a Thai subset on Google
 * Fonts. Thai characters in an element with `font-serif` will fall back to the
 * OS Thai serif stack (e.g. Sarabun, Angsana). This is intentional — the brand
 * chose DM Serif Display for its Latin editorial character; Thai copy in h1
 * headings falls back gracefully. No corrective action needed.
 */
const dmSerifDisplay = DM_Serif_Display({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  // `template` lets child segments export only the page-specific part of the
  // title and Next prepends "<page> — house-peach" automatically. The
  // `default` is used by the root route / and any segment that doesn't
  // override `metadata`. Per .claude/rules/seo.md § Title format.
  title: {
    default: 'house-peach — สตูดิโอตกแต่งบ้านสไตล์อบอุ่น',
    template: '%s — house-peach',
  },
  description:
    'house-peach — สตูดิโอออกแบบและตกแต่งบ้านโทนอบอุ่นสไตล์มินิมอล warm-tone minimalist · ดูผลงานจริง พร้อมแรงบันดาลใจในการแต่งบ้านได้ที่นี่',
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    ),
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
