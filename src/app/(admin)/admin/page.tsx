import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  FileText,
  FolderKanban,
  Images,
  Inbox,
  Plus,
} from 'lucide-react';
import type { ComponentType } from 'react';

import { FadeUp } from '@/components/motion/FadeUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireRole } from '@/lib/auth-guard';
import {
  getAdminDashboardStats,
  type RecentItem,
  type StatusBar,
} from '@/lib/services/dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { session } = await requireRole();
  const name = session.user.name ?? session.user.email ?? 'ผู้ดูแล';
  const stats = await getAdminDashboardStats();

  const statCards: {
    href: string;
    label: string;
    value: number;
    icon: ComponentType<{ className?: string }>;
  }[] = [
    { href: '/admin/works', label: 'ผลงานทั้งหมด', value: stats.works.total, icon: FolderKanban },
    { href: '/admin/posts', label: 'บทความทั้งหมด', value: stats.posts.total, icon: FileText },
    { href: '/admin/media', label: 'ภาพในคลัง', value: stats.mediaCount, icon: Images },
    { href: '/admin/inquiries', label: 'ข้อความใหม่', value: stats.inquiries.new, icon: Inbox },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">
      <FadeUp immediate>
        <h1 className="font-serif text-3xl font-normal text-ink">
          สวัสดี, {name}
        </h1>
        <p className="mt-2 text-sm text-muted-brand">
          ภาพรวมเนื้อหาทั้งหมดของ house-peach studio
        </p>
      </FadeUp>

      <Stagger className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <StaggerItem key={c.href}>
            <Link
              href={c.href}
              className="flex flex-col gap-3.5 rounded-2xl border border-line bg-brand-card p-4 transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-xl bg-bg2 text-brand-accent">
                  <c.icon className="size-[18px]" aria-hidden />
                </span>
                <ArrowUpRight className="size-4 text-muted-brand" aria-hidden />
              </div>
              <div>
                <div className="text-[28px] font-semibold leading-none tracking-tight text-ink">
                  {c.value}
                </div>
                <div className="mt-1.5 text-sm text-muted-brand">{c.label}</div>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <RecentCard items={stats.recent} />
        <div className="flex flex-col gap-4">
          <QuickCreateCard />
          <StatusBarsCard bars={stats.statusBars} />
        </div>
      </div>
    </section>
  );
}

const KIND_LABEL = { post: 'บทความ', work: 'ผลงาน' } as const;

function RecentCard({ items }: { items: RecentItem[] }) {
  return (
    <FadeUp className="rounded-2xl border border-line bg-brand-card p-1.5">
      <div className="flex items-center justify-between px-3.5 pb-3 pt-3.5">
        <h2 className="text-[15px] font-semibold text-ink">อัปเดตล่าสุด</h2>
        <Link
          href="/admin/works"
          className="text-xs text-brand-accent hover:underline"
        >
          ดูผลงานทั้งหมด →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="px-3.5 py-10 text-center text-sm text-muted-brand">
          ยังไม่มีเนื้อหา — เริ่มสร้างผลงานหรือบทความแรกได้เลย
        </p>
      ) : (
        <ul>
          {items.map((r) => (
            <li key={`${r.kind}-${r.id}`}>
              <Link
                href={`/admin/${r.kind === 'post' ? 'posts' : 'works'}/${r.id}`}
                className="flex items-center gap-3 border-t border-line/60 px-3.5 py-2.5 transition hover:bg-bg2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent"
              >
                <span className="relative size-[42px] shrink-0 overflow-hidden rounded-[10px] border border-line bg-bg2">
                  {r.coverPath ? (
                    <Image
                      src={r.coverPath}
                      alt=""
                      fill
                      sizes="42px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">
                    {r.title}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-muted-brand">
                    {KIND_LABEL[r.kind]}
                  </span>
                </span>
                <StatusBadge status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </FadeUp>
  );
}

function QuickCreateCard() {
  return (
    <FadeUp className="rounded-2xl bg-ink p-5 text-bg">
      <h2 className="text-[15px] font-semibold">เริ่มสร้างใหม่</h2>
      <p className="mt-1.5 text-[12.5px] text-bg/70">
        เพิ่มเนื้อหาเข้าสู่เว็บไซต์ได้ทันที
      </p>
      <div className="mt-4 grid gap-2.5">
        <Link
          href="/admin/works/new"
          className="flex items-center gap-2.5 rounded-xl border border-bg/15 bg-bg/10 px-3.5 py-2.5 text-[13.5px] transition hover:bg-bg/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/40"
        >
          <Plus className="size-[18px] text-brand-accent" aria-hidden />
          ผลงานใหม่
        </Link>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2.5 rounded-xl border border-bg/15 bg-bg/10 px-3.5 py-2.5 text-[13.5px] transition hover:bg-bg/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg/40"
        >
          <Plus className="size-[18px] text-brand-accent" aria-hidden />
          บทความใหม่
        </Link>
      </div>
    </FadeUp>
  );
}

const BAR_FILL: Record<StatusBar['status'], string> = {
  published: 'bg-success',
  draft: 'bg-warning',
  archived: 'bg-muted-brand',
};

function StatusBarsCard({ bars }: { bars: StatusBar[] }) {
  return (
    <FadeUp className="rounded-2xl border border-line bg-brand-card p-[18px]">
      <h2 className="mb-3 text-[15px] font-semibold text-ink">สถานะเนื้อหา</h2>
      {bars.map((b) => (
        <div key={b.status} className="mb-2.5 last:mb-0">
          <div className="mb-1.5 flex justify-between text-[12.5px]">
            <span className="text-muted-brand">{b.label}</span>
            <span className="font-semibold text-ink">{b.count}</span>
          </div>
          <div className="h-[7px] overflow-hidden rounded-full bg-bg2">
            <div
              className={`h-full rounded-full ${BAR_FILL[b.status]}`}
              style={{ width: `${b.pct}%` }}
            />
          </div>
        </div>
      ))}
    </FadeUp>
  );
}
