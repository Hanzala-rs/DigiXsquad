// @vitest-environment node
import {
  adminCreateTalent,
  adminDeleteTalent,
  adminGetEngagement,
  adminListEngagements,
  adminListTalents,
  adminRenewEngagement,
  adminUpdateEngagement,
  adminUpdateTalent,
  ApiError,
  type TalentInput,
} from '@digixsquad/api-client';
import { AdminListEngagementsResponse, AdminListTalentsResponse } from '@digixsquad/api-client/zod';
import { signInAs } from '../../test/admin-utils';
import { db } from './db';
import { hireStore } from './hire-store';
import { server } from './node';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => hireStore.reset());
afterAll(() => server.close());

const status = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: ApiError) => e.status,
  );
const newTalent: TalentInput = {
  full_name: 'Hina Test',
  email: 'hina.test@example.com',
  phone: '+92 300 0000000',
  primary_role_slug: 'qa-tester',
  seniority: 'MID',
  skills: ['Cypress'],
  experience_years: 3,
  availability: 'AVAILABLE',
  monthly_cost: 150_000,
};
const activeEngagement = () =>
  db.listEngagements({ page: 1, page_size: 50, status: 'ACTIVE' }).items[0]!;

describe('mock admin API: talents', () => {
  it('SALES cannot reach talents; OPS can, with cost', async () => {
    signInAs('SALES');
    expect(await status(adminListTalents())).toBe(403);
    signInAs('OPS');
    const page = AdminListTalentsResponse.parse((await adminListTalents({ page_size: 100 })).data);
    expect(page.meta.total).toBeGreaterThan(0);
    expect(page.items.some((t) => t.monthly_cost !== null)).toBe(true);
  });

  it('filters by role, availability and search', async () => {
    signInAs('OPS');
    const { data } = await adminListTalents({ role_slug: 'qa-tester', availability: 'AVAILABLE' });
    const page = AdminListTalentsResponse.parse(data);
    expect(
      page.items.every(
        (t) => t.primary_role.slug === 'qa-tester' && t.availability === 'AVAILABLE',
      ),
    ).toBe(true);
    const name = page.items[0]!.full_name;
    const found = AdminListTalentsResponse.parse(
      (await adminListTalents({ q: name.toUpperCase() })).data,
    );
    expect(found.items.map((t) => t.full_name)).toContain(name);
  });

  it('creates, updates and soft-deletes a talent; rejects a duplicate email', async () => {
    signInAs('OPS');
    const created = await adminCreateTalent(newTalent);
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(await status(adminCreateTalent(newTalent))).toBe(409);

    await adminUpdateTalent(id, { ...newTalent, seniority: 'SENIOR', city: 'Lahore' });
    expect(db.getTalent(id)).toMatchObject({ seniority: 'SENIOR', city: 'Lahore' });

    expect((await adminDeleteTalent(id)).status).toBe(204);
    expect(db.getTalent(id)).toMatchObject({ is_active: false, availability: 'INACTIVE' });
  });
});

describe('mock admin API: engagements', () => {
  it('lists renewals due within N days, soonest first', async () => {
    signInAs('OPS');
    const page = AdminListEngagementsResponse.parse(
      (await adminListEngagements({ ending_within_days: 30 })).data,
    );
    expect(page.items.length).toBeGreaterThan(0);
    const cutoff = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    expect(page.items.every((e) => e.status === 'ACTIVE' && e.end_date <= cutoff)).toBe(true);
    const ends = page.items.map((e) => e.end_date);
    expect(ends).toEqual([...ends].sort());
  });

  it('ending an engagement frees its team', async () => {
    signInAs('OPS');
    const e = activeEngagement();
    await adminUpdateEngagement(e.id, { status: 'COMPLETED' });
    const talentIds = e.assignments.map((a) => a.talent.id);
    expect(talentIds.every((t) => db.getTalent(t)!.availability === 'AVAILABLE')).toBe(true);
  });

  it('renews into a linked engagement and completes the old one', async () => {
    signInAs('OPS');
    const e = activeEngagement();
    expect(await status(adminRenewEngagement(e.id, { end_date: e.end_date }))).toBe(409);

    const res = await adminRenewEngagement(e.id, { end_date: '2099-12-31', monthly_fee: 999_000 });
    expect(res.status).toBe(201);
    const next = res.data as {
      id: string;
      renewed_from_id: string;
      monthly_fee: number;
      start_date: string;
    };
    expect(next).toMatchObject({ renewed_from_id: e.id, monthly_fee: 999_000 });
    expect(next.start_date > e.end_date).toBe(true);
    expect(((await adminGetEngagement(e.id)).data as { status: string }).status).toBe('COMPLETED');
  });

  it('SALES cannot manage engagements', async () => {
    signInAs('SALES');
    expect(await status(adminListEngagements())).toBe(403);
  });
});
