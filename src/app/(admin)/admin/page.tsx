import { requireRole } from '@/lib/auth-guard';

export default async function AdminDashboardPage() {
  const { session, role } = await requireRole();
  const name = session.user.name ?? session.user.email ?? 'ผู้ดูแล';

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-ink">ยินดีต้อนรับ, {name}</h1>
      <p className="mt-2 text-sm text-muted-brand">
        คุณกำลังเข้าสู่ระบบในฐานะ <strong className="text-ink">{role}</strong>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="บทความ"
          hint="เพิ่ม / แก้ blog post — ใช้ MDX editor"
          href="/admin/posts"
        />
        <DashboardCard
          title="ผลงาน"
          hint="จัดการ portfolio works พร้อม gallery before/after"
          href="/admin/works"
        />
        <DashboardCard
          title="มีเดีย"
          hint="อัปโหลด + เลือกรูปสำหรับ cover / gallery"
          href="/admin/media"
        />
      </div>

      <p className="mt-10 rounded-md border border-dashed border-line bg-bg2/40 p-4 text-xs text-muted-brand">
        Phase 1 ได้ admin login + role guard แล้ว — ฟีเจอร์ posts / works / media จะมาใน Phase ถัดไป
      </p>
    </section>
  );
}

function DashboardCard({
  title,
  hint,
  href,
}: {
  title: string;
  hint: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-xl border border-line bg-brand-card p-5 transition hover:border-brand-accent hover:shadow-sm"
    >
      <h2 className="text-base font-medium text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted-brand">{hint}</p>
    </a>
  );
}
