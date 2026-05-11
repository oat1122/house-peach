'use client';

/**
 * Thin re-export of sonner with helpers tailored to house-peach actions.
 * Use this module from client components — `<Toaster>` is mounted once in
 * the admin layout (see src/app/(admin)/admin/layout.tsx).
 */

import { toast } from 'sonner';

export { toast };

/**
 * Picks the right toast variant for batch uploads:
 *   - all ok → success
 *   - mixed → warning
 *   - all fail → error
 */
export function reportUploadOutcome(params: {
  ok: number;
  fail: number;
}): void {
  const { ok, fail } = params;
  if (ok > 0 && fail === 0) {
    toast.success(
      ok === 1 ? 'อัปโหลดแล้ว 1 รูป' : `อัปโหลด ${ok} รูปเรียบร้อย`,
    );
    return;
  }
  if (ok > 0 && fail > 0) {
    toast.warning(`อัปโหลด ${ok} สำเร็จ, ${fail} ล้มเหลว — ดูในแถว`);
    return;
  }
  toast.error('อัปโหลดล้มเหลว — ดูรายละเอียดในแถว');
}
