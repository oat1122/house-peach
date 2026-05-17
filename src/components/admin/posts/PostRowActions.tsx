'use client';

import Link from 'next/link';
import { Copy, ExternalLink, MoreHorizontal, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/lib/toast';
import type { ContentStatus } from '@/lib/validation/post';

type Props = {
  id: number;
  slug: string;
  status: ContentStatus;
};

export function PostRowActions({ id, slug, status }: Props) {
  const editHref = `/admin/posts/${id}/edit`;
  const publicHref = `/blog/${slug}`;

  const copySlug = async () => {
    try {
      await navigator.clipboard.writeText(slug);
      toast.success('คัดลอก slug แล้ว');
    } catch {
      toast.error('คัดลอกไม่สำเร็จ — ลองใหม่');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            aria-label={`เมนูจัดการบทความ ${slug}`}
            className="size-7 p-0"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={
            <Link href={editHref}>
              <Pencil aria-hidden /> แก้ไข
            </Link>
          }
        />
        {status === 'published' && (
          <DropdownMenuItem
            render={
              <Link href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden /> เปิดบน blog
              </Link>
            }
          />
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copySlug}>
          <Copy aria-hidden /> คัดลอก slug
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
