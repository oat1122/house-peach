'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { setInquiryStatusAction } from '@/lib/actions/contact';
import type { InquiryStatus } from '@/lib/db/schema/contactInquiries';
import { toast } from '@/lib/toast';

type Props = {
  id: number;
  current: InquiryStatus;
};

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: 'new', label: 'ใหม่' },
  { value: 'contacted', label: 'ติดต่อแล้ว' },
  { value: 'closed', label: 'ปิดงาน' },
];

export function InquiryStatusSelect({ id, current }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as InquiryStatus;
    if (newStatus === current) return;

    startTransition(async () => {
      const result = await setInquiryStatusAction({ id, status: newStatus });
      if (result.ok) {
        toast.success('อัปเดตสถานะแล้ว');
        router.refresh();
      } else {
        toast.error(result.error ?? 'อัปเดตสถานะไม่สำเร็จ');
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`inquiry-status-${id}`}
        className="text-xs font-medium text-muted-foreground"
      >
        สถานะ
      </label>
      <div className="relative flex items-center">
        <select
          id={`inquiry-status-${id}`}
          defaultValue={current}
          onChange={handleChange}
          disabled={isPending}
          aria-busy={isPending}
          className="h-8 rounded-md border border-input bg-background pr-8 pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isPending && (
          <Spinner className="pointer-events-none absolute right-2 size-3.5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
