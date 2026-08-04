import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for the NEW Next.js app — separate from tests/test-utils.js
 * (legacy R25 suite, run via `npm run test:legacy`). Most flows here
 * need a live Supabase project (see docs/gates/m12-evidence.md); the
 * specs that don't are the ones actually asserted against in this
 * environment.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
