import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');

test.describe('CopyAll Demo Recording', () => {
  test.beforeEach(async () => {
    // Ensure screenshot directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('record CopyAll operation workflow', async ({ page }) => {
    // Set viewport for consistent recording
    await page.setViewportSize({ width: 1600, height: 900 });

    // Step 1: Navigate to app with pre-configured pane paths via URL query parameters
    await page.goto('/files?pane0=/tmp/test-dirs/alpha&pane1=/tmp/test-dirs/beta&pane2=/tmp/test-dirs/gamma');
    await page.waitForLoadState('networkidle');
    
    // Wait for panes to load and populate
    await page.waitForTimeout(2000);

    // Close any modal dialogs (press Escape to be safe)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Wait for files to load in all panes
    await page.waitForSelector('text=file2.txt', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Screenshot 1: Initial state
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo-01-initial-state.png'),
      fullPage: true
    });
    await page.waitForTimeout(1000);

    // Step 2: Focus pane 1 (alpha) and mark files
    await page.locator('[data-testid="pane-0"]').click({ force: true });
    await page.waitForTimeout(500);

    // Find and mark file2.txt (within the first pane)
    const pane0 = page.locator('[data-testid="pane-0"]');
    await pane0.locator('text=file2.txt').click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Find and mark file3.txt (within the first pane)
    await pane0.locator('text=file3.txt').click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // Screenshot 2: Marked files
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo-02-marked-files.png'),
      fullPage: true
    });
    await page.waitForTimeout(1000);

    // Step 3: Trigger CopyAll via toolbar button
    // Click on the pane to ensure it has focus first
    await page.locator('[data-testid="pane-0"]').click({ force: true });
    await page.waitForTimeout(500);
    
    // Click the CopyAll toolbar button
    await page.locator('[data-testid="toolbar-file.copyAll"]').click();
    await page.waitForTimeout(2000);

    // Screenshot 3: CopyAll confirmation dialog
    await expect(page.locator('text=Copy to All Panes')).toBeVisible({ timeout: 5000 });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo-03-copyall-dialog.png'),
      fullPage: true
    });
    await page.waitForTimeout(1500);

    // Step 4: Confirm operation
    await page.locator('button:has-text("Confirm")').click();
    await page.waitForTimeout(500);

    // Screenshot 4: Progress dialog (if visible)
    const progressDialog = page.locator('text=Copying to All Panes');
    const progressVisible = await progressDialog.isVisible().catch(() => false);
    if (progressVisible) {
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'demo-04-progress.png'),
        fullPage: true
      });
    }

    // Wait for operation to complete
    await page.waitForTimeout(3000);

    // Screenshot 5: Final result
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo-05-final-result.png'),
      fullPage: true
    });
    await page.waitForTimeout(1000);

    // Verify files were copied to all 3 panes (should see 3 instances of each file)
    await expect(page.locator('text=file2.txt')).toHaveCount(3);
    await expect(page.locator('text=file3.txt')).toHaveCount(3);
  });
});
