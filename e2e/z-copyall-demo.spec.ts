// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-NSYNC_MULTI_TARGET]: how: Playwright records CopyAll workflow PNGs and webm for copyall-demo.gif conversion

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');
const SETUP_SCRIPT = path.join(__dirname, '../scripts/setup_copyall_demo.sh');
const MIN_SCREENSHOT_BYTES = 10_000;

function ensureCopyAllDemoDirs() {
  // [IMPL-DEMO_SCREENSHOT_PIPELINE] [REQ-NSYNC_MULTI_TARGET]: how: SETUP_COPYALL_FIXTURE — beforeAll rebuilds alpha/beta/gamma layout for CopyAll targets
  execSync(`bash "${SETUP_SCRIPT}" --clean`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  });
}

function assertScreenshotWritten(filePath: string) {
  expect(fs.existsSync(filePath)).toBe(true);
  expect(fs.statSync(filePath).size).toBeGreaterThan(MIN_SCREENSHOT_BYTES);
}

test.describe('CopyAll Demo Recording [REQ-NSYNC_MULTI_TARGET] [REQ-README_DEMO_AUTOMATION]', () => {
  test.beforeAll(() => {
    ensureCopyAllDemoDirs();
  });

  test.beforeEach(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('record CopyAll operation workflow', async ({ page }) => {
    // [IMPL-DEMO_SCREENSHOT_PIPELINE] [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT]: how: CAPTURE_COPYALL_WORKFLOW — pane URL deep link for reproducible three-pane layout
    await page.setViewportSize({ width: 1600, height: 900 });

    await page.goto('/files?pane0=/tmp/test-dirs/alpha&pane1=/tmp/test-dirs/beta&pane2=/tmp/test-dirs/gamma');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    await page.waitForSelector('text=file2.txt', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const demo01 = path.join(SCREENSHOT_DIR, 'demo-01-initial-state.png');
    await page.screenshot({
      path: demo01,
      fullPage: true,
    });
    assertScreenshotWritten(demo01);
    await page.waitForTimeout(1000);

    await page.locator('[data-testid="pane-0"]').click({ force: true });
    await page.waitForTimeout(500);

    const pane0 = page.locator('[data-testid="pane-0"]');
    await pane0.locator('text=file2.txt').click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    await pane0.locator('text=file3.txt').click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    const demo02 = path.join(SCREENSHOT_DIR, 'demo-02-marked-files.png');
    await page.screenshot({
      path: demo02,
      fullPage: true,
    });
    assertScreenshotWritten(demo02);
    await page.waitForTimeout(1000);

    await page.locator('[data-testid="pane-0"]').click({ force: true });
    await page.waitForTimeout(500);

    // [IMPL-DEMO_SCREENSHOT_PIPELINE] [REQ-TOOLBAR_SYSTEM] [REQ-NSYNC_MULTI_TARGET]: how: toolbar-file.copyAll triggers handleCopyAll / sync-all
    await page.locator('[data-testid="toolbar-file.copyAll"]').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('text=Copy to All Panes')).toBeVisible({ timeout: 5000 });
    const demo03 = path.join(SCREENSHOT_DIR, 'demo-03-copyall-dialog.png');
    await page.screenshot({
      path: demo03,
      fullPage: true,
    });
    assertScreenshotWritten(demo03);
    await page.waitForTimeout(1500);

    await page.locator('button:has-text("Confirm")').click();
    await page.waitForTimeout(500);

    const progressDialog = page.locator('text=Copying to All Panes');
    const progressVisible = await progressDialog.isVisible().catch(() => false);
    if (progressVisible) {
      const demo04 = path.join(SCREENSHOT_DIR, 'demo-04-progress.png');
      await page.screenshot({
        path: demo04,
        fullPage: true,
      });
      assertScreenshotWritten(demo04);
    }

    await page.waitForTimeout(3000);

    const demo05 = path.join(SCREENSHOT_DIR, 'demo-05-final-result.png');
    await page.screenshot({
      path: demo05,
      fullPage: true,
    });
    assertScreenshotWritten(demo05);
    await page.waitForTimeout(1000);

    await expect(page.locator('text=file2.txt')).toHaveCount(3);
    await expect(page.locator('text=file3.txt')).toHaveCount(3);
  });
});
