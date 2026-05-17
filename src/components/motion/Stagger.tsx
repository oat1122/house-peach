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
  tabIndex,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  /** Render tag — pass `'ul'` when used with `<StaggerItem as="li" />`. */
  as?: 'div' | 'ul' | 'ol' | 'section';
  /** Makes a scroll container keyboard-reachable (e.g. overflow-x-auto `<ol>`). */
  tabIndex?: number;
  'aria-label'?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <Tag className={className} tabIndex={tabIndex} aria-label={ariaLabel}>
        {children}
      </Tag>
    );
  }

  const MotionTag = motion[Tag] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
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
  const reduce = useReducedMotion();
  // Mirror the Stagger parent: skip motion entirely when reduced motion is on.
  // Avoids a flicker where the item briefly starts hidden (opacity:0, y:8)
  // before the parent's short-circuit kicks in.
  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[Tag] as typeof motion.div;
  return (
    <MotionTag variants={item} className={className}>
      {children}
    </MotionTag>
  );
}
