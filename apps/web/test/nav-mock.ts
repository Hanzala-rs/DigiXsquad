/**
 * next/navigation mock state. Kept free of app imports: the vi.mock factory loads this file, and
 * anything here that imported next/navigation would wait on the mock itself (deadlock).
 *
 *   vi.mock('next/navigation', async () => (await import('<rel>/test/nav-mock')).navigationMock());
 */
export const nav = {
  pathname: '/admin',
  search: '',
  replace: vi.fn(),
  push: vi.fn(),
};

export const navigationMock = () => ({
  useRouter: () => ({ replace: nav.replace, push: nav.push, refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
});
