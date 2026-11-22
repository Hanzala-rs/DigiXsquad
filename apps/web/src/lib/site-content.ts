import 'server-only';
import { cache } from 'react';
import { getSiteContent as fetchSiteContent, type SiteContent } from '@digixsquad/api-client';
import { GetSiteContentResponse } from '@digixsquad/api-client/zod';
import seed from '@digixsquad/contract/seed/site-content.json';
import { serverFetchOptions, withFallback } from './api-fallback';

/** Seed JSON, validated against the contract. Used when the API is down or not built yet. */
export const siteContentFallback: SiteContent = GetSiteContentResponse.parse(seed);

/**
 * Marketing copy (hero, about, mission, vision, values, FAQs …) from `GET /site-content`,
 * cached for 5 minutes. Falls back to the seed so builds and pages never fail on the API.
 */
export const getSiteContent = cache((): Promise<SiteContent> =>
  withFallback(
    'site-content',
    () => fetchSiteContent(serverFetchOptions()),
    GetSiteContentResponse,
    () => siteContentFallback,
  ),
);
