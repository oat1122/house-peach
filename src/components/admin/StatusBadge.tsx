import { Archive, CheckCircle2, PencilLine } from 'lucide-react';
import type { ComponentType } from 'react';

import { cn } from '@/lib/utils';
import type { ContentStatus } from '@/lib/validation/post';

// Shared content-status badge for posts + works across list / detail / form.
// Mirrors InquiryStatusBadge's a11y rule (accessibility.md "Color contrast"):
// each status carries a distinct icon so state never relies on colour alone.
// Colours come from the brand status tokens (themes.css) so they track all
// 4 presets, unlike shadcn Badge variants which stay on the :root palette.

const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: 'ฉบับร่าง',
  published: 'เผยแพร่',
  archived: 'เก็บเข้าคลัง',
};

const STATUS_ICON: Record<
  ContentStatus,
  ComponentType<{ className?: string }>
> = {
  draft: PencilLine,
  published: CheckCircle2,
  archived: Archive,
};

// Token-driven text colour per status (icon + optional emphasis).
const STATUS_TEXT: Record<ContentStatus, string> = {
  draft: 'text-warning',
  published: 'text-success',
  archived: 'text-muted-brand',
};

export function contentStatusLabel(status: ContentStatus): string {
  return STATUS_LABEL[status];
}

export function StatusBadge({
  status,
  className,
}: {
  status: ContentStatus;
  className?: string;
}) {
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-bg2 px-2.5 py-0.5 text-xs font-medium text-ink',
        className,
      )}
    >
      <Icon className={cn('size-3', STATUS_TEXT[status])} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
