'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Returns `true` after hydration, `false` during SSR. Used to gate theme-aware
 * ARIA props (aria-label / aria-pressed) so the server-rendered HTML matches
 * the client's first render (the server doesn't know the user's stored theme).
 *
 * useSyncExternalStore with a no-op subscriber is the lint-compliant
 * equivalent of `useEffect(() => setMounted(true), [])`.
 */
function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * Compact light/dark toggle. Renders both icons stacked and animates them
 * via Tailwind so the swap stays inside the motion budget (transform only,
 * no layout shift). The actual theme is system | light | dark — clicking
 * cycles between explicit light and dark, treating "system" as light.
 *
 * `mounted` gate avoids the next-themes hydration mismatch: the server has
 * no access to the user's stored theme, so theme-dependent props (aria-label,
 * aria-pressed) are only emitted after the client mounts and resolves theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const isDark = mounted && resolvedTheme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={
        mounted
          ? isDark
            ? 'สลับเป็นโหมดสว่าง'
            : 'สลับเป็นโหมดมืด'
          : 'สลับธีม'
      }
      aria-pressed={mounted ? isDark : undefined}
      suppressHydrationWarning
      className={className}
    >
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
