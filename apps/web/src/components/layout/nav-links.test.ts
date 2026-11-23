import { describe, expect, it } from 'vitest';
import { isActivePath } from './nav-links';

describe('isActivePath', () => {
  it('matches home only on /', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/squads', '/')).toBe(false);
  });
  it('matches a section and its sub-pages', () => {
    expect(isActivePath('/squads', '/squads')).toBe(true);
    expect(isActivePath('/squads/data', '/squads')).toBe(true);
  });
  it('does not match lookalike prefixes', () => {
    expect(isActivePath('/rolesx', '/roles')).toBe(false);
  });
});
