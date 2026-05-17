'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

/**
 * Thin progress bar fixed to the top of the viewport that indicates how far
 * the user has scrolled through the page. Purely decorative — `aria-hidden`.
 *
 * Reduced-motion: renders a static bar at 40% opacity so the indicator is
 * still visible without animation.
 */
export function ReadingProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (reduce) {
    return (
      <div
        className="fixed top-0 left-0 w-full h-[3px] z-50 bg-brand-accent opacity-40"
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.div
      className="fixed top-0 left-0 w-full h-[3px] z-50 origin-left bg-brand-accent"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}
