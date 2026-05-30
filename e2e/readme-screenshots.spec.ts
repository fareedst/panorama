// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-MULTI_PANE_LAYOUT] [REQ-CROSS_PANE_COMPARISON]: how: Playwright captures README workspace and comparison mode PNGs using pane URL deep link and comparison demo fixture

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');
const SETUP_SCRIPT = path.join(__dirname, '../scripts/setup_readme_screenshots.sh');
const MIN_SCREENSHOT_BYTES = 10_000;

function ensureReadmeScreenshotDirs() {
  // [IMPL-DEMO_SCREENSHOT_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-CROSS_PANE_COMPARISON]: how: SETUP_COMPARISON_FIXTURE — each spec beforeAll re-seeds /tmp/test-dirs after npm demo:setup may wipe it
  execSync(`bash "${SETUP_SCRIPT}"`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  });
}

function assertScreenshotWritten(filePath: string) {
  expect(fs.existsSync(filePath)).toBe(true);
  expect(fs.statSync(filePath).size).toBeGreaterThan(MIN_SCREENSHOT_BYTES);
}

test.describe('README Screenshot Capture [REQ-README_DEMO_AUTOMATION]', () => {
  test.beforeAll(() => {
    ensureReadmeScreenshotDirs();
  });

  test.beforeEach(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('capture workspace and comparison mode screenshots', async ({ page }) => {
    // [IMPL-DEMO_SCREENSHOT_PIPELINE] [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT]: how: CAPTURE_WORKSPACE_AND_COMPARISON — pane URL deep link loads three panes
    await page.setViewportSize({ width: 1600, height: 900 });

    await page.goto('/files?pane0=/tmp/test-dirs/alpha&pane1=/tmp/test-dirs/beta&pane2=/tmp/test-dirs/gamma');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await page.waitForSelector('[data-testid="pane-0"]', { timeout: 10000 });
    await page.waitForSelector('text=file2.txt', { timeout: 10000 });
    await expect(page.locator('text=file2.txt')).toHaveCount(2);
    await page.waitForTimeout(1000);

    const workspacePath = path.join(SCREENSHOT_DIR, '3-pane-workspace.png');
    await page.screenshot({
      path: workspacePath,
      fullPage: true,
    });
    assertScreenshotWritten(workspacePath);

    // [IMPL-DEMO_SCREENSHOT_PIPELINE] [REQ-TOOLBAR_SYSTEM] [REQ-CROSS_PANE_COMPARISON]: how: double-click toolbar-view.comparison to enable comparison mode for coloring
    const comparisonButton = page.locator('[data-testid="toolbar-view.comparison"]');
    await comparisonButton.click();
    await page.waitForTimeout(300);
    await comparisonButton.click();
    await page.waitForTimeout(500);

    await expect(comparisonButton).toHaveClass(/bg-blue/);

    const comparisonPath = path.join(SCREENSHOT_DIR, '3-pane-comparison.png');
    await page.screenshot({
      path: comparisonPath,
      fullPage: true,
    });
    assertScreenshotWritten(comparisonPath);
  });
});
