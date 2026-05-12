import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function WorkNotFound() {
  return (
    <section className="mx-auto max-w-md px-4 py-24 text-center">
      <SearchX className="mx-auto size-12 text-muted-brand" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold text-ink">ไม่พบผลงานนี้</h1>
      <p className="mt-2 text-sm text-muted-brand">
        ผลงานอาจถูกย้าย เก็บถาวร หรือ URL ไม่ถูกต้อง — ลองดูผลงานอื่นได้ที่หน้ารวม
      </p>
      <Button className="mt-6" render={<Link href="/works" />} nativeButton={false}>
        ดูผลงานทั้งหมด
      </Button>
    </section>
  );
}
