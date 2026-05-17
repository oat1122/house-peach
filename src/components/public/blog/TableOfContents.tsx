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
 * Desktop collapsed height in px. Mirrors the lg:max-h-[200px] utility below —
 * kept as a constant so the overflow detector + the visual clamp stay in sync.
 */
const COLLAPSED_MAX_DESKTOP_PX = 200;

/**
 * Table of Contents with scroll-spy and expand/collapse.
 *
 * Desktop: collapsed (200px) → expanded (calc(100vh-8rem)) with CSS transition,
 * BUT the toggle button + clamp only appear when the content actually overflows
 * 200px. With a short TOC (2-3 headings) the toggle would be cosmetic, so we
 * hide it and let the natural content height flow — avoids the "I clicked but
 * nothing changed" feel.
 *
 * Mobile (<lg): always inline with max-h-[60vh] scrollable, no toggle.
 *
 * Active section uses text-ink font-semibold (NOT text-brand-accent —
 * brand-accent fails WCAG 4.5:1 on peach/cream/sage at small sizes).
 */
export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>('');
  const [expanded, setExpanded] = useState(false);
  // Mobile default collapsed — saves ~60vh of vertical space before article.
  // Independent from `expanded` (which controls desktop overflow clamp).
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const bodyId = 'toc-body';
  const olRef = useRef<HTMLOListElement | null>(null);

  // Collect all heading ids (flat)
  const allIds = headings.flatMap((h) => [
    h.id,
    ...(h.children?.map((c) => c.id) ?? []),
  ]);

  // ── Scroll-spy via IntersectionObserver ────────────────────────────────────
  const observerRef = useRef<IntersectionObserver | null>(null);

  const updateActive = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const intersecting = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target.id);
      if (intersecting.length > 0) {
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

  // ── Overflow detection — drives whether the toggle is shown ────────────────
  useEffect(() => {
    const el = olRef.current;
    if (!el) return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const measure = () => {
      // Only desktop has a clamped collapsed state. On mobile we render the
      // natural content height (capped by max-h-[60vh] with scroll) — no toggle.
      if (!mql.matches) {
        setOverflows(false);
        return;
      }
      setOverflows(el.scrollHeight > COLLAPSED_MAX_DESKTOP_PX);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    mql.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      mql.removeEventListener('change', measure);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  function isParentActive(h2: HeadingNode): boolean {
    return h2.children?.some((c) => c.id === activeId) ?? false;
  }

  const showToggle = overflows;
  const isClamped = overflows && !expanded;

  return (
    <aside aria-label="สารบัญบทความ">
      <SideCard
        title="สารบัญ"
        icon={<ListTree size={18} className="text-muted-brand" aria-hidden="true" />}
      >
        {/* Mobile toggle — always shown (<lg); collapses TOC by default to save scroll. */}
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls={bodyId}
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            'flex lg:hidden w-full items-center justify-between min-h-[44px]',
            'text-sm text-muted-brand hover:text-ink transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded',
          )}
        >
          <span>{mobileOpen ? 'ย่อสารบัญ' : 'ดูสารบัญ'}</span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={cn(
              'transition-transform duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)]',
              'motion-reduce:transition-none',
              mobileOpen && 'rotate-180',
            )}
          />
        </button>

        {/* Desktop toggle — only when content actually overflows */}
        {showToggle && (
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
        )}

        {/* Relative wrapper so the gradient fade can sit absolutely at the
            visual bottom — sticky-bottom inside an overflow-hidden parent
            silently fails because sticky needs a scrollable ancestor. */}
        <div className="relative">
          <div
            id={bodyId}
            className={cn(
              'toc-body overflow-y-auto overscroll-contain',
              // Mobile: hidden when collapsed; visible when toggled open
              mobileOpen ? 'block mt-3 max-h-[60vh]' : 'hidden',
              // Desktop: always shown, clamp only when content overflows AND not expanded
              'lg:block lg:mt-0',
              isClamped ? 'lg:max-h-[200px]' : 'lg:max-h-[calc(100vh-8rem)]',
            )}
          >
            <ol ref={olRef} className="space-y-1 text-sm">
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

          {/* Gradient fade — desktop only, only while clamped. Absolutely
              positioned outside the scrolled area so it always overlays the
              real visual bottom. */}
          {isClamped && (
            <div
              aria-hidden="true"
              className="hidden lg:block pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-brand-card to-transparent rounded-b-xl"
            />
          )}
        </div>
      </SideCard>
    </aside>
  );
}
