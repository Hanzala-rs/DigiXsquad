// @vitest-environment node
import { getSquad, listRoles, listSquads, getSiteContent, ApiError } from '@digixsquad/api-client';
import {
  GetSiteContentResponse,
  GetSquadResponse,
  ListRolesResponse,
  ListSquadsResponse,
} from '@digixsquad/api-client/zod';
import { stableUuid } from '@/lib/seed-data';
import { server } from './node';

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

describe('stableUuid', () => {
  it('is deterministic and unique per input', () => {
    expect(stableUuid('a')).toBe(stableUuid('a'));
    expect(stableUuid('a')).not.toBe(stableUuid('b'));
  });
});
