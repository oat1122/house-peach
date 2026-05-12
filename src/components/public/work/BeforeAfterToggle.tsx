'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { BeforeAfterImage } from './BeforeAfterSlider';

type Props = {
  before: BeforeAfterImage;
  after: BeforeAfterImage;
  /** Which image to show initially. Default 'after'. */
  initial?: 'before' | 'after';
  className?: string;
};

/**
 * Technique 2 — tap-to-flip. Two `<img>` stacked, opacity transition 300ms.
 * A full-area `<button>` toggles which one is visible (clicks anywhere on
 * the card → flip).
 *
 * Reduced motion is handled globally via the CSS opt-out in globals.css:
 * `transition-duration: 0.01ms` makes the swap snap.
 */
export function BeforeAfterToggle({
  before,
  after,
  initial = 'after',
  className,
}: Props) {
  const [active, setActive] = useState<'before' | 'after'>(initial);

  const aspectStyle = {
    aspectRatio: `${after.width} / ${after.height}`,
  } as React.CSSProperties;

  const labelTH = active === 'after' ? 'หลัง' : 'ก่อน';
  const otherLabel = active === 'after' ? 'ก่อน' : 'หลัง';

  return (
    <button
      type="button"
      onClick={() =>
        setActive((prev) => (prev === 'after' ? 'before' : 'after'))
      }
      aria-pressed={active === 'after'}
      aria-label={`แตะเพื่อสลับภาพก่อน/หลัง — ตอนนี้แสดง${labelTH} แตะแสดง${otherLabel}`}
      className={
        'relative block w-full select-none overflow-hidden rounded-lg bg-muted text-left ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
        (className ?? '')
      }
      style={aspectStyle}
    >
      <Image
        src={after.src}
        alt={after.alt}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className={
          'absolute inset-0 object-cover transition-opacity duration-300 ease-out ' +
          (active === 'after' ? 'opacity-100' : 'opacity-0')
        }
        aria-hidden={active !== 'after'}
        priority
        unoptimized
      />
      <Image
        src={before.src}
        alt={before.alt}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className={
          'absolute inset-0 object-cover transition-opacity duration-300 ease-out ' +
          (active === 'before' ? 'opacity-100' : 'opacity-0')
        }
        aria-hidden={active !== 'before'}
        unoptimized
      />

      <span className="pointer-events-none absolute left-3 top-3 rounded bg-ink/85 px-2 py-0.5 text-[10px] uppercase tracking-wider text-bg">
        {labelTH}
      </span>
      <span className="pointer-events-none absolute bottom-3 right-3 rounded bg-bg/90 px-2 py-1 text-[10px] text-ink">
        แตะเพื่อสลับ
      </span>
    </button>
  );
}
