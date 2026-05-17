'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ListTree } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { HeadingNode } from '@/lib/utils/extractHeadings';
import { SideCard } from '@/components/public/SideCard';

type Props = {
  headings: HeadingNode[];
};

/**
 * Table of Contents with scroll-spy and expand/collapse (desktop only).
 *
 * Desktop: collapsed (200px) → expanded (calc(100vh-8rem)) with CSS transition.
 * Mobile (<lg): always inline with max-height 60vh, no toggle.
 *
 * Active section uses text-ink font-semibold (NOT text-brand-accent —
 * brand-accent fails WCAG 4.5:1 on peach/cream/sage at small sizes).
 */
export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>('');
  const [expanded, setExpanded] = useState(false);
  const bodyId = 'toc-body';

  // Collect all heading ids (flat)
  const allIds = headings.flatMap((h) => [
    h.id,
    ...(h.children?.map((c) => c.id) ?? []),
  ]);

  // Scroll-spy via IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);

  const updateActive = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      // Find the topmost intersecting heading
      const intersecting = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target.id);
      if (intersecting.length > 0) {
        // Pick the first one in document order
        const first = allIds.find((id) => intersecting.includes(id));
        if (first) setActiveId(first);
      }
    },
    [allIds],
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    // `rootMargin` does not accept rem — only px / % (spec). 112px ≈ 7rem
    // at the default 16px root, which matches the sticky-header offset.
    observerRef.current = new IntersectionObserver(updateActive, {
      rootMargin: '-112px 0px -70% 0px',
      threshold: 0,
    });

    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [allIds, updateActive]);

  if (headings.length === 0) return null;

  // Determine if any h2 has the active child
  function isParentActive(h2: HeadingNode): boolean {
    return h2.children?.some((c) => c.id === activeId) ?? false;
  }

  return (
    <aside aria-label="สารบัญบทความ">
      <SideCard
        title="สารบัญ"
        icon={<ListTree size={18} className="text-muted-brand" aria-hidden="true" />}
      >
        {/* Desktop toggle button — hidden on mobile */}
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

        {/* TOC body — collapsed on desktop, always open on mobile */}
        <div
          id={bodyId}
          className={cn(
            'toc-body overflow-hidden overscroll-contain',
            // Mobile: always open max-h-[60vh], scrollable
            'max-h-[60vh] lg:overflow-y-auto',
            // Desktop: controlled by expanded state
            expanded
              ? 'lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto'
              : 'lg:max-h-[200px] lg:overflow-hidden',
          )}
        >
          {/* Gradient fade on desktop collapsed state */}
          {!expanded && (
            <div className="hidden lg:block sticky bottom-0 h-8 bg-gradient-to-t from-brand-card to-transparent pointer-events-none" />
          )}

          <ol className="space-y-1 text-sm">
            {headings.map((h2) => {
              const isActive = activeId === h2.id;
              const hasActiveChild = isParentActive(h2);

              return (
                <li key={h2.id}>
                  <a
                    href={`#${h2.id}`}
                    aria-current={isActive ? 'location' : undefined}
                    className={cn(
                      'flex items-center gap-2 py-1 px-2 rounded transition-colors',
                      'hover:bg-bg2 hover:text-ink',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-card',
                      isActive || hasActiveChild
                        ? 'text-ink font-semibold'
                        : 'text-muted-brand',
                    )}
                  >
                    {/* Bullet dot */}
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0 border',
                        isActive || hasActiveChild
                          ? 'bg-brand-accent border-brand-accent'
                          : 'border-line bg-transparent',
                      )}
                      aria-hidden="true"
                    />
                    <span className="line-clamp-2">{h2.text}</span>
                  </a>

                  {/* H3 children */}
                  {h2.children && h2.children.length > 0 && (
                    <ol className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-line pl-3">
                      {h2.children.map((h3) => {
                        const isH3Active = activeId === h3.id;
                        return (
                          <li key={h3.id}>
                            <a
                              href={`#${h3.id}`}
                              aria-current={isH3Active ? 'location' : undefined}
                              className={cn(
                                'block py-0.5 px-2 rounded text-xs transition-colors',
                                'hover:bg-bg2 hover:text-ink',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2',
                                isH3Active
                                  ? 'text-ink font-semibold bg-bg2'
                                  : 'text-muted-brand',
                              )}
                            >
                              {h3.text}
                            </a>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </SideCard>
    </aside>
  );
}
