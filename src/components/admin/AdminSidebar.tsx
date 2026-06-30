'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  FolderKanban,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Shapes,
  Tag as TagIcon,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { signOutAction } from '@/lib/actions/auth';
import type { AdminNavCounts } from '@/lib/services/dashboard';
import type { UserRole } from '@/lib/db/schema/users';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
};

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  user,
  counts,
}: {
  user: { name: string | null; email: string | null; role: UserRole };
  counts?: AdminNavCounts;
}) {
  const pathname = usePathname();

  const dashboardNav: NavItem[] = [
    { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
  ];
  const contentNav: NavItem[] = [
    { href: '/admin/works', label: 'ผลงาน', icon: FolderKanban, count: counts?.draftWorks },
    { href: '/admin/posts', label: 'บทความ', icon: FileText, count: counts?.draftPosts },
  ];
  const orgNav: NavItem[] = [
    { href: '/admin/categories', label: 'หมวดหมู่', icon: Shapes },
    { href: '/admin/tags', label: 'แท็ก', icon: TagIcon },
  ];
  const mediaNav: NavItem[] = [
    { href: '/admin/media', label: 'มีเดีย', icon: Images },
  ];
  const inboxNav: NavItem[] = [
    { href: '/admin/inquiries', label: 'ติดต่อ', icon: Inbox, count: counts?.newInquiries },
  ];

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-line">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 px-2 py-1.5"
          aria-label="house-peach admin home"
        >
          <span
            aria-hidden
            className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-ink text-[13px] font-bold tracking-wide text-bg"
          >
            hp
          </span>
          <span className="leading-tight group-data-[collapsible=icon]:hidden">
            <span className="block text-[14.5px] font-semibold text-sidebar-foreground">
              house-peach
            </span>
            <span className="block text-[11px] text-muted-brand">
              แผงควบคุมผู้ดูแล
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup items={dashboardNav} pathname={pathname} />
        <NavGroup label="จัดการเนื้อหา" items={contentNav} pathname={pathname} />
        <NavGroup label="การจัดระเบียบ" items={orgNav} pathname={pathname} />
        <NavGroup label="คลังสื่อ" items={mediaNav} pathname={pathname} />
        <NavGroup label="กล่องข้อความ" items={inboxNav} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="border-t border-line">
        <div className="flex items-center gap-2.5 px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <span
            aria-hidden
            className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-bg2 text-[13px] font-semibold text-muted-brand"
            title={user.name ?? user.email ?? 'ผู้ดูแล'}
          >
            {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 text-xs leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate font-medium text-sidebar-foreground">
              {user.name ?? user.email}
            </p>
            <p className="truncate text-muted-brand">{user.role}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={signOutAction}>
              <SidebarMenuButton
                type="submit"
                tooltip="ออกจากระบบ"
                className="text-danger hover:bg-danger/10 hover:text-danger data-[active=true]:bg-danger/10"
              >
                <LogOut />
                <span>ออกจากระบบ</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label?: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={active}
                  tooltip={item.label}
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.count && item.count > 0 ? (
                  <SidebarMenuBadge>{item.count}</SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
