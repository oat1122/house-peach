'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/**
 * Animate a list of children one after another (60ms apart). Cap at 6 items —
 * beyond that the cumulative delay feels sluggish; use a single `<FadeUp>`
 * wrapping the whole grid instead.
 *
 * Each child must be wrapped in `<StaggerItem>` for the cascade to apply.
 */
export function Stagger({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  /** Render tag — pass `'ul'` when used with `<StaggerItem as="li" />`. */
  as?: 'div' | 'ul' | 'ol' | 'section';
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[Tag] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'section';
}) {
  const MotionTag = motion[Tag] as typeof motion.div;
  return (
    <MotionTag variants={item} className={className}>
      {children}
    </MotionTag>
  );
}
