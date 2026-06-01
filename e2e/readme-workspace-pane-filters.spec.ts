// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-PANE_DISPLAY_FILTER] [REQ-CROSS_PANE_VISIBILITY]: how: capture per-pane display spec and cross-pane visibility selector PNGs

import { test } from "@playwright/test";
import {
  assertScreenshot,
  ensureComparisonFixture,
  ensureScreenshotDir,
  openWorkspaceWithPaneFilters,
  screenshotPath,
} from "./helpers/readme-demo";

test.describe("README workspace pane filters [REQ-PANE_DISPLAY_FILTER] [REQ-CROSS_PANE_VISIBILITY] [REQ-README_DEMO_AUTOMATION]", () => {
  test.beforeAll(() => {
    ensureComparisonFixture();
  });

  test.beforeEach(async () => {
    ensureScreenshotDir();
    ensureComparisonFixture();
  });

  test("capture per-pane filter control selectors and indicators", async ({ page }) => {
    await openWorkspaceWithPaneFilters(page);

    await assertScreenshot(page, screenshotPath("workspace-pane-filter-controls.png"), {
      fullPage: true,
    });

    await assertScreenshot(
      page.getByTestId("pane-0").getByTestId("pane-filter-header"),
      screenshotPath("workspace-pane-filter-header.png"),
      { minBytes: 1500 },
    );
  });
});
