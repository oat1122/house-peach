import Image from 'next/image';
import Link from 'next/link';

import { FadeUp } from '@/components/motion/FadeUp';
import { Button } from '@/components/ui/button';

type Props = {
  imagePath: string;
  imageAlt: string;
};

export function AboutPanel({ imagePath, imageAlt }: Props) {
  return (
    <section
      aria-labelledby="about-heading"
      className="bg-bg2"
    >
      <FadeUp>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Image column */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-bg">
              <Image
                src={imagePath}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1280px) calc(50vw - 48px), 560px"
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Text column */}
            <div>
              {/* P1 — lang attributes for bilingual eyebrow */}
              <p className="text-xs uppercase tracking-widest text-muted-brand">
                <span lang="th">เกี่ยวกับเรา</span>
                <span aria-hidden="true"> · </span>
                <span lang="en">About us</span>
              </p>
              <h2
                id="about-heading"
                className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink mt-2"
              >
                สตูดิโอตกแต่งบ้านสไตล์ warm-tone
              </h2>

              <div className="mt-4 space-y-4 text-sm md:text-base text-muted-brand leading-relaxed">
                <p>เราเชื่อว่าบ้านที่ดีควรรู้สึกอบอุ่น ไม่ว่าจะขนาดเท่าไหร่</p>
                <p>ทำงานด้วยความใส่ใจในรายละเอียด ตั้งแต่ concept จนจบโปรเจกต์</p>
              </div>

              <div className="mt-8">
                <Button
                  render={<Link href="/contact" />}
                  nativeButton={false}
                  className="bg-ink hover:bg-ink/85 text-bg rounded-md px-5 py-3 border-0 focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                >
                  เริ่มโปรเจกต์
                </Button>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
