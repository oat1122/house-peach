'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';

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
import { deleteInquiryAction } from '@/lib/actions/contact';
import { toast } from '@/lib/toast';

type Props = {
  id: number;
  name: string;
};

export function InquiryDeleteButton({ id, name }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteInquiryAction({ id });
      if (result.ok) {
        toast.success('ลบคำขอแล้ว');
        router.push('/admin/inquiries');
      } else {
        toast.error(result.error ?? 'ลบไม่สำเร็จ');
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm" aria-label={`ลบคำขอจาก ${name}`}>
            <Trash2 className="size-4" aria-hidden />
            ลบ
          </Button>
        }
      />
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
            {isPending ? 'กำลังลบ…' : 'ลบคำขอ'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
