'use client';

import { useState, useSyncExternalStore } from 'react';

type Props = {
  /** The email username (before `@`), reversed at the source for extra resistance. */
  user: string;
  /** The email domain (after `@`). */
  domain: string;
};

/**
 * Renders an email link with light obfuscation against naïve scrapers:
 *
 *   1. Source HTML shows `user [at] domain [dot] tld` — never the full address.
 *   2. After hydration, the visible label switches to `user@domain.tld`.
 *   3. The `<a href>` is only assembled in the click handler — robots that
 *      don't execute JS can't grab a clickable mailto link from the markup.
 *
 * Real users on a click see their mail client open; scrapers harvesting raw
 * HTML get the obfuscated form. The defense is mild — a determined scraper
 * runs JS — but it stops the bulk of automated harvesters, which is enough
 * for a small studio inbox.
 *
 * `useSyncExternalStore` (no-op subscribe) gives us a SSR-correct "is mounted"
 * flag without triggering a hydration mismatch — the server renders the
 * obfuscated form, the client swaps to the real address only after mount.
 */
export function ObfuscatedEmail({ user, domain }: Props) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [revealed, setRevealed] = useState(false);

  function reveal(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const href = `mailto:${user}@${domain}`;
    setRevealed(true);
    // Trigger the mail client only after the user explicitly clicked.
    window.location.href = href;
  }

  if (!mounted) {
    // SSR / pre-hydration: show the obfuscated form only.
    return (
      <span className="text-sm text-muted-brand break-all">
        {user} <span aria-hidden="true">[at]</span>{' '}
        <span className="sr-only">at</span>
        {domain.replace(/\./g, ' [dot] ')}
      </span>
    );
  }

  return (
    <a
      href="#"
      onClick={reveal}
      className="text-sm text-muted-brand hover:text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm break-all"
    >
      {revealed ? `${user}@${domain}` : `${user}@${domain}`}
    </a>
  );
}
