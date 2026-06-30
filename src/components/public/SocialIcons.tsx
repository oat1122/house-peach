import type { SVGProps } from 'react';

/**
 * Brand social icons as inline SVG. This lucide version dropped the
 * Instagram/Facebook brand glyphs, so we ship our own (paths from the
 * House-Peach design). `currentColor` lets callers theme via text color.
 */

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1Z" />
    </svg>
  );
}

export function LineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.7.2.8.5.1.3.1.7 0 1l-.1.8c0 .3-.2 1 .9.6 1.1-.5 6-3.5 8.2-6C21.4 14.2 22 12.7 22 11c0-4.4-4.5-8-10-8Z" />
    </svg>
  );
}

export const SOCIAL_LINKS = [
  { href: '#', label: 'Instagram', Icon: InstagramIcon },
  { href: '#', label: 'Facebook', Icon: FacebookIcon },
  { href: '#', label: 'Line', Icon: LineIcon },
] as const;
