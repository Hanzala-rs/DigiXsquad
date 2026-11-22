import 'server-only';
import { cache } from 'react';
import {
  listRoles as fetchRoles,
  listSquads as fetchSquads,
  type ServiceRole,
  type Squad,
} from '@digixsquad/api-client';
import { ListRolesResponse, ListSquadsResponse } from '@digixsquad/api-client/zod';
import { serverFetchOptions, withFallback } from './api-fallback';
import { roles as seedRoles, squads as seedSquads } from './seed-data';

const bySortOrder = (a: Squad, b: Squad) => a.sort_order - b.sort_order;

/** Active squads, sorted. API first, seed fallback. */
export const getSquads = cache(async (): Promise<Squad[]> => {
  const squads = await withFallback(
    'squads',
    () => fetchSquads(serverFetchOptions()),
    ListSquadsResponse,
    () => seedSquads,
  );
  return squads.filter((s) => s.is_active).sort(bySortOrder);
});

/** One squad by slug, or null. Reads the cached list so static pages need one request. */
export const getSquad = cache(async (slug: string): Promise<Squad | null> => {
  const squads = await getSquads();
  return squads.find((s) => s.slug === slug) ?? null;
});

/** Active roles. API first, seed fallback. */
export const getRoles = cache(async (): Promise<ServiceRole[]> => {
  const roles = await withFallback(
    'roles',
    () => fetchRoles(undefined, serverFetchOptions()),
    ListRolesResponse,
    () => seedRoles,
  );
  return roles.filter((r) => r.is_active);
});
