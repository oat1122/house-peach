'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * Wraps `next-themes` with house-peach defaults:
 *   - attribute="class" matches globals.css `.dark { ... }` selector
 *   - defaultTheme="system" honors the OS preference
 *   - `disableTransitionOnChange` avoids the flash when toggling
 *
 * Mounted once in the root layout — both public and admin trees share it.
 */
export function ThemeProvider(
  props: Omit<ComponentProps<typeof NextThemesProvider>, 'attribute'>,
) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    />
  );
}
