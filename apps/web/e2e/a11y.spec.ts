import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const publicPages = [
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
const adminPages = [
  '/admin',
  '/admin/requests',
  '/admin/talents',
  '/admin/talents/new',
  '/admin/engagements',
];

async function expectNoViolations(page: Page, path: string) {
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
}

test.describe('accessibility (WCAG 2 A/AA)', () => {
  test.skip(({ isMobile }) => isMobile, 'markup is the same on mobile; one pass is enough');

  for (const path of publicPages) test(path, ({ page }) => expectNoViolations(page, path));

  for (const path of adminPages)
    test(path, async ({ page }) => {
      // Seeded mock admin (src/mocks/db.ts); the mock session lives in sessionStorage.
      await page.goto('/admin/login');
      await page.getByLabel('Email').fill('admin@digixsquad.test');
      await page.getByLabel('Password').fill('demo-password-123');
      await page.getByRole('button', { name: /Sign in/ }).click();
      await expect(page).toHaveURL(/\/admin$/);
      await expectNoViolations(page, path);
    });
});
