// @vitest-environment node
import { getRoles, getSquad, getSquads } from './catalog';
import { isRealPhone, isSet } from './placeholders';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
});
afterEach(() => vi.unstubAllGlobals());

describe('catalog with the API down', () => {
  it('serves 5 squads from the seed, sorted, with resolved roles', async () => {
    const squads = await getSquads();
    expect(squads).toHaveLength(5);
    expect(squads.map((s) => s.sort_order)).toEqual(
      [...squads.map((s) => s.sort_order)].sort((a, b) => a - b),
    );
    expect(squads[0]!.roles[0]!.role.title).toBeTruthy();
  });

  it('finds a squad by slug, null for unknown', async () => {
    expect((await getSquad('data-ai-squad'))?.name).toMatch(/Data/);
    expect(await getSquad('nope')).toBeNull();
  });

  it('serves 24 roles', async () => {
    expect(await getRoles()).toHaveLength(24);
  });
});

describe('placeholders', () => {
  it.each([
    ['TBD', false],
    ['TBD, Pakistan', false],
    ['', false],
    ['Blue Area, Islamabad', true],
  ])('isSet(%j) = %s', (v, expected) => expect(isSet(v)).toBe(expected));

  it('treats the seed phone as a placeholder', () => {
    expect(isRealPhone('+92 300 0000000')).toBe(false);
    expect(isRealPhone('+92 51 1234567')).toBe(true);
  });
});
