import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { ComponentType } from 'react';

import { Badge } from '@/components/ui/badge';
import type { InquiryStatus } from '@/lib/db/schema/contactInquiries';

const STATUS_VARIANT: Record<
  InquiryStatus,
  'default' | 'secondary' | 'outline'
> = {
  new: 'default',
  contacted: 'secondary',
  closed: 'outline',
};

const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: 'ใหม่',
  contacted: 'ติดต่อแล้ว',
  closed: 'ปิดงาน',
};

// Per accessibility.md "Color contrast" — never use color alone to convey
// state. Each status has a distinct leading icon so users with low colour
// vision (or in monochrome contexts) can still tell the three apart.
const STATUS_ICON: Record<InquiryStatus, ComponentType<{ className?: string }>> = {
  new: Circle,
  contacted: CheckCircle2,
  closed: XCircle,
};

type Props = {
  status: InquiryStatus;
};

export function InquiryStatusBadge({ status }: Props) {
  const Icon = STATUS_ICON[status];
  return (
    <Badge variant={STATUS_VARIANT[status]} className="gap-1">
      <Icon className="size-3" aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
