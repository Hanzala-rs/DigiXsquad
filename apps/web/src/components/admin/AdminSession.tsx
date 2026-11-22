'use client';

import type { AuthUser } from '@digixsquad/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { can, type Permission } from '@/lib/admin/rbac';
import { fetchMe, ME_KEY, signOut } from '@/lib/admin/session';

const Ctx = createContext<AuthUser | null>(null);

/** Signed-in admin user (only inside <AdminGuard>). */
export function useAdminUser(): AuthUser {
  const user = useContext(Ctx);
  if (!user) throw new Error('useAdminUser must be used inside <AdminGuard>');
  return user;
}

export function useCan(permission: Permission): boolean {
  return can(useContext(Ctx)?.role, permission);
}

export function useSignOut() {
  const qc = useQueryClient();
  const router = useRouter();
  return async () => {
    await signOut();
    qc.clear();
    router.replace('/admin/login');
  };
}

/** Loads the session; sends signed-out visitors to /admin/login?next=<here>. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const me = useQuery({ queryKey: ME_KEY, queryFn: fetchMe, staleTime: 5 * 60_000, retry: false });

  useEffect(() => {
    if (me.isSuccess && !me.data) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [me.isSuccess, me.data, pathname, router]);

  if (me.isError) {
    return (
      <div className="grid min-h-svh place-items-center p-6 text-center">
        <div className="space-y-3">
          <p className="font-semibold">Could not reach the server.</p>
          <button
            type="button"
            onClick={() => me.refetch()}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (!me.data) {
    return (
      <div className="grid min-h-svh place-items-center" role="status" aria-label="Loading">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }
  return <Ctx.Provider value={me.data}>{children}</Ctx.Provider>;
}

/** Hides children unless the current role has the permission. */
export function Can({ permission, children }: { permission: Permission; children: ReactNode }) {
  return useCan(permission) ? <>{children}</> : null;
}
