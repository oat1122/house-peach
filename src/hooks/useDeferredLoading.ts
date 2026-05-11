'use client';

import { useEffect, useState } from 'react';

/**
 * Shows a skeleton/spinner only if loading lasts longer than `delay` ms.
 * Prevents a flash of skeleton on fast networks where the request resolves
 * before the user can perceive the wait.
 *
 * Usage:
 *   const show = useDeferredLoading(isLoading);
 *   return show ? <Skeleton /> : null;
 *
 * Default 200ms matches the perceptual threshold cited in
 * `.claude/rules/loading-states.md` § "Defer skeleton".
 */
export function useDeferredLoading(isLoading: boolean, delay = 200): boolean {
  const [show, setShow] = useState(false);
  // Track the previous prop value so we can reset `show` during render when
  // the caller flips back to !isLoading — avoids the `set-state-in-effect`
  // lint trip while still keeping state in sync with prop changes.
  const [lastLoading, setLastLoading] = useState(isLoading);
  if (lastLoading !== isLoading) {
    setLastLoading(isLoading);
    if (!isLoading) setShow(false);
  }

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return show;
}
