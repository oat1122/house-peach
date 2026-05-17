import type { ReactNode } from 'react';

type Props = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

/**
 * Generic sidebar card primitive — shared between blog + work detail pages.
 * Renders as a neutral surface with a titled header row. Lives at the public
 * level (not under blog/) so both `/blog/[slug]` and `/works/[slug]` can use
 * it without crossing domain boundaries.
 */
export function SideCard({ title, icon, children }: Props) {
  return (
    <div className="bg-brand-card border border-line rounded-xl p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink mb-4">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
