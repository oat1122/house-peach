import { FadeUp } from '@/components/motion/FadeUp';

type Stat = {
  value: string;
  label: string;
  labelEn: string;
};

type Props = {
  stats: Stat[];
};

export function StatsCard({ stats }: Props) {
  return (
    <FadeUp delay={0.15}>
      <div className="bg-brand-card/96 backdrop-blur-md rounded-xl p-5 border border-line shadow-sm">
        {/* Header — P1: lang attributes for bilingual eyebrow */}
        <p className="text-[10px] uppercase tracking-widest text-muted-brand">
          <span lang="th">เกี่ยวกับเรา</span>
          <span aria-hidden="true"> · </span>
          <span lang="en">Who we are</span>
        </p>
        <p className="mt-1 text-sm text-muted-brand leading-snug">
          สตูดิโอตกแต่งบ้านแนว warm-tone minimalist กรุงเทพฯ
        </p>

        {/* Stats grid — P3: <dl>/<dt>/<dd> for term/definition semantics.
            flex-col-reverse keeps value visually above label while <dt> stays
            first in DOM order (correct semantics). */}
        <dl className="mt-4 grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse">
              <dt className="text-[10px] uppercase tracking-widest text-muted-brand">
                <span lang="th">{stat.label}</span>
                {stat.labelEn && (
                  <>
                    {' '}
                    <span lang="en" aria-hidden="true">/ {stat.labelEn}</span>
                  </>
                )}
              </dt>
              <dd className="text-2xl font-bold text-ink leading-none">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </FadeUp>
  );
}
