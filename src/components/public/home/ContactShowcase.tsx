import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Search } from 'lucide-react';

import { FadeUp } from '@/components/motion/FadeUp';
import type { WorkCardWork } from '@/components/public/work/WorkCard';
import { resolveRoomTypeLabel } from '@/lib/utils/workLabels';

/** Decorative "globe" panel — pure ornament, hidden from assistive tech. */
function MapDecoration() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square max-w-[480px] overflow-hidden rounded-3xl border border-line bg-bg2"
    >
      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full text-line">
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="200" cy="200" r="150" />
          <circle cx="200" cy="200" r="105" />
          <circle cx="200" cy="200" r="58" />
          <ellipse cx="200" cy="200" rx="150" ry="58" />
          <ellipse cx="200" cy="200" rx="58" ry="150" />
          <line x1="50" y1="200" x2="350" y2="200" />
          <line x1="200" y1="50" x2="200" y2="350" />
        </g>
      </svg>
      <span className="absolute left-[30%] top-[34%] size-3.5 rounded-full bg-brand-accent ring-[6px] ring-brand-accent/20" />
      <span className="absolute left-[62%] top-[46%] size-2.5 rounded-full bg-ink ring-[5px] ring-ink/15" />
      <span className="absolute left-[46%] top-[66%] size-2.5 rounded-full bg-ink ring-[5px] ring-ink/15" />
      <div className="absolute left-1/2 top-[30%] flex -translate-x-1/2 -translate-y-full items-center gap-2 whitespace-nowrap rounded-xl border border-line bg-bg px-3 py-1.5 shadow-[0_14px_28px_-16px_rgba(60,42,24,0.5)]">
        <MapPin className="size-3.5 text-brand-accent" />
        <span className="text-xs font-bold text-ink">
          ทองหล่อ <span className="font-medium text-muted-brand">· 5 ผลงาน</span>
        </span>
      </div>
      <div className="absolute bottom-5 left-1/2 flex w-[min(86%,300px)] -translate-x-1/2 items-center gap-2.5 rounded-xl border border-line bg-bg px-3.5 py-2.5 shadow-[0_18px_36px_-20px_rgba(60,42,24,0.5)]">
        <Search className="size-4 text-muted-brand" />
        <span className="flex-1 text-[13px] text-muted-brand">ค้นหาพื้นที่ที่คุณสนใจ…</span>
        <span className="size-6 rounded-md bg-brand-accent" />
      </div>
    </div>
  );
}

export function ContactShowcase({ works }: { works: WorkCardWork[] }) {
  const rows = works.slice(0, 3);
  if (rows.length === 0) return null;

  return (
    <section
      aria-labelledby="contact-showcase-heading"
      className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24"
    >
      <div className="flex flex-wrap items-center gap-10 md:gap-16">
        <FadeUp className="min-w-[min(100%,340px)] flex-1 basis-80">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
            ติดต่อง่าย จบในที่เดียว
          </span>
          <h2
            id="contact-showcase-heading"
            className="mt-3 font-serif text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl"
          >
            ปรึกษาโปรเจกต์บ้านของคุณได้ที่เดียว
          </h2>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-brand md:text-base">
            เลือกผลงานที่ชอบ แล้วบอกเราว่าอยากได้บ้านแบบไหน — ทีมของเราพร้อมดูแลตั้งแต่ให้คำปรึกษาจนถึงส่งมอบ
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {rows.map((work) => {
              const areaSqmNum = work.areaSqm != null ? parseFloat(String(work.areaSqm)) : null;
              const meta = [
                resolveRoomTypeLabel(work.roomType),
                areaSqmNum != null ? `${areaSqmNum.toFixed(0)} ตร.ม.` : null,
                work.style ?? null,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <Link
                  key={work.slug}
                  href={`/works/${encodeURIComponent(work.slug)}`}
                  className="group flex items-center gap-3.5 rounded-2xl border border-line bg-brand-card p-3 transition-all duration-200 hover:border-brand-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-bg2">
                    {work.coverPath && (
                      <Image
                        src={work.coverPath}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold text-ink">{work.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-brand">{meta}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-brand-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </FadeUp>

        <FadeUp delay={0.1} className="min-w-[min(100%,320px)] flex-1 basis-80">
          <MapDecoration />
        </FadeUp>
      </div>
    </section>
  );
}
