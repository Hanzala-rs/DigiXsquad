import { describe, expect, it } from 'vitest';
import { homeAnchors } from '@/content/home';
import { footerNav, isActivePath, isNavItemActive, mainNav, mainNavSections } from './nav-links';

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

describe('mainNav', () => {
  it('links to home anchors that exist, in sketch order', () => {
    expect(mainNav.map((i) => i.label)).toEqual(['About us', 'Squads', 'Projects', 'Contact']);
    const ids = Object.values(homeAnchors) as string[];
    for (const item of mainNav) {
      expect(item.href).toBe(`/#${item.section}`);
      expect(ids).toContain(item.section);
    }
    expect(mainNavSections).toEqual(['about', 'squads', 'projects', 'contact']);
  });

  it('footer still reaches every other page', () => {
    const hrefs = footerNav.flatMap((g) => g.links.map((l) => l.href)) as string[];
    for (const page of [
      '/squads',
      '/roles',
      '/government',
      '/private-sector',
      '/how-it-works',
      '/engagement-models',
      '/contact',
      '/track',
      '/privacy',
      '/terms',
    ])
      expect(hrefs).toContain(page);
    expect(footerNav.map((g) => g.title)).toEqual(['About', 'Company']);
  });
});

describe('isNavItemActive', () => {
  const squads = mainNav.find((i) => i.label === 'Squads')!;
  const projects = mainNav.find((i) => i.label === 'Projects')!;
  it('follows the section in view on /', () => {
    expect(isNavItemActive('/', 'squads', squads)).toBe(true);
    expect(isNavItemActive('/', 'about', squads)).toBe(false);
    expect(isNavItemActive('/', null, squads)).toBe(false);
  });
  it('follows the matching page elsewhere', () => {
    expect(isNavItemActive('/squads/data-squad', null, squads)).toBe(true);
    expect(isNavItemActive('/roles', null, squads)).toBe(false);
    expect(isNavItemActive('/projects', null, projects)).toBe(false);
  });
});
