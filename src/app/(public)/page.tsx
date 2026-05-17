import type { Metadata } from 'next';

import { AboutPanel } from '@/components/public/home/AboutPanel';
import { DiscoverSection } from '@/components/public/home/DiscoverSection';
import { HeroSection } from '@/components/public/home/HeroSection';
import { RecentWorksStrip } from '@/components/public/home/RecentWorksStrip';
import { StatsCard } from '@/components/public/home/StatsCard';
import { env } from '@/env';
import { labels } from '@/lib/i18n/labels';
import { listHomeFeed } from '@/lib/services/work';

// B4 — ISR revalidate per ARCHITECTURE §8.1
export const revalidate = 300;

export const metadata: Metadata = {
  // M2 — brand-last per .claude/rules/seo.md § Title format
  title: 'studio ตกแต่งบ้านสไตล์ warm-tone minimalist — house-peach',
  description:
    'สตูดิโอตกแต่งบ้านสไตล์ warm-tone minimalist · ดูผลงานล่าสุดและบทความเกี่ยวกับการตกแต่งที่อบอุ่นและมีรสนิยม',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'house-peach',
    description: 'studio ตกแต่งบ้านสไตล์ warm-tone minimalist',
    type: 'website',
    // B1 — absolute URL required for OG images
    images: [`${env.NEXT_PUBLIC_SITE_URL}/images/home/hero.svg`],
  },
  // M1 — Twitter card
  twitter: { card: 'summary_large_image' },
};

const homeStats = [
  {
    value: labels.homeStat1Value.th,
    label: labels.homeStat1Label.th,
    labelEn: labels.homeStat1Label.en,
  },
  {
    value: labels.homeStat2Value.th,
    label: labels.homeStat2Label.th,
    labelEn: labels.homeStat2Label.en,
  },
  {
    value: labels.homeStat3Value.th,
    label: labels.homeStat3Label.th,
    labelEn: labels.homeStat3Label.en,
  },
];

export default async function HomePage() {
  // Home feed: admin opts each work into a section via the work edit form
  // (works.home_section enum). listHomeFeed returns published works grouped:
  //   - discover (max 4) → DiscoverSection grid: items[0] featured + [1..3] small
  //   - recent   (max 12) → RecentWorksStrip chip-filtered 4-card pool
  // Cached with tag 'works'; bumpWorkById() also revalidatePath('/') so admin
  // edits propagate to home immediately, not after the 60s ISR window.
  const { discover, recent } = await listHomeFeed();
  const featuredWork = discover[0];
  const smallWorks = discover.slice(1, 4);
  const recentPool = recent;

  return (
    <>
      {/* Mobile: StatsCard stacks below hero. Desktop: absolute bottom-right inside hero. */}
      <HeroSection
        imagePath="/images/home/hero.svg"
        imageAlt="ห้องนั่งเล่นสไตล์ warm-tone minimalist แสงธรรมชาติอ่อนโยน"
        statsSlot={<StatsCard stats={homeStats} />}
      />
      {featuredWork && (
        <DiscoverSection
          featuredWork={featuredWork}
          smallWorks={smallWorks}
        />
      )}
      <AboutPanel
        imagePath="/images/home/about.svg"
        imageAlt="สตูดิโอ house-peach ทีมงานในระหว่างโปรเจกต์ตกแต่งบ้าน"
      />
      <RecentWorksStrip works={recentPool} />
    </>
  );
}
