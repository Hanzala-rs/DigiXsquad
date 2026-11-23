// @vitest-environment node
import { ApiError, getMe } from '@digixsquad/api-client';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/node';
import { authed, fetchMe, SessionExpiredError } from './session';

const API = 'http://localhost:8000/api/v1';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const me = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'A',
  email: 'a@b.co',
  role: 'SALES',
  is_active: true,
};

describe('authed()', () => {
  it('refreshes once on 401 and retries the call', async () => {
    let calls = 0;
    let refreshes = 0;
    server.use(
      http.get(`${API}/auth/me`, () =>
        ++calls === 1 ? HttpResponse.json({ detail: 'x' }, { status: 401 }) : HttpResponse.json(me),
      ),
      http.post(`${API}/auth/refresh`, () => {
        refreshes++;
        return HttpResponse.json(me);
      }),
    );
    const res = await authed(() => getMe());
    expect(res.data).toMatchObject({ email: 'a@b.co' });
    expect([calls, refreshes]).toEqual([2, 1]);
  });

  it('shares one refresh between concurrent 401s', async () => {
    let refreshes = 0;
    const seen = new Set<number>();
    let n = 0;
    server.use(
      http.get(`${API}/auth/me`, () => {
        const i = n++;
        return i < 3
          ? HttpResponse.json({ detail: 'x' }, { status: 401 })
          : (seen.add(i), HttpResponse.json(me));
      }),
      http.post(`${API}/auth/refresh`, async () => {
        refreshes++;
        await new Promise((r) => setTimeout(r, 20));
        return HttpResponse.json(me);
      }),
    );
    await Promise.all([authed(() => getMe()), authed(() => getMe()), authed(() => getMe())]);
    expect(refreshes).toBe(1);
  });

  it('throws SessionExpiredError when refresh fails; other errors pass through', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({ detail: 'x' }, { status: 401 })),
      http.post(`${API}/auth/refresh`, () => HttpResponse.json({ detail: 'x' }, { status: 401 })),
    );
    await expect(authed(() => getMe())).rejects.toBeInstanceOf(SessionExpiredError);
    await expect(fetchMe()).resolves.toBeNull();

    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({ detail: 'boom' }, { status: 500 })),
    );
    await expect(authed(() => getMe())).rejects.toBeInstanceOf(ApiError);
  });
});
