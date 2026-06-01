// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-LINKED_PANES] [REQ-CROSS_PANE_VISIBILITY]: how: record motion GIF source webms for linked mode, comparison cycle, cross-pane visibility, pane management

import { test, expect } from "@playwright/test";
import {
  ensureComparisonFixture,
  ensureScreenshotDir,
  enableComparisonMode,
  openWorkspaceDeepLink,
} from "./helpers/readme-demo";

test.describe("linked-mode-demo [REQ-LINKED_PANES] [REQ-README_DEMO_AUTOMATION]", () => {
  test.beforeAll(() => {
    ensureComparisonFixture();
  });

  test.beforeEach(async ({ page }) => {
    ensureScreenshotDir();
    ensureComparisonFixture();
    await openWorkspaceDeepLink(page);
  });

  test("record linked navigation across panes", async ({ page }) => {
    await page.waitForTimeout(800);
    const pane0 = page.getByTestId("pane-0");
    await pane0.click();
    await pane0.getByTestId("file-row-grid").filter({ hasText: "projects" }).first().click();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);
    await expect(pane0).toContainText("readme.txt");
    await expect(page.getByTestId("pane-1")).toContainText("readme.txt");
    await expect(page.getByTestId("pane-2")).toContainText("readme.txt");
    await page.waitForTimeout(800);
  });
});

test.describe("comparison-cycle-demo [REQ-CROSS_PANE_COMPARISON] [REQ-README_DEMO_AUTOMATION]", () => {
  test.beforeAll(() => {
    ensureComparisonFixture();
  });

  test("record comparison mode cycling off to name to size to time", async ({ page }) => {
    await openWorkspaceDeepLink(page);
    await page.waitForTimeout(800);
    const comparisonButton = page.getByTestId("toolbar-view.comparison");
    for (let i = 0; i < 4; i += 1) {
      await comparisonButton.click();
      await page.waitForTimeout(900);
    }
    await page.waitForTimeout(800);
  });
});

test.describe("cross-pane-visibility-demo [REQ-CROSS_PANE_VISIBILITY] [REQ-README_DEMO_AUTOMATION]", () => {
  test.beforeAll(() => {
    ensureComparisonFixture();
  });

  test("record tri-state compare filter toolbar actions", async ({ page }) => {
    await openWorkspaceDeepLink(page);
    await page.waitForTimeout(800);
    await enableComparisonMode(page);
    const filters = [
      "toolbar-view.compareFilter.sharedAll",
      "toolbar-view.compareFilter.missingSome",
    ];
    for (const filterId of filters) {
      const button = page.getByTestId(filterId);
      await button.click();
      await page.waitForTimeout(700);
      await button.click();
      await page.waitForTimeout(700);
      await button.click();
      await page.waitForTimeout(700);
    }
    await page.waitForTimeout(800);
  });
});

test.describe("pane-management-demo [REQ-MULTI_PANE_LAYOUT] [REQ-README_DEMO_AUTOMATION]", () => {
  test.beforeAll(() => {
    ensureComparisonFixture();
  });

  test("record add pane, layout picker, swap, and pane order", async ({ page }) => {
    await openWorkspaceDeepLink(page);
    await page.waitForTimeout(800);
    await page.getByTestId("toolbar-view.layout").click();
    await page.waitForTimeout(600);
    await page.getByTestId("workspace-layout-option-OneRow").click();
    await page.waitForTimeout(900);
    await page.getByTestId("toolbar-pane.add").click();
    await page.waitForTimeout(900);
    await page.getByTestId("toolbar-pane.swap").click();
    await page.waitForTimeout(900);
    await page.getByTestId("toolbar-pane.order").click();
    await page.waitForTimeout(900);
    await page.getByTestId("pane-order-dialog-overlay").click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(800);
  });
});
