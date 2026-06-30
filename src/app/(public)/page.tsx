import type { Metadata } from 'next';

import { AboutPanel } from '@/components/public/home/AboutPanel';
import { BlogTeaser } from '@/components/public/home/BlogTeaser';
import { ContactShowcase } from '@/components/public/home/ContactShowcase';
import { CtaBand } from '@/components/public/home/CtaBand';
import { HeroSection } from '@/components/public/home/HeroSection';
import { RoomTypeCategories } from '@/components/public/home/RoomTypeCategories';
import { TeamSection } from '@/components/public/home/TeamSection';
import { WorksShowcase } from '@/components/public/home/WorksShowcase';
import type { WorkCardWork } from '@/components/public/work/WorkCard';
import { env } from '@/env';
import { listRecentPosts } from '@/lib/services/post';
import {
  listHomeFeed,
  getPublishedWorkCountsByRoomType,
  listDistinctWorkStyles,
} from '@/lib/services/work';

// B4 — ISR revalidate per ARCHITECTURE §8.1
export const revalidate = 300;

export const metadata: Metadata = {
  // M2 — brand-last per .claude/rules/seo.md § Title format
  title: 'studio ตกแต่งบ้านสไตล์ warm-tone minimalist — house-peach',
  description:
    'สตูดิโอตกแต่งบ้านสไตล์ warm-tone minimalist · ดูแลครบตั้งแต่ concept จนถึงบ้านที่พร้อมอยู่จริง — ดูผลงานล่าสุดและบทความตกแต่งบ้าน',
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

export default async function HomePage() {
  const [{ discover, recent }, roomCounts, distinctStyles, recentPosts] = await Promise.all([
    listHomeFeed(),
    getPublishedWorkCountsByRoomType(),
    listDistinctWorkStyles(),
    listRecentPosts({ limit: 3 }),
  ]);

  const styleChoices = distinctStyles.filter((s): s is string => s != null);

  // Curated discover first, then recent — dedup by slug. WorkPublicListItem is a
  // superset of WorkCardWork, so it flows straight into the card components.
  const bySlug = new Map<string, WorkCardWork>();
  for (const work of [...discover, ...recent]) {
    if (!bySlug.has(work.slug)) bySlug.set(work.slug, work);
  }
  const showcaseWorks = Array.from(bySlug.values()).slice(0, 9);

  return (
    <>
      <HeroSection
        imagePath="/images/home/hero.svg"
        imageAlt="ห้องนั่งเล่นสไตล์ warm-tone minimalist แสนอบอุ่น"
        styleChoices={styleChoices}
      />
      <RoomTypeCategories counts={roomCounts} />
      <AboutPanel
        imagePath="/images/home/about.svg"
        imageAlt="สตูดิโอ house-peach ระหว่างโปรเจกต์ตกแต่งบ้าน"
        secondaryImagePath="/images/home/showcase-1.svg"
        secondaryImageAlt="รายละเอียดงานตกแต่งของ house-peach"
      />
      <WorksShowcase works={showcaseWorks} />
      <ContactShowcase works={showcaseWorks} />
      <TeamSection />
      <BlogTeaser posts={recentPosts} />
      <CtaBand />
    </>
  );
}
