/**
 * Mock session for MSW. The real API uses httpOnly cookies (ds_access / ds_refresh) that JS can't
 * read; here we keep the logged-in user id in memory, mirrored to sessionStorage so a reload in
 * `dev:mock` stays logged in.
 */
const KEY = 'ds_mock_session';
let current: string | null = null;

function read(): string | null {
  if (current) return current;
  try {
    current = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(KEY);
  } catch {
    current = null;
  }
  return current;
}

export const mockSession = {
  get: read,
  set(userId: string | null) {
    current = userId;
    try {
      if (typeof sessionStorage === 'undefined') return;
      if (userId) sessionStorage.setItem(KEY, userId);
      else sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
