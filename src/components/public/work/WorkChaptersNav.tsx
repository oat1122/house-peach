'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpenText, ChevronDown } from 'lucide-react';

import { SideCard } from '@/components/public/SideCard';
import { cn } from '@/lib/utils';

export type ChapterEntry = {
  /** Heading id rendered by WorkChapterDivider (default `chapter-{number}`). */
  id: string;
  /** Stable numbering — "01" .. "05". */
  number: string;
  /** Thai label, e.g. "โจทย์". */
  th: string;
  /** English label, e.g. "The Brief". */
  en: string;
};

type Props = {
  /** Pre-filtered list — caller drops empty chapters before passing. */
  chapters: ChapterEntry[];
};

/**
 * Editorial "chapters" navigation — parallel to blog's TableOfContents but
 * for a fixed 5-chapter narrative structure (Brief / Before & After / Concept
 * / Process / Details). Empty chapters are filtered out by the caller, not
 * here.
 *
 * Behaviour mirrors TableOfContents:
 *  - Desktop: collapsed (200px) → expanded with ChevronDown toggle
 *  - Mobile: always open, max-h 60vh, scrollable
 *  - Scroll-spy via IntersectionObserver (rootMargin matches sticky-header)
 *  - Active state: text-ink font-semibold (NOT brand-accent text — fails
 *    WCAG 4.5:1 on peach/cream/sage at small sizes; accessibility.md rule)
 */
export function WorkChaptersNav({ chapters }: Props) {
  const [activeId, setActiveId] = useState<string>('');
  const [expanded, setExpanded] = useState(false);
  const bodyId = 'work-chapters-body';

  const ids = chapters.map((c) => c.id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const updateActive = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const intersecting = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target.id);
      if (intersecting.length > 0) {
        const first = ids.find((id) => intersecting.includes(id));
        if (first) setActiveId(first);
      }
    },
    [ids],
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    // `rootMargin` only accepts px / % — 112px ≈ 7rem at the default 16px root,
    // matching the sticky-header offset and the .scroll-mt-28 on dividers.
    observerRef.current = new IntersectionObserver(updateActive, {
      rootMargin: '-112px 0px -70% 0px',
      threshold: 0,
    });

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [ids, updateActive]);

  if (chapters.length === 0) return null;

  return (
    <aside aria-label="บทเรื่องราวในผลงานนี้">
      <SideCard
        title="บทเรื่องราว"
        icon={
          <BookOpenText
            size={18}
            className="text-muted-brand"
            aria-hidden="true"
          />
        }
      >
        {/* Desktop toggle — hidden on mobile */}
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'hidden lg:flex w-full items-center justify-between',
            'text-xs text-muted-brand hover:text-ink transition-colors mb-3',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded',
          )}
        >
          <span>{expanded ? 'ย่อสารบัญ' : 'ขยายสารบัญ'}</span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={cn(
              'transition-transform duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)]',
              'motion-reduce:transition-none',
              expanded && 'rotate-180',
            )}
          />
        </button>

        <div
          id={bodyId}
          className={cn(
            'toc-body overflow-hidden overscroll-contain',
            'max-h-[60vh] lg:overflow-y-auto',
            expanded
              ? 'lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto'
              : 'lg:max-h-[200px] lg:overflow-hidden',
          )}
        >
          {/* Gradient fade on desktop collapsed state — same affordance as TOC */}
          {!expanded && (
            <div className="hidden lg:block sticky bottom-0 h-8 bg-gradient-to-t from-brand-card to-transparent pointer-events-none" />
          )}

          <ol className="space-y-1 text-sm">
            {chapters.map((c) => {
              const isActive = activeId === c.id;
              return (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    aria-current={isActive ? 'location' : undefined}
                    className={cn(
                      'flex items-start gap-2 py-1.5 px-2 rounded transition-colors',
                      'hover:bg-bg2 hover:text-ink',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-card',
                      isActive ? 'text-ink font-semibold' : 'text-muted-brand',
                    )}
                  >
                    {/* Numbered bullet — filled on active, ring on idle */}
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors',
                        isActive
                          ? 'bg-brand-accent border-brand-accent text-bg'
                          : 'border-line bg-transparent text-muted-brand',
                      )}
                      aria-hidden="true"
                    >
                      {c.number}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block leading-snug">{c.th}</span>
                      <span className="block text-[11px] text-muted-brand font-normal">
                        {c.en}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </SideCard>
    </aside>
  );
}
