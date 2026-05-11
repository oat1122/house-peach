'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Fade + 8px upward translate, triggered when the element scrolls into view
 * (once). Switches to instant render when the user requests reduced motion.
 *
 * Pair with `Stagger` only when you have ≤ 6 children; for larger grids wrap
 * the whole grid in a single `FadeUp` instead — staggering > 6 items pushes
 * past the 0.5s motion budget.
 */
type Props = {
  children: ReactNode;
  /** Seconds to delay before the animation starts. */
  delay?: number;
  className?: string;
  /** Animate on mount instead of waiting for scroll-into-view. */
  immediate?: boolean;
};

export function FadeUp({ children, delay = 0, className, immediate = false }: Props) {
  const reduce = useReducedMotion();
  const initial = reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 };
  const target = { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={immediate ? target : undefined}
      whileInView={immediate ? undefined : target}
      viewport={immediate ? undefined : { once: true, margin: '-10% 0px' }}
      transition={
        reduce ? { duration: 0 } : { duration: 0.35, delay, ease: 'easeOut' }
      }
    >
      {children}
    </motion.div>
  );
}
