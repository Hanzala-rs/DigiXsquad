import { expect, test, type Page } from '@playwright/test';

// Seeded mock admin (src/mocks/db.ts).
const ADMIN = { email: 'admin@digixsquad.test', password: 'demo-password-123' };
const CLIENT_EMAIL = 'e2e.client@example.com';

const heading = (page: Page) => page.getByRole('main').getByRole('heading', { level: 2 });
const next = (page: Page) => page.getByRole('button', { name: /Continue/ }).click();

test('client hires a squad → admin updates status → client tracks it', async ({ page }) => {
  test.setTimeout(90_000); // long flow; first visit compiles pages in dev
  // 1. Client submits a hire request (squad CTA prefill skips to the roles step).
  await page.goto('/hire?squad=data-ai-squad&org=PRIVATE');
  await expect(heading(page)).toHaveText('Roles');
  await next(page);

  await expect(heading(page)).toHaveText('Duration & work mode');
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel(/Preferred start date/).fill(tomorrow);
  await page.getByText('Remote', { exact: true }).click(); // custom radio card
  await next(page);

  await expect(heading(page)).toHaveText('Your details');
  await page.getByLabel(/Company name|organization name/i).fill('E2E Labs');
  await page.getByLabel(/Full name/).fill('Sara Test');
  await page.getByLabel(/^Email/).fill(CLIENT_EMAIL);
  await page.getByLabel(/^Phone/).fill('+92 300 7654321');
  await next(page);

  await expect(heading(page)).toHaveText('Project');
  await page.getByLabel(/Describe the project/).fill('Analytics dashboard for our sales team.');
  await next(page);

  await expect(heading(page)).toHaveText('Review & submit');
  await page.getByLabel(/I agree/).check();
  await page.getByRole('button', { name: /Submit request/ }).click();

  const ref = (await page
    .getByRole('status')
    .getByText(/^DS-\d{4}-\d{4,}$/)
    .textContent())!;
  expect(ref).toMatch(/^DS-/);

  // 2. Admin finds it and moves it to "Proposal sent".
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: /Sign in/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);

  await page.goto('/admin/requests');
  await page.getByRole('link', { name: ref }).first().click();
  await expect(page.getByRole('heading', { name: 'Manage' })).toBeVisible(); // detail page loaded
  await page.getByRole('combobox', { name: 'Status' }).selectOption('PROPOSAL_SENT');
  await page.getByRole('button', { name: /Update/ }).click();
  await expect(page.getByText('Status changed to PROPOSAL_SENT')).toBeVisible();

  // 3. Client tracks the request and sees the new status.
  await page.goto(`/track?ref=${ref}`);
  await page.getByLabel('Email used in the request').fill(CLIENT_EMAIL);
  await page.getByRole('button', { name: /Track/ }).click();
  await expect(page.getByRole('heading', { name: 'Proposal sent' })).toBeVisible();
});
