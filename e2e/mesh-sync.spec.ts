// [REQ-MESH_E2E_RELEASE] [REQ-MESH_PLATFORM]: E2E mesh flows — phase 30

import { test, expect } from "@playwright/test";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

test.describe("mesh sync E2E", () => {
  test("create_mesh_with_two_local_depots_and_sync_file", async ({ page }) => {
    const srcDir = mkdtempSync(join(tmpdir(), "mesh-e2e-src-"));
    const dstDir = mkdtempSync(join(tmpdir(), "mesh-e2e-dst-"));
    writeFileSync(join(srcDir, "sync-me.txt"), "hello e2e");

    try {
      await page.goto("/mesh");
      await page.getByTestId("new-mesh-name").fill("E2E Mesh");
      await page.getByTestId("create-mesh-btn").click();
      await expect(page.getByRole("link", { name: "E2E Mesh" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByRole("link", { name: "E2E Mesh" }).click();
      await expect(page.getByTestId("mesh-detail")).toBeVisible();

      await page.getByTestId("add-depot-name").fill("Source");
      await page.getByTestId("add-depot-root").fill(srcDir);
      await page.getByTestId("add-depot-btn").click();
      await expect(page.getByTestId("depot-summary")).toContainText("Source", {
        timeout: 5000,
      });

      await page.getByTestId("add-depot-name").fill("Target");
      await page.getByTestId("add-depot-root").fill(dstDir);
      await page.getByTestId("add-depot-btn").click();
      await expect(page.getByTestId("depot-summary")).toContainText("Target");

      await page.getByTestId("add-link-source").selectOption({ label: "Source" });
      await page.getByTestId("add-link-target").selectOption({ label: "Target" });
      await page.getByTestId("add-link-btn").click();
      await expect(page.getByTestId("link-summary")).toContainText("Source");

      await page.getByRole("link", { name: "Plan" }).click();
      await expect(page.getByTestId("plan-view")).toBeVisible();
      await page.getByTestId("generate-plan-btn").click();
      await expect(page.getByTestId("change-set-table")).toBeVisible({ timeout: 10000 });

      await page.getByTestId("approve-plan-btn").click();
      await expect(page.getByTestId("plan-approved")).toBeVisible({ timeout: 10000 });

      await page.getByRole("link", { name: "Sync Now" }).click();
      await expect(page.getByTestId("active-session-view")).toBeVisible();

      await expect
        .poll(() => existsSync(join(dstDir, "sync-me.txt")), { timeout: 15000 })
        .toBe(true);
      expect(readFileSync(join(dstDir, "sync-me.txt"), "utf-8")).toBe("hello e2e");
    } finally {
      rmSync(srcDir, { recursive: true, force: true });
      rmSync(dstDir, { recursive: true, force: true });
    }
  });

  test("menu_contains_meshes_entry", async ({ page }) => {
    await page.goto("/mesh");
    await expect(
      page.getByTestId("global-mesh-nav").getByRole("link", { name: "Meshes" }),
    ).toBeVisible();
  });

  test("mesh_detail_menu_contains_topology_entry", async ({ page }) => {
    await page.goto("/mesh");
    await page.getByTestId("new-mesh-name").fill("Nav Test");
    await page.getByTestId("create-mesh-btn").click();
    await page.getByRole("link", { name: "Nav Test" }).click();
    await expect(
      page.getByTestId("mesh-detail-nav").getByRole("link", { name: "Topology" }),
    ).toBeVisible();
  });

  test("monitoring_dashboard_loads", async ({ page }) => {
    await page.goto("/mesh/monitoring");
    await expect(page.getByTestId("monitoring-dashboard")).toBeVisible();
    await expect(page.getByTestId("active-sessions")).toBeVisible();
  });

  test("settings_import_export_page", async ({ page }) => {
    await page.goto("/mesh/settings");
    await expect(page.getByTestId("mesh-settings")).toBeVisible();
    await expect(page.getByTestId("export-mesh-btn")).toBeVisible();
  });

  test("permission_restricted_viewer_cannot_create_mesh", async ({ page }) => {
    const res = await page.request.post("/api/mesh", {
      headers: { "Content-Type": "application/json", "x-mesh-role": "viewer" },
      data: { name: "Denied" },
    });
    expect(res.status()).toBe(403);
  });

  test("archived_mesh_filter", async ({ page }) => {
    await page.goto("/mesh");
    await page.getByTestId("show-archived").check();
    await expect(page.getByTestId("mesh-list-table")).toBeVisible();
  });
});
