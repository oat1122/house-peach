'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Tag as TagIcon,
  FolderKanban,
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
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { signOutAction } from '@/lib/actions/auth';
import type { UserRole } from '@/lib/db/schema/users';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const contentNav: NavItem[] = [
  { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/admin/posts', label: 'บทความ', icon: FileText },
  { href: '/admin/works', label: 'ผลงาน', icon: FolderKanban },
];

const libraryNav: NavItem[] = [
  { href: '/admin/media', label: 'มีเดีย', icon: Images },
  { href: '/admin/tags', label: 'แท็ก', icon: TagIcon },
];

const inboxNav: NavItem[] = [
  { href: '/admin/inquiries', label: 'ติดต่อ', icon: Inbox },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  user,
}: {
  user: { name: string | null; email: string | null; role: UserRole };
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-sidebar-foreground"
          aria-label="house-peach admin home"
        >
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-accent text-bg"
          >
            hp
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">
            house-peach
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="คอนเทนต์" items={contentNav} pathname={pathname} />
        <NavGroup label="ไลบรารี" items={libraryNav} pathname={pathname} />
        <NavGroup label="กล่องข้อความ" items={inboxNav} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-foreground"
            title={user.name ?? user.email ?? 'ผู้ดูแล'}
          >
            {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 text-xs leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate font-medium text-sidebar-foreground">
              {user.name ?? user.email}
            </p>
            <p className="truncate text-muted-foreground">{user.role}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={signOutAction}>
              <SidebarMenuButton
                type="submit"
                tooltip="ออกจากระบบ"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive data-[active=true]:bg-destructive/10"
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
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
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
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
