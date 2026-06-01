// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-WORKSPACE_MESH_BRIDGE]: how: capture workspace diff, save update dialog, and loaded workspace header PNGs

import { test, expect } from "@playwright/test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  assertScreenshot,
  ensureScreenshotDir,
  screenshotPath,
} from "./helpers/readme-demo";

test.describe("README mesh bridge [REQ-WORKSPACE_MESH_BRIDGE] [REQ-README_DEMO_AUTOMATION]", () => {
  test.beforeEach(() => {
    ensureScreenshotDir();
  });

  test("capture workspace diff and save update dialog after mesh restore", async ({ page }) => {
    const dirA = mkdtempSync(join(tmpdir(), "readme-bridge-a-"));
    const dirB = mkdtempSync(join(tmpdir(), "readme-bridge-b-"));
    writeFileSync(join(dirA, "marker-a.txt"), "a");
    writeFileSync(join(dirB, "marker-b.txt"), "b");

    try {
      await page.goto(`/files?pane0=${encodeURIComponent(dirA)}&pane1=${encodeURIComponent(dirB)}`);
      await expect(page.getByText("marker-a.txt").first()).toBeVisible({ timeout: 15000 });

      await page.getByTestId("toolbar-view.layout").click();
      await page.getByTestId("workspace-layout-option-OneRow").click();

      await page.keyboard.press("Control+Shift+M");
      await expect(page.getByTestId("save-workspace-mesh-dialog")).toBeVisible({ timeout: 5000 });
      const meshName = `README Bridge ${Date.now()}`;
      await page.getByTestId("save-workspace-mesh-name").fill(meshName);
      await page.getByTestId("save-workspace-mesh-submit").click();
      await expect(page.getByTestId("mesh-detail")).toBeVisible({ timeout: 15000 });

      const [filesPage] = await Promise.all([
        page.context().waitForEvent("page"),
        page.getByTestId("open-workspace-from-mesh").click(),
      ]);
      await filesPage.waitForLoadState("domcontentloaded");
      await expect(filesPage.getByTestId("workspace-loaded-name")).toContainText(meshName, {
        timeout: 10000,
      });
      await filesPage.waitForTimeout(500);

      await assertScreenshot(filesPage, screenshotPath("workspace-header-status.png"), {
        fullPage: true,
        minBytes: 5000,
      });

      await filesPage.getByTestId("toolbar-view.layout").click();
      await filesPage.getByTestId("workspace-layout-option-Tile").click();
      await expect(filesPage.getByTestId("workspace-diff-header-button")).toBeVisible({
        timeout: 5000,
      });
      await filesPage.getByTestId("workspace-diff-header-button").click();
      await expect(filesPage.getByTestId("workspace-diff-dialog")).toBeVisible({ timeout: 5000 });
      await assertScreenshot(
        filesPage.getByTestId("workspace-diff-dialog"),
        screenshotPath("dialog-workspace-diff.png"),
      );
      await filesPage.getByTestId("workspace-diff-close").click();

      await filesPage.keyboard.press("Control+Shift+M");
      await expect(filesPage.getByTestId("save-workspace-mesh-dialog")).toBeVisible({
        timeout: 5000,
      });
      await filesPage.getByTestId("save-workspace-mesh-mode-update").check();
      await assertScreenshot(
        filesPage.getByTestId("save-workspace-mesh-dialog"),
        screenshotPath("dialog-save-workspace-mesh-update.png"),
      );
      await filesPage.close();
    } finally {
      rmSync(dirA, { recursive: true, force: true });
      rmSync(dirB, { recursive: true, force: true });
    }
  });
});
