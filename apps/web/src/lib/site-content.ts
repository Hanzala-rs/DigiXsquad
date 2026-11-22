import 'server-only';
import { cache } from 'react';
import { getSiteContent as fetchSiteContent, type SiteContent } from '@digixsquad/api-client';
import { GetSiteContentResponse } from '@digixsquad/api-client/zod';
import seed from '@digixsquad/contract/seed/site-content.json';

/** Seed JSON, validated against the contract. Used when the API is down or not built yet. */
export const siteContentFallback: SiteContent = GetSiteContentResponse.parse(seed);

const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 3000;

/**
 * Marketing copy (hero, about, mission, vision, values, FAQs …) from `GET /site-content`,
 * cached for 5 minutes. Falls back to the seed so builds and pages never fail on the API.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  try {
    const res = await fetchSiteContent({
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const parsed = GetSiteContentResponse.safeParse(res.data);
    if (parsed.success) return parsed.data;
    console.warn('[site-content] API response did not match the contract, using seed');
  } catch {
    // API unreachable: expected until apps/api ships.
  }
  return siteContentFallback;
});
