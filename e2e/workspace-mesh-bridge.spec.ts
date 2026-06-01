// [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_E2E_RELEASE]: Workspace save and restore via mesh

import { test, expect } from "@playwright/test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

test.describe("workspace mesh bridge E2E [REQ-WORKSPACE_MESH_BRIDGE]", () => {
  // STORE_FROM_WORKSPACE_UI + RESTORE_ON_FILES_PAGE + MESH_DETAIL_RESTORE_LINK — requires UI and server listing
  test("STORE_FROM_WORKSPACE_UI_restore_paths_via_meshId", async ({ page }) => {
    const dirA = mkdtempSync(join(tmpdir(), "ws-mesh-a-"));
    const dirB = mkdtempSync(join(tmpdir(), "ws-mesh-b-"));
    writeFileSync(join(dirA, "marker-a.txt"), "a");
    writeFileSync(join(dirB, "marker-b.txt"), "b");

    try {
      await page.goto(`/files?pane0=${encodeURIComponent(dirA)}&pane1=${encodeURIComponent(dirB)}`);
      await expect(page.getByText("File Manager")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("marker-a.txt").first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("marker-b.txt").first()).toBeVisible({ timeout: 15000 });

      // [REQ-WORKSPACE_MESH_BRIDGE] Non-Tile layout must round-trip on restore (OneRow vs Tile differs for 2 panes)
      await page.getByTestId("toolbar-view.layout").click();
      await page.getByTestId("workspace-layout-option-OneRow").click();

      await page.getByTestId("save-workspace-mesh-dialog").waitFor({ state: "hidden" });
      await page.keyboard.press("Control+Shift+M");
      await expect(page.getByTestId("save-workspace-mesh-dialog")).toBeVisible({ timeout: 5000 });

      const meshName = `WS Bridge ${Date.now()}`;
      await page.getByTestId("save-workspace-mesh-name").fill(meshName);
      await page.getByTestId("save-workspace-mesh-submit").click();

      await expect(page.getByTestId("mesh-detail")).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("workspace-snapshot-summary")).toBeVisible();
      await expect(page.getByTestId("workspace-snapshot-summary")).toContainText(dirA);
      await expect(page.getByTestId("workspace-snapshot-summary")).toContainText(dirB);

      const [filesPage] = await Promise.all([
        page.context().waitForEvent("page"),
        page.getByTestId("open-workspace-from-mesh").click(),
      ]);
      await filesPage.waitForLoadState("domcontentloaded");
      // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] SHOW_LOADED_WORKSPACE_NAME — how: mesh name in workspace-loaded-name (not workspace-restored-from-mesh).
      await expect(filesPage.getByTestId("workspace-loaded-name")).toContainText(meshName, {
        timeout: 10000,
      });
      await expect(filesPage.getByText("marker-a.txt").first()).toBeVisible({ timeout: 10000 });
      await expect(filesPage.getByText("marker-b.txt").first()).toBeVisible({ timeout: 10000 });

      await filesPage.getByTestId("toolbar-view.layout").click({ timeout: 10000 });
      await expect(
        filesPage.getByTestId("workspace-layout-option-OneRow"),
      ).toHaveClass(/bg-blue/, { timeout: 5000 });
      await filesPage.getByTestId("workspace-layout-picker-overlay").click();

      await filesPage.getByTestId("toolbar-view.layout").click();
      await filesPage.getByTestId("workspace-layout-option-Tile").click();
      await expect(filesPage.getByTestId("workspace-diff-header-button")).toBeVisible({
        timeout: 5000,
      });
      await filesPage.getByTestId("workspace-diff-header-button").click();
      await expect(filesPage.getByTestId("workspace-diff-dialog")).toBeVisible({
        timeout: 5000,
      });
      await expect(filesPage.getByTestId("workspace-diff-table")).toBeVisible({
        timeout: 5000,
      });
      await filesPage.getByTestId("workspace-diff-close").click();

      await filesPage.keyboard.press("Control+Shift+M");
      await expect(filesPage.getByTestId("save-workspace-mesh-dialog")).toBeVisible({
        timeout: 5000,
      });
      await filesPage.getByTestId("save-workspace-mesh-mode-update").check();
      await filesPage.getByTestId("save-workspace-mesh-submit").click();
      await expect(filesPage.getByTestId("workspace-diff-change-count")).not.toBeVisible({
        timeout: 10000,
      });
      await filesPage.getByTestId("workspace-diff-header-button").click();
      await expect(filesPage.getByTestId("workspace-diff-no-changes")).toBeVisible({
        timeout: 5000,
      });
      await filesPage.getByTestId("workspace-diff-close").click();
      const pane0Box = await filesPage.getByTestId("pane-0").boundingBox();
      const pane1Box = await filesPage.getByTestId("pane-1").boundingBox();
      expect(pane0Box).not.toBeNull();
      expect(pane1Box).not.toBeNull();
      expect(pane1Box!.y).toBeGreaterThan(pane0Box!.y + 10);
      await expect(page.getByTestId("mesh-detail")).toBeVisible();
      await filesPage.close();
    } finally {
      rmSync(dirA, { recursive: true, force: true });
      rmSync(dirB, { recursive: true, force: true });
    }
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] files_startup_mesh_restores_workspace_on_plain_files_load
  test("FILES_STARTUP_MESH_GATE_restores_on_plain_files_load", async ({ page }) => {
    const dirA = mkdtempSync(join(tmpdir(), "ws-startup-a-"));
    writeFileSync(join(dirA, "startup-marker.txt"), "startup");

    try {
      await page.goto(
        `/files?pane0=${encodeURIComponent(dirA)}&pane1=${encodeURIComponent(dirA)}`,
      );
      await expect(page.getByText("startup-marker.txt").first()).toBeVisible({ timeout: 15000 });

      await page.keyboard.press("Control+Shift+M");
      await expect(page.getByTestId("save-workspace-mesh-dialog")).toBeVisible({ timeout: 5000 });
      const meshName = `Startup Mesh ${Date.now()}`;
      await page.getByTestId("save-workspace-mesh-name").fill(meshName);
      await page.getByTestId("save-workspace-mesh-submit").click();
      await expect(page.getByTestId("mesh-detail")).toBeVisible({ timeout: 15000 });

      const meshUrl = page.url();
      const meshIdMatch = meshUrl.match(/\/mesh\/([^/?#]+)/);
      expect(meshIdMatch).not.toBeNull();
      const meshId = meshIdMatch![1];

      await page.goto("/mesh");
      await expect(page.getByTestId("mesh-list-table")).toBeVisible({ timeout: 10000 });
      await page.getByTestId(`mesh-list-files-startup-${meshId}`).check();

      await page.goto("/files");
      await expect(page).toHaveURL(new RegExp(`meshId=${meshId}`), { timeout: 15000 });
      await expect(page.getByTestId("workspace-loaded-name")).toContainText(meshName, {
        timeout: 10000,
      });
      await expect(page.getByText("startup-marker.txt").first()).toBeVisible({ timeout: 10000 });
    } finally {
      rmSync(dirA, { recursive: true, force: true });
    }
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] files_startup_mesh_invalid_pref_falls_back_to_yaml
  test("FILES_STARTUP_MESH_GATE_clears_invalid_pref_and_loads_yaml_bootstrap", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("panorama.filesStartupMeshId", "mesh-does-not-exist");
    });

    await page.goto("/files");
    await expect(page).not.toHaveURL(/meshId=/, { timeout: 5000 });
    await expect(page.getByTestId("pane-0")).toBeVisible({ timeout: 15000 });

    const clearedPref = await page.evaluate(() =>
      localStorage.getItem("panorama.filesStartupMeshId"),
    );
    expect(clearedPref).toBeNull();
  });
});
