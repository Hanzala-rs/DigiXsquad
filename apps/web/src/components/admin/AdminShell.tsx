'use client';

import {
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { can, roleLabels, type Permission } from '@/lib/admin/rbac';
import { cn } from '@/lib/utils';
import { useAdminUser, useSignOut } from './AdminSession';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  exact?: boolean;
};

/** Next: catalog, users, audit logs, messages. */
export const adminNav: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'requests.read',
    exact: true,
  },
  { href: '/admin/requests', label: 'Requests', icon: ClipboardList, permission: 'requests.read' },
  { href: '/admin/talents', label: 'Talents', icon: Users, permission: 'talents.manage' },
  {
    href: '/admin/engagements',
    label: 'Engagements',
    icon: Briefcase,
    permission: 'engagements.manage',
  },
  {
    href: '/admin/site-content',
    label: 'Homepage',
    icon: LayoutTemplate,
    permission: 'content.manage',
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useAdminUser();
  return (
    <ul className="space-y-1">
      {adminNav
        .filter((item) => can(role, item.permission))
        .map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'chamfer-sm flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-primary/15 text-foreground shadow-[inset_2px_0_0_var(--primary)]'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className={cn('size-4', active && 'text-primary')} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
    </ul>
  );
}

function UserCard() {
  const user = useAdminUser();
  const signOut = useSignOut();
  return (
    <div className="border-t border-border pt-4">
      <p className="truncate text-sm font-semibold">{user.name}</p>
      <p className="truncate text-xs text-muted-foreground">
        {roleLabels[user.role]} · {user.email}
      </p>
      <button
        type="button"
        onClick={signOut}
        className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <LogOut className="size-4" aria-hidden="true" /> Sign out
      </button>
    </div>
  );
}

function Brand() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2.5 font-heading font-bold tracking-[0.04em]"
    >
      <Image src="/brand/logo.webp" alt="" width={30} height={26} className="h-[26px] w-auto" />
      <span>
        Digix<span className="text-primary">Squad</span>
        <span className="ml-2 font-heading text-[10px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          Admin
        </span>
      </span>
    </Link>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[240px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh flex-col gap-8 border-r border-border bg-surface p-5 lg:flex">
        <Brand />
        <nav aria-label="Admin" className="flex-1">
          <NavLinks />
        </nav>
        <UserCard />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-drawer"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="chamfer-sm grid size-10 place-items-center bg-card"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>
      {open && (
        <div
          id="admin-drawer"
          className="fixed inset-x-0 top-[65px] z-30 space-y-6 border-b border-border bg-surface p-4 lg:hidden"
        >
          <nav aria-label="Admin">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
          <UserCard />
        </div>
      )}

      <main id="main" className="min-w-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
