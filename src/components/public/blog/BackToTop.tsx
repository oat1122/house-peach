'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { useScroll, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

/**
 * Back-to-top FAB. Visible when scrollYProgress > 0.15 (i.e. ~15% of page).
 * Uses imperative subscription to avoid re-renders on every scroll tick.
 * Reduced-motion: instant show/hide without opacity/scale animation.
 */
export function BackToTop() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return scrollYProgress.on('change', (v) => setVisible(v > 0.15));
  }, [scrollYProgress]);

  function handleClick() {
    window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="กลับขึ้นด้านบน"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        'fixed z-50 size-11 rounded-full bg-ink text-bg shadow-md',
        // Mobile: standard bottom + iOS safe-area gutter (no bottom tab bar in Phase 5)
        // Desktop: standard position
        'bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6',
        'flex items-center justify-center',
        'hover:bg-brand-accent transition-colors motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'active:scale-95',
        reduce
          ? visible
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
          : cn(
              'transition-opacity transition-transform duration-200 ease-out',
              visible
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-90 pointer-events-none',
            ),
      )}
    >
      <ChevronUp size={20} aria-hidden="true" />
    </button>
  );
}
