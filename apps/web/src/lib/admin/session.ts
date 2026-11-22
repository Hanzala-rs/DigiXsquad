'use client';

import { ApiError, getMe, logout, refreshSession, type AuthUser } from '@digixsquad/api-client';
import { AuthUser as AuthUserSchema } from '@/lib/admin/schemas';

/**
 * Admin auth runs on httpOnly cookies set by the API (ds_access 15 min, ds_refresh 7 days), which
 * JS can't read. So: call the API, and on a 401 rotate the session once via /auth/refresh and
 * retry. Concurrent 401s share one refresh. If refresh fails the user must log in again.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.');
    this.name = 'SessionExpiredError';
  }
}

let refreshing: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  refreshing ??= refreshSession()
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

const is401 = (e: unknown) => e instanceof ApiError && e.status === 401;

/** Run an admin API call with one transparent session refresh on 401. */
export async function authed<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (e) {
    if (!is401(e)) throw e;
    if (!(await refreshOnce())) throw new SessionExpiredError();
    try {
      return await call();
    } catch (e2) {
      throw is401(e2) ? new SessionExpiredError() : e2;
    }
  }
}

/** Current admin user, or null when not signed in (after a refresh attempt). */
export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await authed(() => getMe());
    return AuthUserSchema.parse(res.data);
  } catch (e) {
    if (e instanceof SessionExpiredError) return null;
    throw e;
  }
}

export async function signOut(): Promise<void> {
  try {
    await logout();
  } catch {
    // Cookies may already be gone; signing out locally is enough.
  }
}

export const ME_KEY = ['admin', 'me'] as const;
