import type { Metadata } from 'next';

import { AboutPanel } from '@/components/public/home/AboutPanel';
import { DiscoverSection } from '@/components/public/home/DiscoverSection';
import { HeroSection } from '@/components/public/home/HeroSection';
import { RecentWorksStrip } from '@/components/public/home/RecentWorksStrip';
import { StatsCard } from '@/components/public/home/StatsCard';
import type { WorkCardWork } from '@/components/public/work/WorkCard';
import { env } from '@/env';
import { labels } from '@/lib/i18n/labels';

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

// TODO(phase-2): replace with listFeaturedWorks() + listRecentWorks() from services
const dummyFeaturedWork: WorkCardWork = {
  slug: 'dummy-1',
  title: 'ห้องนั่งเล่น Japandi กรุงเทพฯ',
  summary:
    'ห้องนั่งเล่นสไตล์ Japandi ที่ผสมผสานความเรียบง่ายแบบญี่ปุ่นกับความอบอุ่นของสแกนดิเนเวีย วัสดุธรรมชาติและแสงธรรมชาติเป็นหัวใจของงานออกแบบ',
  roomType: 'living',
  style: 'Japandi',
  location: 'กรุงเทพฯ',
  yearCompleted: 2024,
  areaSqm: '45',
  budgetRange: '300k_700k',
  durationDays: 60,
  coverPath: '/images/home/featured.svg',
  coverAlt: 'ห้องนั่งเล่น Japandi — ห้องนั่งเล่น, สไตล์ Japandi',
};

const dummySmallWorks: WorkCardWork[] = [
  {
    slug: 'dummy-2',
    title: 'ห้องนอน Warm Modern',
    summary: 'ห้องนอนสไตล์ warm modern ที่ให้ความรู้สึกสบายและอบอุ่น',
    roomType: 'bedroom',
    style: 'Warm Modern',
    location: 'นนทบุรี',
    yearCompleted: 2024,
    areaSqm: '28',
    budgetRange: '100k_300k',
    durationDays: 30,
    coverPath: '/images/home/small-1.svg',
    coverAlt: 'ห้องนอน Warm Modern — ห้องนอน, สไตล์ Warm Modern',
  },
  {
    slug: 'dummy-3',
    title: 'ห้องครัว Minimal',
    summary: 'ห้องครัวสไตล์ minimal ที่สะอาดตาและใช้งานได้จริง',
    roomType: 'kitchen',
    style: 'Minimal',
    location: 'สมุทรปราการ',
    yearCompleted: 2023,
    areaSqm: '15',
    budgetRange: '100k_300k',
    durationDays: 21,
    coverPath: '/images/home/small-2.svg',
    coverAlt: 'ห้องครัว Minimal — ห้องครัว, สไตล์ Minimal',
  },
  {
    slug: 'dummy-4',
    title: 'บ้านทั้งหลัง Scandinavian',
    summary: 'รีโนเวทบ้านทั้งหลังในสไตล์ Scandinavian เน้นวัสดุธรรมชาติและแสงสว่าง',
    roomType: 'full_house',
    style: 'Scandinavian',
    location: 'กรุงเทพฯ',
    yearCompleted: 2023,
    areaSqm: '120',
    budgetRange: '700k_1.5m',
    durationDays: 90,
    coverPath: '/images/home/small-wide.svg',
    coverAlt: 'บ้านทั้งหลัง Scandinavian — ทั้งบ้าน, สไตล์ Scandinavian',
  },
];

const dummyRecentWorks: WorkCardWork[] = [
  {
    slug: 'dummy-5',
    title: 'ห้องทำงาน Japandi',
    summary: 'ห้องทำงานที่บ้านสไตล์ Japandi เน้นความสงบและสมาธิ',
    roomType: 'office',
    style: 'Japandi',
    location: 'กรุงเทพฯ',
    yearCompleted: 2025,
    areaSqm: '18',
    budgetRange: '100k_300k',
    durationDays: 25,
    coverPath: '/images/home/showcase-1.svg',
    coverAlt: 'ห้องทำงาน Japandi — ห้องทำงาน, สไตล์ Japandi',
  },
  {
    slug: 'dummy-6',
    title: 'ห้องนอนเด็ก Playful Warm',
    summary: 'ห้องนอนเด็กที่อบอุ่นและน่ารัก เน้นสีธรรมชาติที่ไม่ฉูดฉาด',
    roomType: 'bedroom',
    style: 'Playful Warm',
    location: 'ปทุมธานี',
    yearCompleted: 2025,
    areaSqm: '20',
    budgetRange: '100k_300k',
    durationDays: 28,
    coverPath: '/images/home/showcase-2.svg',
    coverAlt: 'ห้องนอนเด็ก Playful Warm — ห้องนอน, สไตล์ Playful Warm',
  },
  {
    slug: 'dummy-7',
    title: 'ห้องน้ำ Zen Minimal',
    summary: 'ห้องน้ำสไตล์ Zen ที่ให้ความรู้สึกสปาในบ้าน',
    roomType: 'bathroom',
    style: 'Zen Minimal',
    location: 'กรุงเทพฯ',
    yearCompleted: 2025,
    areaSqm: '8',
    budgetRange: '100k_300k',
    durationDays: 14,
    coverPath: '/images/home/showcase-3.svg',
    coverAlt: 'ห้องน้ำ Zen Minimal — ห้องน้ำ, สไตล์ Zen Minimal',
  },
  {
    slug: 'dummy-8',
    title: 'พื้นที่กลางแจ้ง Natural',
    summary: 'ระเบียงและพื้นที่นอกบ้านที่เชื่อมต่อธรรมชาติเข้าสู่การใช้ชีวิต',
    roomType: 'outdoor',
    style: 'Natural',
    location: 'เชียงใหม่',
    yearCompleted: 2024,
    areaSqm: '30',
    budgetRange: '100k_300k',
    durationDays: 20,
    coverPath: '/images/home/showcase-4.svg',
    coverAlt: 'พื้นที่กลางแจ้ง Natural — พื้นที่ภายนอก, สไตล์ Natural',
  },
];

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

export default function HomePage() {
  return (
    <>
      {/*
       * On mobile, StatsCard renders below the hero image in document flow.
       * On desktop, it is absolutely positioned inside the hero via statsSlot.
       */}
      <HeroSection
        imagePath="/images/home/hero.svg"
        imageAlt="ห้องนั่งเล่นสไตล์ warm-tone minimalist แสงธรรมชาติอ่อนโยน"
        statsSlot={<StatsCard stats={homeStats} />}
      />
      <DiscoverSection
        featuredWork={dummyFeaturedWork}
        smallWorks={dummySmallWorks}
      />
      <AboutPanel
        imagePath="/images/home/about.svg"
        imageAlt="สตูดิโอ house-peach ทีมงานในระหว่างโปรเจกต์ตกแต่งบ้าน"
      />
      <RecentWorksStrip works={dummyRecentWorks} />
    </>
  );
}
