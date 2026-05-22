// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] [REQ-MESH_E2E_RELEASE]: Playwright DevServer on PLAYWRIGHT_PORT; inject temporary MESH_DATA_DIR and MESH_ASYNC_SYNC so mesh E2E can poll **session progress** without port collisions.
import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Dedicated e2e port so a hung or stale `npm run dev` on 3000 does not block Playwright.
// Reuse is opt-in only: a zombie listener on this port accepts TCP but never responds,
// which makes Playwright's webServer readiness check hang and yields an empty report.
const E2E_PORT = process.env.PLAYWRIGHT_PORT ?? '3001';
const e2eBaseURL = `http://127.0.0.1:${E2E_PORT}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1';

const meshDataDir =
  process.env.MESH_DATA_DIR ?? mkdtempSync(join(tmpdir(), 'mesh-e2e-data-'));

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60000,  // 60 second timeout for tests

  use: {
    baseURL: e2eBaseURL,
    trace: 'on-first-retry',
    video: 'on',  // Record video of all tests
    screenshot: 'on',  // Take screenshots on failure
    actionTimeout: 15000,  // 15 second timeout for actions
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `npm run dev -- -p ${E2E_PORT}`,
    url: e2eBaseURL,
    reuseExistingServer,
    timeout: 120000,
    env: {
      MESH_DATA_DIR: meshDataDir,
      MESH_ASYNC_SYNC: '1',
      PLAYWRIGHT_PORT: E2E_PORT,
    },
  },
});
