import { Home, Users } from 'lucide-react';

type Stat = {
  /** Pre-formatted display value, e.g. "12+" or "4.9". */
  value: string;
  label: string;
  icon: 'home' | 'users' | 'star';
};

const STATS: Stat[] = [
  { value: '12+', label: 'ผลงานโปรเจกต์', icon: 'home' },
  { value: '80+', label: 'ลูกค้าไว้วางใจ', icon: 'users' },
  { value: '4.9', label: 'จากรีวิวจริง', icon: 'star' },
];

const ICONS = { home: Home, users: Users } as const;

/** Trust row beneath the hero search card — static marketing figures. */
export function TrustStats() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-brand">
      {STATS.map((stat, i) => {
        const Icon = stat.icon === 'star' ? null : ICONS[stat.icon];
        return (
          <span key={stat.label} className="flex items-center gap-x-6">
            {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-line" />}
            <span className="inline-flex items-center gap-2">
              {Icon ? (
                <Icon className="size-4 text-brand-accent" aria-hidden="true" />
              ) : (
                <span aria-hidden="true" className="tracking-tight text-brand-accent">
                  ★★★★★
                </span>
              )}
              <span>
                <strong className="text-ink">{stat.value}</strong> {stat.label}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
