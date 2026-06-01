// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: capture workspace shell, header, toolbars, and pane listing PNGs

import { test, expect } from "@playwright/test";
import {
  assertScreenshot,
  ensureComparisonFixture,
  ensureScreenshotDir,
  openWorkspaceDeepLink,
  cycleToolbarDisplayMode,
  enableComparisonMode,
  screenshotPath,
} from "./helpers/readme-demo";

test.describe("README workspace surfaces [REQ-README_DEMO_AUTOMATION]", () => {
  test.beforeAll(() => {
    ensureComparisonFixture();
  });

  test.beforeEach(async ({ page }) => {
    ensureScreenshotDir();
    ensureComparisonFixture();
    await openWorkspaceDeepLink(page);
  });

  test("capture workspace shell, header, toolbars, and pane listing", async ({ page }) => {
    await page.waitForTimeout(1000);

    await assertScreenshot(page, screenshotPath("workspace-shell.png"), { fullPage: true });
    await assertScreenshot(page, screenshotPath("3-pane-workspace.png"), { fullPage: true });

    await assertScreenshot(
      page.getByTestId("workspace-cross-surface-nav"),
      screenshotPath("workspace-cross-surface-nav.png"),
      { minBytes: 500 },
    );

    await assertScreenshot(page.getByTestId("pane-0"), screenshotPath("workspace-pane-listing.png"));

    await assertScreenshot(page, screenshotPath("workspace-toolbar-compact.png"), { fullPage: true });

    await cycleToolbarDisplayMode(page, 1);
    await assertScreenshot(page, screenshotPath("workspace-toolbar-expanded.png"), { fullPage: true });

    await cycleToolbarDisplayMode(page, 1);
    await expect(page.locator(".toolbar-named").first()).toBeVisible({ timeout: 5000 });
    await assertScreenshot(page, screenshotPath("workspace-toolbar-named.png"), { fullPage: true });

    await cycleToolbarDisplayMode(page, 1);
    await enableComparisonMode(page);
    await assertScreenshot(page, screenshotPath("3-pane-comparison.png"), { fullPage: true });
  });
});
