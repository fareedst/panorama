// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-MESH_GUI]: how: capture Mesh list and per-mesh route PNGs

import { test, expect } from "@playwright/test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  addMeshLink,
  assertScreenshot,
  generateAndApprovePlan,
  ensureScreenshotDir,
  screenshotPath,
} from "./helpers/readme-demo";

test.describe("README mesh surfaces [REQ-README_DEMO_AUTOMATION] [REQ-MESH_GUI]", () => {
  test.beforeEach(() => {
    ensureScreenshotDir();
  });

  test("capture mesh list with sortable columns", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/mesh");
    for (const name of [`README Mesh A ${stamp}`, `README Mesh B ${stamp}`]) {
      await page.getByTestId("new-mesh-name").fill(name);
      await page.getByTestId("create-mesh-btn").click();
      await expect(page.getByRole("link", { name })).toBeVisible({ timeout: 10000 });
    }
    await assertScreenshot(page, screenshotPath("mesh-list.png"), { fullPage: true });
  });

  test("capture per-mesh routes and workspace snapshot summary", async ({ page }) => {
    const srcDir = mkdtempSync(join(tmpdir(), "readme-mesh-src-"));
    const dst1 = mkdtempSync(join(tmpdir(), "readme-mesh-d1-"));
    const dst2 = mkdtempSync(join(tmpdir(), "readme-mesh-d2-"));
    writeFileSync(join(srcDir, "mesh-demo.txt"), "mesh readme asset");

    try {
      await page.goto(`/files?pane0=${encodeURIComponent(srcDir)}&pane1=${encodeURIComponent(dst1)}&pane2=${encodeURIComponent(dst2)}`);
      await expect(page.getByTestId("pane-0")).toBeVisible({ timeout: 10000 });
      await page.keyboard.press("Control+Shift+M");
      const meshName = `README Mesh Routes ${Date.now()}`;
      await page.getByTestId("save-workspace-mesh-name").fill(meshName);
      await page.getByTestId("save-workspace-mesh-submit").click();
      await expect(page.getByTestId("mesh-detail")).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("workspace-snapshot-summary")).toBeVisible();

      await page.getByTestId("add-depot-name").fill("Source");
      await page.getByTestId("add-depot-root").fill(srcDir);
      await page.getByTestId("add-depot-btn").click();
      await page.getByTestId("add-depot-name").fill("Target1");
      await page.getByTestId("add-depot-root").fill(dst1);
      await page.getByTestId("add-depot-btn").click();
      await page.getByTestId("add-depot-name").fill("Target2");
      await page.getByTestId("add-depot-root").fill(dst2);
      await page.getByTestId("add-depot-btn").click();
      await addMeshLink(page, "Source", "Target1");
      await addMeshLink(page, "Source", "Target2");

      await assertScreenshot(page, screenshotPath("mesh-detail-overview.png"), { fullPage: true });
      await assertScreenshot(
        page.getByTestId("open-workspace-from-mesh"),
        screenshotPath("mesh-open-workspace.png"),
        { minBytes: 500 },
      );

      await page.getByTestId("mesh-detail-nav").getByRole("link", { name: "Topology" }).click();
      await expect(page.getByTestId("topology-graph")).toBeVisible({ timeout: 10000 });
      await assertScreenshot(page, screenshotPath("mesh-topology.png"), { fullPage: true });

      await generateAndApprovePlan(page);
      await assertScreenshot(page, screenshotPath("mesh-plan-approval.png"), { fullPage: true });

      await page.getByTestId("mesh-detail-nav").getByRole("link", { name: "Sync Now" }).click();
      await expect(page.getByTestId("active-session-view")).toBeVisible();
      await assertScreenshot(page, screenshotPath("mesh-sync-session.png"), { fullPage: true });

      await page.getByTestId("mesh-detail-nav").getByRole("link", { name: "Depots" }).click();
      await expect(page.getByTestId("mesh-depots")).toBeVisible();
      await assertScreenshot(page, screenshotPath("mesh-depots.png"), { fullPage: true });

      await page.getByTestId("mesh-detail-nav").getByRole("link", { name: "Export" }).click();
      await expect(page.getByTestId("mesh-export-page")).toBeVisible();
      await assertScreenshot(page, screenshotPath("mesh-export.png"), { fullPage: true });

      await page.getByTestId("mesh-detail-nav").getByRole("link", { name: "Schedule" }).click();
      await expect(page.getByTestId("mesh-schedule")).toBeVisible();
      await assertScreenshot(page, screenshotPath("mesh-schedule.png"), { fullPage: true });

      await page.getByTestId("mesh-detail-nav").getByRole("link", { name: "Settings" }).click();
      await expect(page.getByTestId("mesh-archive-settings")).toBeVisible();
      await assertScreenshot(page, screenshotPath("mesh-archive-settings.png"), { fullPage: true });
    } finally {
      rmSync(srcDir, { recursive: true, force: true });
      rmSync(dst1, { recursive: true, force: true });
      rmSync(dst2, { recursive: true, force: true });
    }
  });
});
