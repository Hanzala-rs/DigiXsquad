// @vitest-environment node
import { getSiteContent, siteContentFallback } from './site-content';

afterEach(() => vi.unstubAllGlobals());

describe('getSiteContent', () => {
  it('falls back to the seed when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(getSiteContent()).resolves.toBe(siteContentFallback);
  });

  it('seed fallback has mission, vision and 6 core values', () => {
    expect(siteContentFallback.about.mission).toMatch(/IT teams/);
    expect(siteContentFallback.about.vision.length).toBeGreaterThan(20);
    expect(siteContentFallback.about.values).toHaveLength(6);
  });
});
