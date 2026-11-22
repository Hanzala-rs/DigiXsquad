import type { ServiceRole, SiteContent, Squad } from '@digixsquad/api-client';
import rolesSeed from '@digixsquad/contract/seed/roles.json';
import siteContentSeed from '@digixsquad/contract/seed/site-content.json';
import squadsSeed from '@digixsquad/contract/seed/squads.json';

/** Stable fake UUID (v4 layout) from a string, so fixture ids don't change between runs. */
export function stableUuid(input: string): string {
  let hex = '';
  for (let round = 0; hex.length < 32; round++) {
    let h = 0x811c9dc5 ^ round;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    hex += (h >>> 0).toString(16).padStart(8, '0');
  }
  const v = hex.slice(0, 32).split('');
  v[12] = '4';
  v[16] = ((parseInt(v[16]!, 16) & 0x3) | 0x8).toString(16);
  const s = v.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export const roles: ServiceRole[] = rolesSeed.map((r) => ({
  ...r,
  category: r.category as ServiceRole['category'],
  id: stableUuid(`role:${r.slug}`),
  is_active: true,
}));

const roleBySlug = new Map(roles.map((r) => [r.slug, r]));

export const squads: Squad[] = squadsSeed.map((s) => ({
  ...s,
  id: stableUuid(`squad:${s.slug}`),
  is_active: true,
  roles: s.roles.map(({ role_slug, default_qty }) => {
    const role = roleBySlug.get(role_slug);
    if (!role) throw new Error(`squads.json: unknown role_slug "${role_slug}" in ${s.slug}`);
    return { role, default_qty };
  }),
}));

export const siteContent = siteContentSeed as SiteContent;
