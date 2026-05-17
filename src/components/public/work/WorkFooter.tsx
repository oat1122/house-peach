import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ShareRow } from '@/components/public/blog/ShareRow';

type Props = {
  /** Absolute URL of the work — built server-side from env.NEXT_PUBLIC_SITE_URL. */
  url: string;
  title: string;
};

/**
 * Work footer: share row + back link to the works listing.
 * Mirrors PostFooter exactly — only the destination URL/label differs.
 * ShareRow is reused as-is from the blog folder (URL + title are generic).
 */
export function WorkFooter({ url, title }: Props) {
  return (
    <footer className="mt-14 pt-8 border-t border-line space-y-6">
      <ShareRow url={url} title={title} />

      <Link
        href="/works"
        className="inline-flex items-center gap-2 text-sm text-muted-brand hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-sm"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        กลับผลงานทั้งหมด
      </Link>
    </footer>
  );
}
