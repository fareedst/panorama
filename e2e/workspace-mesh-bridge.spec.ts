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
      await page.getByTestId("workspace-layout-select").selectOption("OneRow");

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
      await expect(filesPage.getByTestId("workspace-restored-from-mesh")).toBeVisible({
        timeout: 10000,
      });
      await expect(filesPage.getByText("marker-a.txt").first()).toBeVisible({ timeout: 10000 });
      await expect(filesPage.getByText("marker-b.txt").first()).toBeVisible({ timeout: 10000 });

      await expect(filesPage.getByTestId("workspace-layout-select")).toHaveValue("OneRow", {
        timeout: 10000,
      });
      const pane0Box = await filesPage.getByTestId("pane-0").boundingBox();
      const pane1Box = await filesPage.getByTestId("pane-1").boundingBox();
      expect(pane0Box).not.toBeNull();
      expect(pane1Box).not.toBeNull();
      expect(pane1Box!.x).toBeGreaterThan(pane0Box!.x + 10);
      await expect(page.getByTestId("mesh-detail")).toBeVisible();
      await filesPage.close();
    } finally {
      rmSync(dirA, { recursive: true, force: true });
      rmSync(dirB, { recursive: true, force: true });
    }
  });
});
