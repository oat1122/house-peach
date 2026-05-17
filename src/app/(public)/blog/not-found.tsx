import Link from 'next/link';
import { FileSearch } from 'lucide-react';

export default function BlogNotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <FileSearch size={48} className="text-muted-brand mb-4" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-ink">ไม่พบหน้านี้</h1>
      <p className="text-sm text-muted-brand mt-2 max-w-sm">
        ลิงก์อาจถูกย้ายหรือลบไปแล้ว ลองค้นหาบทความที่คุณต้องการ
      </p>
      <Link
        href="/blog"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-ink text-bg text-sm font-medium hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
      >
        ดูบทความทั้งหมด
      </Link>
    </main>
  );
}
