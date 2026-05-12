'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

export type BeforeAfterImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type Props = {
  before: BeforeAfterImage;
  after: BeforeAfterImage;
  /** Initial divider position 0-100, default 50. */
  initial?: number;
  className?: string;
};

/**
 * Technique 1 — drag-divider slider. Bottom layer = `after` (revealed by
 * default); top layer = `before` clipped by a `clip-path: inset(...)` whose
 * right inset is controlled by pointer / keyboard state.
 *
 * Accessibility (WAI-ARIA slider pattern):
 *   - container has `role="slider"` + value range / value-now / value-text
 *   - keyboard: Arrow ±2, Shift+Arrow ±10, Home=0, End=100
 *   - both real `<img>` retain alt for assistive tech; handle is aria-hidden
 *
 * Performance: animate `transform` (handle) + `clip-path` (before layer) —
 * GPU-accelerated, no layout reflow.
 */
export function BeforeAfterSlider({
  before,
  after,
  initial = 50,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pct, setPct] = useState(clamp(initial, 0, 100));
  const [dragging, setDragging] = useState(false);

  const aspectStyle = {
    aspectRatio: `${after.width} / ${after.height}`,
  } as React.CSSProperties;

  const update = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPct(clamp(next, 0, 100));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    update(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    update(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next = pct;
    const big = e.shiftKey ? 10 : 2;
    switch (e.key) {
      case 'ArrowLeft':
        next = pct - big;
        break;
      case 'ArrowRight':
        next = pct + big;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 100;
        break;
      default:
        return;
    }
    e.preventDefault();
    setPct(clamp(next, 0, 100));
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label="เปรียบเทียบภาพก่อน/หลัง"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-valuetext={`${Math.round(pct)}% เผยภาพหลังแต่ง`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={
        'relative w-full select-none overflow-hidden rounded-lg bg-muted ' +
        (dragging ? 'cursor-grabbing ' : 'cursor-grab ') +
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
        className="pointer-events-none object-cover"
        priority
        unoptimized
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
      >
        <Image
          src={before.src}
          alt={before.alt}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Badges */}
      <span className="pointer-events-none absolute left-3 top-3 rounded bg-ink/85 px-2 py-0.5 text-[10px] uppercase tracking-wider text-bg">
        ก่อน
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded bg-ink/85 px-2 py-0.5 text-[10px] uppercase tracking-wider text-bg">
        หลัง
      </span>

      {/* Handle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-px bg-white/85 shadow-[0_0_10px_rgba(0,0,0,0.35)]"
        style={{ left: `${pct}%`, transform: 'translateX(-0.5px)' }}
      >
        <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-foreground shadow-md ring-1 ring-foreground/10">
          <ChevronArrows />
        </span>
      </div>
    </div>
  );
}

function ChevronArrows() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 4L2 8l4 4M10 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
