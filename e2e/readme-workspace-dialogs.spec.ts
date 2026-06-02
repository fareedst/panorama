// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: capture static workspace dialog, popover, and context menu PNGs

import { test, expect } from "@playwright/test";
import {
  assertScreenshot,
  dismissOverlays,
  ensureComparisonFixture,
  ensureScreenshotDir,
  MIN_DIALOG_SCREENSHOT_BYTES,
  openContextMenuOnFile,
  openWorkspaceDeepLink,
  screenshotPath,
  seedReadmePaneFilterCatalogs,
  enableComparisonMode,
  README_DEMO_DISPLAY_SPEC_IDS,
} from "./helpers/readme-demo";

test.describe("README workspace dialogs [REQ-README_DEMO_AUTOMATION]", () => {
  test.beforeAll(() => {
    ensureComparisonFixture();
  });

  test.beforeEach(async ({ page }) => {
    ensureScreenshotDir();
    ensureComparisonFixture();
    await seedReadmePaneFilterCatalogs(page);
    await openWorkspaceDeepLink(page);
    await dismissOverlays(page);
  });

  test("capture file context menu", async ({ page }) => {
    await openContextMenuOnFile(page, 0, "file2.txt");
    await assertScreenshot(
      page.getByRole("menu", { name: "File operations menu" }),
      screenshotPath("menu-file-context.png"),
    );
    await dismissOverlays(page);
  });

  test("capture secondary workspace dialogs from context menu", async ({ page }) => {
    const cases: { item: string; dialog: string; file: string }[] = [
      { item: "touch-file-menu-item", dialog: "dialog-touch-file.png", file: "file2.txt" },
      { item: "execute-file-menu-item", dialog: "dialog-execute-file.png", file: "file2.txt" },
      { item: "make-directory-menu-item", dialog: "dialog-make-directory.png", file: "file2.txt" },
      { item: "rename-regex-menu-item", dialog: "dialog-rename-regex.png", file: "file2.txt" },
    ];

    for (const { item, dialog, file } of cases) {
      await openContextMenuOnFile(page, 0, file);
      await page.getByTestId(item).click();
      const dialogTestId = item.replace("-menu-item", "-dialog");
      await expect(page.getByTestId(dialogTestId)).toBeVisible({ timeout: 5000 });
      await assertScreenshot(page.getByTestId(dialogTestId), screenshotPath(dialog), {
        minBytes: MIN_DIALOG_SCREENSHOT_BYTES,
      });
      await page.getByTestId(`${dialogTestId.replace("-dialog", "-cancel")}`).click();
      await dismissOverlays(page);
    }
  });

  test("capture set base directory dialog", async ({ page }) => {
    await openContextMenuOnFile(page, 0, "demo-folder");
    await page.getByTestId("set-base-directory-menu-item").click();
    await expect(page.getByTestId("set-base-directory-dialog")).toBeVisible({ timeout: 5000 });
    await assertScreenshot(
      page.getByTestId("set-base-directory-dialog"),
      screenshotPath("dialog-set-base-directory.png"),
      { minBytes: MIN_DIALOG_SCREENSHOT_BYTES },
    );
  });

  test("capture toolbar and pane header dialogs", async ({ page }) => {
    await page.getByTestId("toolbar-pane.order").click();
    await expect(page.getByTestId("pane-order-dialog")).toBeVisible({ timeout: 5000 });
    await assertScreenshot(page.getByTestId("pane-order-dialog"), screenshotPath("dialog-pane-order.png"), {
      minBytes: MIN_DIALOG_SCREENSHOT_BYTES,
    });
    await page.getByTestId("pane-order-dialog-overlay").click({ position: { x: 5, y: 5 } });
    await dismissOverlays(page);

    await page.getByTestId("toolbar-view.columns").click();
    await expect(page.getByTestId("column-order-dialog")).toBeVisible({ timeout: 5000 });
    await assertScreenshot(
      page.getByTestId("column-order-dialog"),
      screenshotPath("dialog-column-order.png"),
      { minBytes: MIN_DIALOG_SCREENSHOT_BYTES },
    );
    await page.getByTestId("column-order-dialog-overlay").click({ position: { x: 5, y: 5 } });
    await dismissOverlays(page);

    await page.getByTestId("toolbar-view.layout").click();
    await expect(page.getByTestId("workspace-layout-picker")).toBeVisible({ timeout: 5000 });
    await assertScreenshot(
      page.getByTestId("workspace-layout-picker"),
      screenshotPath("popover-layout-picker.png"),
      { minBytes: MIN_DIALOG_SCREENSHOT_BYTES },
    );
    await page.getByTestId("workspace-layout-picker-overlay").click();
    await dismissOverlays(page);

    await enableComparisonMode(page);
    await page.getByTestId("toolbar-view.compareFilter.sizeGtThreshold").click();
    await expect(page.getByTestId("compare-filter-threshold-dialog")).toBeVisible({ timeout: 5000 });
    await assertScreenshot(
      page.getByTestId("compare-filter-threshold-dialog"),
      screenshotPath("dialog-compare-filter-threshold.png"),
      { minBytes: MIN_DIALOG_SCREENSHOT_BYTES },
    );
    await page.getByTestId("compare-filter-threshold-apply").click();
    await dismissOverlays(page);

    await page.getByTestId("pane-0").getByTestId("pane-display-spec-selector").selectOption("__manage__");
    await expect(page.getByTestId("display-spec-manager-dialog")).toBeVisible({ timeout: 5000 });
    await assertScreenshot(
      page.getByTestId("display-spec-manager-dialog"),
      screenshotPath("dialog-display-spec-manager.png"),
      { minBytes: MIN_DIALOG_SCREENSHOT_BYTES },
    );
    await page
      .getByTestId(`display-spec-catalog-${README_DEMO_DISPLAY_SPEC_IDS.hideTmp}`)
      .click();
    await expect(page.getByTestId("display-spec-rule-editor")).toBeVisible({ timeout: 5000 });
    await assertScreenshot(
      page.getByTestId("display-spec-manager-dialog"),
      screenshotPath("dialog-display-spec-construct.png"),
      { minBytes: MIN_DIALOG_SCREENSHOT_BYTES },
    );
    await page.getByTestId("display-spec-manager-close").click();
    await expect(page.getByTestId("display-spec-manager-dialog")).toBeHidden({ timeout: 5000 });

    await page.getByTestId("pane-0").getByTestId("pane-cross-pane-visibility-selector").selectOption("__manage__");
    await expect(page.getByTestId("cross-pane-visibility-manager-dialog")).toBeVisible({
      timeout: 5000,
    });
    await assertScreenshot(
      page.getByTestId("cross-pane-visibility-manager-dialog"),
      screenshotPath("dialog-cross-pane-visibility-manager.png"),
      { minBytes: MIN_DIALOG_SCREENSHOT_BYTES },
    );
    await page.getByTestId("cross-pane-visibility-manager-close").click();
    await expect(page.getByTestId("cross-pane-visibility-manager-dialog")).toBeHidden({
      timeout: 5000,
    });

    await page.getByTestId("toolbar-view.compareFilter.sharedAll").click();
    await page.waitForTimeout(300);
    await page.getByTestId("toolbar-view.compareFilter.missingSome").click();
    await page.waitForTimeout(300);
    await page.getByTestId("pane-0").getByTestId("pane-cross-pane-visibility-selector").selectOption("__manage__");
    await expect(page.getByTestId("cross-pane-visibility-manager-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByTestId("cross-pane-visibility-new-from-draft").click();
    await expect(page.getByTestId("cross-pane-visibility-preset-name")).toBeVisible({
      timeout: 5000,
    });
    await page.getByTestId("cross-pane-visibility-preset-name").fill("README demo compare filter");
    await assertScreenshot(
      page.getByTestId("cross-pane-visibility-manager-dialog"),
      screenshotPath("dialog-cross-pane-visibility-construct.png"),
      { minBytes: MIN_DIALOG_SCREENSHOT_BYTES },
    );
    await dismissOverlays(page);
  });

  test("capture save workspace as mesh create dialog", async ({ page }) => {
    await page.keyboard.press("Control+Shift+M");
    await expect(page.getByTestId("save-workspace-mesh-dialog")).toBeVisible({ timeout: 5000 });
    await assertScreenshot(
      page.getByTestId("save-workspace-mesh-dialog"),
      screenshotPath("dialog-save-workspace-mesh-create.png"),
      { minBytes: MIN_DIALOG_SCREENSHOT_BYTES },
    );
  });
});
