import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  '/',
  '/squads',
  '/squads/data-ai-squad',
  '/roles',
  '/government',
  '/private-sector',
  '/how-it-works',
  '/engagement-models',
  '/about',
  '/hire',
  '/track',
  '/contact',
  '/privacy',
  '/terms',
  '/admin/login',
];

test.describe('accessibility (WCAG 2 A/AA)', () => {
  test.skip(({ isMobile }) => isMobile, 'markup is the same on mobile; one pass is enough');

  for (const path of pages) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const summary = violations.map(
        (v) =>
          `${v.id} (${v.impact}): ${v.nodes
            .map((n) => n.target.join(' '))
            .slice(0, 3)
            .join(' | ')}`,
      );
      expect(summary).toEqual([]);
    });
  }
});
