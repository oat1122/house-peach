import Image from 'next/image';

import { FadeUp } from '@/components/motion/FadeUp';

// ponytail: static team — no `team` table exists yet. Swap to a DB query
// (e.g. listTeamMembers) when the data model lands; shape kept flat for that.
const TEAM = [
  { name: 'ฟ้า วรรณา', role: 'Lead Designer', image: '/images/home/showcase-1.svg' },
  { name: 'ภาค ศิริ', role: 'Interior Architect', image: '/images/home/showcase-2.svg' },
  { name: 'มุก ฐิดา', role: 'Stylist', image: '/images/home/showcase-3.svg' },
  { name: 'โอ๊ต ภากร', role: 'Project Manager', image: '/images/home/showcase-4.svg' },
];

export function TeamSection() {
  return (
    <section aria-labelledby="team-heading" className="bg-bg2">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <FadeUp>
          <div className="mx-auto mb-10 max-w-xl text-center md:mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
              ทีมงาน
            </span>
            <h2
              id="team-heading"
              className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink md:text-4xl"
            >
              พบกับทีมออกแบบ
            </h2>
          </div>
        </FadeUp>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {TEAM.map((member) => (
            <div key={member.name} className="group text-center">
              <div className="relative mb-3.5 aspect-square overflow-hidden rounded-2xl bg-bg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                <Image
                  src={member.image}
                  alt={`${member.name} — ${member.role}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 260px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="text-base font-bold text-ink">{member.name}</div>
              <div className="mt-0.5 text-[13px] text-brand-accent">{member.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
