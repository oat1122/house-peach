'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  CheckCircle2,
  Circle,
  Copy,
  Eye,
  Mail,
  MoreHorizontal,
  Trash2,
  XCircle,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  deleteInquiryAction,
  setInquiryStatusAction,
} from '@/lib/actions/contact';
import type { InquiryStatus } from '@/lib/db/schema/contactInquiries';
import { toast } from '@/lib/toast';

type Props = {
  id: number;
  email: string;
  name: string;
  status: InquiryStatus;
};

const MAILTO_SUBJECT = encodeURIComponent('Re: คำขอจาก house-peach');

/**
 * Strip CR/LF (and their percent-encoded equivalents) from an email before
 * inlining it into a mailto: href. Without this, a stored email like
 * `attacker@x.com%0ACc:victim@example.com` would inject a Cc header in mail
 * clients that parse mailto URIs permissively (CWE-93 CRLF injection).
 * zod's `.email()` accepts the value because the suffix is technically a
 * valid local-part — sanitise at render time.
 */
function sanitizeMailtoAddress(email: string): string {
  return email.replace(/(\r|\n|%0a|%0d)/gi, '');
}

export function InquiryRowActions({ id, email, name, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeStatus = (newStatus: InquiryStatus) => {
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

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success('คัดลอกอีเมลแล้ว');
    } catch {
      toast.error('คัดลอกไม่สำเร็จ — ลองใหม่');
    }
  };

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="xs"
              aria-label={`เมนูจัดการคำขอจาก ${name}`}
              className="size-7 p-0"
              disabled={isPending}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={
              <Link href={`/admin/inquiries/${id}`}>
                <Eye aria-hidden /> ดูรายละเอียด
              </Link>
            }
          />
          <DropdownMenuSeparator />
          {status !== 'new' && (
            <DropdownMenuItem onClick={() => changeStatus('new')}>
              <Circle aria-hidden /> ทำเป็นใหม่
            </DropdownMenuItem>
          )}
          {status !== 'contacted' && (
            <DropdownMenuItem onClick={() => changeStatus('contacted')}>
              <CheckCircle2 aria-hidden /> ทำเป็นติดต่อแล้ว
            </DropdownMenuItem>
          )}
          {status !== 'closed' && (
            <DropdownMenuItem onClick={() => changeStatus('closed')}>
              <XCircle aria-hidden /> ปิดงาน
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyEmail}>
            <Copy aria-hidden /> คัดลอกอีเมล
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <a
                href={`mailto:${sanitizeMailtoAddress(email)}?subject=${MAILTO_SUBJECT}`}
                target="_blank"
                rel="noreferrer"
              >
                <Mail aria-hidden /> ตอบกลับทางอีเมล
              </a>
            }
          />
          <DropdownMenuSeparator />
          <AlertDialogTrigger
            render={
              <DropdownMenuItem variant="destructive">
                <Trash2 aria-hidden /> ลบคำขอ
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog id={id} name={name} />
    </AlertDialog>
  );
}

function DeleteConfirmDialog({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteInquiryAction({ id });
      if (result.ok) {
        toast.success('ลบคำขอแล้ว');
        router.refresh();
      } else {
        toast.error(result.error ?? 'ลบไม่สำเร็จ');
      }
    });
  };

  return (
    <AlertDialogContent size="sm">
      <AlertDialogHeader>
        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
        <AlertDialogDescription>
          ลบคำขอติดต่อจาก <strong>{name}</strong>?
          การกระทำนี้ย้อนกลับไม่ได้
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          disabled={isPending}
          aria-busy={isPending}
          onClick={handleDelete}
          className="min-h-11"
        >
          {isPending ? 'กำลังลบ…' : 'ลบ'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
