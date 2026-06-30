import Image from 'next/image';
import Link from 'next/link';
import { Ear, FileText, Wrench, ShieldCheck, Phone } from 'lucide-react';

import { FadeUp } from '@/components/motion/FadeUp';

type Props = {
  imagePath: string;
  imageAlt: string;
  /** Smaller overlapping image (bottom-left). */
  secondaryImagePath: string;
  secondaryImageAlt: string;
};

const FEATURES = [
  { icon: Ear, title: 'รับฟังก่อนเสมอ', desc: 'เข้าใจไลฟ์สไตล์และความต้องการจริง' },
  { icon: FileText, title: 'เสนอราคาชัดเจน', desc: 'ไม่มีค่าใช้จ่ายแอบแฝง' },
  { icon: Wrench, title: 'คุมงานเอง', desc: 'ทีมช่างฝีมือดี ดูแลทุกขั้นตอน' },
  { icon: ShieldCheck, title: 'รับประกันงาน', desc: 'ดูแลต่อเนื่องหลังส่งมอบ' },
];

export function AboutPanel({ imagePath, imageAlt, secondaryImagePath, secondaryImageAlt }: Props) {
  return (
    <section
      aria-labelledby="about-heading"
      className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24"
    >
      <div className="flex flex-wrap items-center gap-10 md:gap-16">
        {/* Layered images */}
        <FadeUp className="relative min-w-[min(100%,340px)] flex-1 basis-80 pb-12 pl-2">
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-bg2 shadow-[0_36px_70px_-40px_rgba(60,42,24,0.4)]">
            <Image
              src={imagePath}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1280px) calc(50vw - 48px), 540px"
              className="object-cover"
              unoptimized
            />
          </div>
          {/* Overlapping smaller image */}
          <div className="absolute -left-1 bottom-0 aspect-square w-2/5 max-w-[200px] overflow-hidden rounded-2xl border-4 border-bg bg-bg2 shadow-[0_22px_44px_-22px_rgba(60,42,24,0.5)]">
            <Image
              src={secondaryImagePath}
              alt={secondaryImageAlt}
              fill
              sizes="200px"
              className="object-cover"
              unoptimized
            />
          </div>
          {/* Floating clients badge */}
          <div className="absolute right-2 top-4 flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-3 shadow-[0_18px_36px_-20px_rgba(60,42,24,0.4)]">
            <span aria-hidden="true" className="flex">
              <span className="size-7 rounded-full border-2 border-bg bg-brand-accent/40" />
              <span className="-ml-2.5 size-7 rounded-full border-2 border-bg bg-brand-accent/25" />
              <span className="-ml-2.5 size-7 rounded-full border-2 border-bg bg-brand-accent/55" />
            </span>
            <span className="text-xs font-semibold leading-tight text-ink">
              ลูกค้า 80+ ราย
              <br />
              <span className="font-medium text-muted-brand">ทั่วกรุงเทพฯ</span>
            </span>
          </div>
        </FadeUp>

        {/* Text + features */}
        <FadeUp delay={0.1} className="min-w-[min(100%,340px)] flex-1 basis-96">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent">
            <span lang="th">เกี่ยวกับเรา</span>
            <span aria-hidden="true"> · </span>
            <span lang="en">About us</span>
          </p>
          <h2
            id="about-heading"
            className="mt-3 font-serif text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl"
          >
            สตูดิโอออกแบบภายในที่ใส่ใจทุกดีเทล
          </h2>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-brand md:text-base">
            เราเชื่อว่าบ้านที่ดีควรรู้สึกอบอุ่นไม่ว่าจะขนาดเท่าไหร่ — ทำงานด้วยความใส่ใจตั้งแต่รับฟัง ออกแบบ
            จนถึงคุมงานและส่งมอบบ้านที่พร้อมอยู่จริง
          </p>

          <div className="mt-7 grid gap-x-7 gap-y-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3.5">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[15px] font-bold text-ink">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted-brand">{desc}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href="/works"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-accent px-6 font-semibold text-bg transition-colors hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              ดูผลงานทั้งหมด <span aria-hidden="true">→</span>
            </Link>
            <a
              href="tel:021234567"
              className="inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
                <Phone className="size-4" aria-hidden="true" />
              </span>
              <span className="text-xs leading-tight text-muted-brand">
                โทรปรึกษาได้เลย
                <br />
                <strong className="text-[15px] text-ink">02-123-4567</strong>
              </span>
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
