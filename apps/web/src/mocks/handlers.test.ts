// @vitest-environment node
import {
  adminUpdateSiteContent,
  getSquad,
  listRoles,
  listSquads,
  getSiteContent,
  ApiError,
} from '@digixsquad/api-client';
import {
  GetSiteContentResponse,
  GetSquadResponse,
  ListRolesResponse,
  ListSquadsResponse,
} from '@digixsquad/api-client/zod';
import { stableUuid } from '@/lib/seed-data';
import { db } from './db';
import { siteContentStore } from './handlers';
import { server } from './node';
import { mockSession } from './session';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

describe('MSW handlers return contract-shaped data', () => {
  it('listSquads', async () => {
    const res = await listSquads();
    expect(ListSquadsResponse.parse(res.data).length).toBeGreaterThan(0);
  });

  it('getSquad + 404', async () => {
    const res = await getSquad('development-squad');
    expect(GetSquadResponse.parse(res.data).slug).toBe('development-squad');
    await expect(getSquad('nope')).rejects.toBeInstanceOf(ApiError);
  });

  it('listRoles filters by category', async () => {
    const res = await listRoles({ category: 'DEVELOPMENT' });
    const data = ListRolesResponse.parse(res.data);
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((r) => r.category === 'DEVELOPMENT')).toBe(true);
  });

  it('getSiteContent', async () => {
    const res = await getSiteContent();
    expect(GetSiteContentResponse.parse(res.data).about.values).toHaveLength(6);
  });
});

describe('PUT /admin/site-content', () => {
  const signIn = (role: 'SUPER_ADMIN' | 'SALES' | null) =>
    mockSession.set(role ? db.listUsers().find((u) => u.role === role)!.id : null);
  afterEach(() => {
    signIn(null);
    siteContentStore.reset();
  });

  it('needs a SUPER_ADMIN session', async () => {
    const body = GetSiteContentResponse.parse((await getSiteContent()).data);
    signIn(null);
    await expect(adminUpdateSiteContent(body)).rejects.toMatchObject({ status: 401 });
    signIn('SALES');
    await expect(adminUpdateSiteContent(body)).rejects.toMatchObject({ status: 403 });
  });

  it('replaces the document, and GET returns it', async () => {
    signIn('SUPER_ADMIN');
    const body = GetSiteContentResponse.parse((await getSiteContent()).data);
    const next = { ...body, projects: [{ label: 'Projects delivered', value: 42, suffix: '+' }] };
    await adminUpdateSiteContent(next);
    const after = GetSiteContentResponse.parse((await getSiteContent()).data);
    expect(after.projects).toEqual(next.projects);
    expect(after.about).toEqual(body.about);
  });
});

describe('stableUuid', () => {
  it('is deterministic and unique per input', () => {
    expect(stableUuid('a')).toBe(stableUuid('a'));
    expect(stableUuid('a')).not.toBe(stableUuid('b'));
  });
});
