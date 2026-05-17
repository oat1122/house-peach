'use client';

import { useState, useSyncExternalStore } from 'react';
import { Move, Eye } from 'lucide-react';

import { useIsMobile } from '@/hooks/use-mobile';

import {
  BeforeAfterSlider,
  type BeforeAfterImage,
} from './BeforeAfterSlider';
import { BeforeAfterToggle } from './BeforeAfterToggle';

type Mode = 'slider' | 'toggle';

type Props = {
  before: BeforeAfterImage;
  after: BeforeAfterImage;
  /** Caption shown under the card (e.g. work_images.caption). */
  caption?: string | null;
  /** Forces a mode regardless of viewport. Default = 'auto'. */
  mode?: Mode | 'auto';
  className?: string;
  /**
   * Pass `true` only for the LCP-adjacent chorus pair.
   * Propagated to the inner Slider/Toggle so only that image gets `priority`.
   */
  priority?: boolean;
};

/**
 * Wrapper that picks `<BeforeAfterSlider>` (desktop, drag) vs
 * `<BeforeAfterToggle>` (mobile, tap) by viewport, with a small corner
 * button that lets the user override.
 *
 * Reduced motion → forces toggle (slider is motion-driven UX).
 */
export function BeforeAfterCard({
  before,
  after,
  caption,
  mode = 'auto',
  className,
  priority = false,
}: Props) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotionGate();
  const [userMode, setUserMode] = useState<Mode | null>(null);

  const autoPick: Mode = isMobile ? 'toggle' : 'slider';
  const requested: Mode = mode === 'auto' ? autoPick : mode;
  const effective: Mode = reduce ? 'toggle' : (userMode ?? requested);

  const otherMode: Mode = effective === 'slider' ? 'toggle' : 'slider';
  const otherLabel = otherMode === 'slider' ? 'โหมดเลื่อน' : 'โหมดสลับ';

  return (
    <figure className={'space-y-2 ' + (className ?? '')}>
      <div className="relative">
        {effective === 'slider' ? (
          <BeforeAfterSlider before={before} after={after} priority={priority} />
        ) : (
          <BeforeAfterToggle before={before} after={after} priority={priority} />
        )}

        {!reduce && (
          <button
            type="button"
            onClick={() => setUserMode(otherMode)}
            aria-label={`เปลี่ยนเป็น${otherLabel}`}
            title={`เปลี่ยนเป็น${otherLabel}`}
            className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-bg/90 px-2.5 py-1 text-[10px] font-medium text-ink shadow-sm ring-1 ring-ink/10 hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {otherMode === 'slider' ? (
              <Move className="size-3" aria-hidden />
            ) : (
              <Eye className="size-3" aria-hidden />
            )}
            <span>{otherLabel}</span>
          </button>
        )}
      </div>
      {caption && (
        <figcaption className="text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * `prefers-reduced-motion: reduce` as a reactive boolean, SSR-safe.
 */
function useReducedMotionGate(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia('(prefers-reduced-motion: reduce)');
      m.addEventListener('change', onChange);
      return () => m.removeEventListener('change', onChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}
