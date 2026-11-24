import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
// Point at an already-running `dev:mock` server (e.g. E2E_BASE_URL=http://localhost:3000) to skip starting one.
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: 15_000 }, // dev server compiles each route on first visit
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: external ?? `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    reducedMotion: 'reduce', // skips the home intro animation
  },
  // Locally use the installed Chrome (no browser download); CI runs `playwright install chromium`.
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], channel: process.env.CI ? undefined : 'chrome' },
    },
  ],
  // MSW mock backend (NEXT_PUBLIC_API_MOCKING) until the FastAPI service is wired in.
  webServer: external
    ? undefined
    : {
        command: `cross-env NEXT_PUBLIC_API_MOCKING=enabled next dev -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
