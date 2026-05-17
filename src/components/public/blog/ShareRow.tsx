'use client';

import { useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

type Props = {
  /** Absolute URL of the post — built server-side from env.NEXT_PUBLIC_SITE_URL. */
  url: string;
  title: string;
};

/**
 * Social share row for blog posts.
 * Buttons: Facebook, X, LINE, Copy link.
 * Copy: swaps icon to Check for 2s then resets. Announces via sonner toast.
 * Social brand hover colors are hardcoded (FB/X/LINE official brand identity —
 * not house-peach theme tokens).
 *
 * URL is passed in by the server component so SSR + hydration both render the
 * same href — no `window.location` access (which is undefined during SSR).
 */
export function ShareRow({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('คัดลอกลิงก์แล้ว');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('ไม่สามารถคัดลอกลิงก์ได้');
    }
  }

  return (
    <div className="space-y-3">
      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Share2 size={16} aria-hidden="true" />
        แชร์บทความ
      </span>

      <div className="flex flex-wrap gap-2">
        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="แชร์ไปยัง Facebook"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-full min-h-[44px] border border-line text-ink bg-brand-card transition-colors hover:bg-[#1877f2] hover:text-white hover:border-[#1877f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:rounded-full"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </a>

        {/* X (Twitter) */}
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="แชร์ไปยัง X"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-full min-h-[44px] border border-line text-ink bg-brand-card transition-colors hover:bg-black hover:text-white hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:rounded-full"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X
        </a>

        {/* LINE */}
        <a
          href={`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="แชร์ไปยัง LINE"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-full min-h-[44px] border border-line text-ink bg-brand-card transition-colors hover:bg-[#06c755] hover:text-white hover:border-[#06c755] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:rounded-full"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          LINE
        </a>

        {/* Copy link */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-full min-h-[44px] border transition-colors motion-reduce:transition-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:rounded-full',
            copied
              ? 'bg-bg2 border-line text-ink'
              : 'border-line text-ink bg-brand-card hover:bg-bg2',
          )}
        >
          {copied ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Link2 size={14} aria-hidden="true" />
          )}
          {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
        </button>

        {/* Live region for screen reader announcement */}
        <div role="status" aria-live="polite" className="sr-only">
          {copied ? 'คัดลอกลิงก์แล้ว' : ''}
        </div>
      </div>
    </div>
  );
}
