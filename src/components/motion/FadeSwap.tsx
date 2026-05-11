'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Crossfade swap — when `swapKey` changes, the current child fades out and
 * the new one fades in. Use `mode="wait"` so the panels never overlap.
 *
 * Typical use: gallery hero image when the user clicks a thumbnail.
 */
export function FadeSwap({
  swapKey,
  children,
  className,
}: {
  swapKey: string | number;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={swapKey}
        className={className}
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
