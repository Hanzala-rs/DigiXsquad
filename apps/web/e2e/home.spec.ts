import { expect, test } from '@playwright/test';
import seed from '@digixsquad/contract/seed/site-content.json' with { type: 'json' };

// Home one-pager: Hero → About → Team → Squads → Vision/Mission → Projects → Footer.
// Runs with reducedMotion: 'reduce' (playwright.config), so content is in its final state.

test('home sections render in the sketch order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer#contact')).toBeAttached();
  const ids = await page
    .locator('main section[id], footer[id]')
    .evaluateAll((els) => els.map((el) => el.id).filter((id) => id !== 'top'));
  expect(ids).toEqual(['about', 'team', 'squads', 'vision', 'projects', 'contact']);
});

test('Enter scrolls to the About section', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Enter' }).click();
  await expect(page).toHaveURL(/#about$/);
  await expect(page.locator('#about')).toBeInViewport();
});

test('team, vision, mission and counters come from site content', async ({ page }) => {
  await page.goto('/');
  for (const member of seed.team) {
    await expect(page.locator('#team').getByText(member.title).first()).toBeVisible();
  }
  await expect(page.locator('#vision')).toContainText(seed.about.vision);
  await expect(page.locator('#vision')).toContainText(seed.about.mission);
  for (const counter of seed.projects) {
    await expect(page.locator('#projects').getByText(counter.label)).toBeVisible();
  }
});

test('navbar anchors reach their sections', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop navbar links; the mobile menu is covered by unit tests');
  await page.goto('/');
  const nav = page.getByRole('navigation').first();
  for (const [name, id] of [
    ['Projects', 'projects'],
    ['Squads', 'squads'],
    ['About us', 'about'],
    ['Contact', 'contact'],
  ] as const) {
    await nav.getByRole('link', { name, exact: true }).click();
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});
