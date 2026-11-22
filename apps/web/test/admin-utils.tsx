import type { UserRole } from '@digixsquad/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AdminGuard } from '@/components/admin/AdminSession';
import { db } from '@/mocks/db';
import { mockSession } from '@/mocks/session';

/** Signs the mock API in as the demo user with this role (or signs out with null). */
export function signInAs(role: UserRole | null) {
  const user = role ? db.listUsers().find((u) => u.role === role) : undefined;
  mockSession.set(user?.id ?? null);
  return user;
}

/** Renders admin UI inside a fresh QueryClient and the session guard. */
export function renderAdmin(ui: ReactElement, { guard = true } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      {guard ? <AdminGuard>{ui}</AdminGuard> : ui}
    </QueryClientProvider>,
  );
}

export { nav } from './nav-mock';
