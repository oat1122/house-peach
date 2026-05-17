import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ShareRow } from './ShareRow';

type Props = {
  url: string;
  title: string;
};

/**
 * Post footer: share row + back link to the blog listing.
 * ShareRow is a client component imported here into an RSC container.
 */
export function PostFooter({ url, title }: Props) {
  return (
    <footer className="mt-14 pt-8 border-t border-line space-y-6">
      <ShareRow url={url} title={title} />

      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-muted-brand hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        กลับบทความทั้งหมด
      </Link>
    </footer>
  );
}
