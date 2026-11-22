// @vitest-environment node
import {
  adminGetTalentMatches,
  adminListUsers,
  adminUpdateHireRequestStatus,
  ApiError,
  getDashboardStats,
  login,
} from '@digixsquad/api-client';
import {
  AdminGetTalentMatchesResponse,
  AdminListHireRequestsResponse,
  GetDashboardStatsResponse,
} from '@digixsquad/api-client/zod';
import { signInAs } from '../../test/admin-utils';
import { db, DEMO_PASSWORD } from './db';
import { hireStore } from './hire-store';
import { server } from './node';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => hireStore.reset());
afterAll(() => server.close());

const firstRequestId = () => db.listRequests({ page: 1, page_size: 1 }).items[0]!.id;
const status = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: ApiError) => e.status,
  );

describe('mock admin API (RBAC like the real API)', () => {
  it('rejects wrong passwords and unauthenticated calls', async () => {
    expect(await status(login({ email: 'admin@digixsquad.test', password: 'nope-nope' }))).toBe(
      401,
    );
    expect(await status(getDashboardStats())).toBe(401);
  });

  it('logs in and serves contract-shaped data', async () => {
    await login({ email: 'admin@digixsquad.test', password: DEMO_PASSWORD });
    const stats = GetDashboardStatsResponse.parse((await getDashboardStats()).data);
    expect(stats.open_pipeline).toBeGreaterThan(0);
    expect(stats.renewals_due_30d).toBeGreaterThanOrEqual(1);
    AdminListHireRequestsResponse.parse(db.listRequests({ page: 1, page_size: 5 }));
  });

  it('SALES: no users list, no talent cost', async () => {
    signInAs('SALES');
    expect(await status(adminListUsers())).toBe(403);
    const m = AdminGetTalentMatchesResponse.parse(
      (await adminGetTalentMatches(firstRequestId())).data,
    );
    const all = m.flatMap((x) => x.candidates);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((c) => c.talent.monthly_cost === null)).toBe(true);
  });

  it('OPS: can read matches with cost, cannot change request status', async () => {
    signInAs('OPS');
    const m = AdminGetTalentMatchesResponse.parse(
      (await adminGetTalentMatches(firstRequestId())).data,
    );
    expect(m.flatMap((x) => x.candidates).some((c) => c.talent.monthly_cost !== null)).toBe(true);
    expect(
      await status(adminUpdateHireRequestStatus(firstRequestId(), { status: 'CONTACTED' })),
    ).toBe(403);
  });
});
