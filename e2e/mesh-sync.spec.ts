// [REQ-MESH_E2E_RELEASE] [REQ-MESH_PLATFORM]: E2E mesh flows — phase 30

import { test, expect } from "@playwright/test";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

async function createMeshWithDepots(
  page: import("@playwright/test").Page,
  meshName: string,
  depots: { name: string; root: string }[],
) {
  await page.goto("/mesh");
  await page.getByTestId("new-mesh-name").fill(meshName);
  await page.getByTestId("create-mesh-btn").click();
  await expect(page.getByRole("link", { name: meshName })).toBeVisible({ timeout: 10000 });
  await page.getByRole("link", { name: meshName }).click();
  await expect(page.getByTestId("mesh-detail")).toBeVisible();
  for (const d of depots) {
    await page.getByTestId("add-depot-name").fill(d.name);
    await page.getByTestId("add-depot-root").fill(d.root);
    await page.getByTestId("add-depot-btn").click();
    await expect(page.getByTestId("depot-summary")).toContainText(d.name, { timeout: 5000 });
  }
}

async function addLink(page: import("@playwright/test").Page, source: string, target: string) {
  await page.getByTestId("add-link-source").selectOption({ label: source });
  await page.getByTestId("add-link-target").selectOption({ label: target });
  await page.getByTestId("add-link-btn").click();
}

// [IMPL-MESH_GUI] [REQ-MESH_GUI] [REQ-MESH_SAFETY]: Plan approval — approve only; no start on Plan page
async function planAndApprove(page: import("@playwright/test").Page) {
  await page.getByRole("link", { name: "Plan" }).click();
  await expect(page.getByTestId("plan-view")).toBeVisible();
  await page.getByTestId("generate-plan-btn").click();
  await expect(page.getByTestId("change-set-table")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("approve-plan-btn").click();
  await expect(page.getByTestId("plan-approved")).toBeVisible({ timeout: 10000 });
}

// [IMPL-MESH_GUI] [REQ-MESH_E2E_RELEASE]: Sync start — start-sync-btn with optional confirmedDestructive
async function startSync(page: import("@playwright/test").Page) {
  await page.getByRole("link", { name: "Sync Now" }).click();
  await expect(page.getByTestId("active-session-view")).toBeVisible();
  await page.getByTestId("start-sync-btn").click();
}

test.describe("mesh sync E2E", () => {
  test("create_mesh_with_two_local_depots_and_sync_file", async ({ page }) => {
    const srcDir = mkdtempSync(join(tmpdir(), "mesh-e2e-src-"));
    const dstDir = mkdtempSync(join(tmpdir(), "mesh-e2e-dst-"));
    writeFileSync(join(srcDir, "sync-me.txt"), "hello e2e");

    try {
      await createMeshWithDepots(page, "E2E Mesh", [
        { name: "Source", root: srcDir },
        { name: "Target", root: dstDir },
      ]);
      await addLink(page, "Source", "Target");
      await planAndApprove(page);
      await startSync(page);

      await expect
        .poll(() => existsSync(join(dstDir, "sync-me.txt")), { timeout: 20000 })
        .toBe(true);
      expect(readFileSync(join(dstDir, "sync-me.txt"), "utf-8")).toBe("hello e2e");
    } finally {
      rmSync(srcDir, { recursive: true, force: true });
      rmSync(dstDir, { recursive: true, force: true });
    }
  });

  test("create_mesh_with_three_depots_and_fan_out_sync", async ({ page }) => {
    const srcDir = mkdtempSync(join(tmpdir(), "mesh-e2e-fan-src-"));
    const dst1 = mkdtempSync(join(tmpdir(), "mesh-e2e-fan-d1-"));
    const dst2 = mkdtempSync(join(tmpdir(), "mesh-e2e-fan-d2-"));
    writeFileSync(join(srcDir, "fan.txt"), "fan-out");

    try {
      await createMeshWithDepots(page, "Fan Out Mesh", [
        { name: "Source", root: srcDir },
        { name: "Target1", root: dst1 },
        { name: "Target2", root: dst2 },
      ]);
      await addLink(page, "Source", "Target1");
      await addLink(page, "Source", "Target2");

      await page.getByRole("link", { name: "Topology" }).click();
      await expect(page.getByTestId("topology-graph")).toBeVisible({ timeout: 10000 });

      await planAndApprove(page);
      await startSync(page);

      await expect.poll(() => existsSync(join(dst1, "fan.txt")), { timeout: 20000 }).toBe(true);
      await expect.poll(() => existsSync(join(dst2, "fan.txt")), { timeout: 20000 }).toBe(true);
    } finally {
      rmSync(srcDir, { recursive: true, force: true });
      rmSync(dst1, { recursive: true, force: true });
      rmSync(dst2, { recursive: true, force: true });
    }
  });

  test("detect_and_resolve_modify_modify_conflict", async ({ page, request }) => {
    const left = mkdtempSync(join(tmpdir(), "mesh-conflict-l-"));
    const right = mkdtempSync(join(tmpdir(), "mesh-conflict-r-"));
    writeFileSync(join(left, "doc.txt"), "left");
    writeFileSync(join(right, "doc.txt"), "right");

    try {
      await createMeshWithDepots(page, "Conflict Mesh", [
        { name: "Left", root: left },
        { name: "Right", root: right },
      ]);
      await addLink(page, "Left", "Right");

      const meshRes = await request.get("/api/mesh");
      const meshes = (await meshRes.json()).meshes as { id: string; name: string }[];
      const meshId = meshes.find((m) => m.name === "Conflict Mesh")!.id;

      await request.post(`/api/mesh/${meshId}/conflicts`, {
        data: {
          type: "modify_modify",
          participants: ["/doc.txt", "/doc.txt"],
          status: "pending",
        },
      });

      await page.getByRole("link", { name: "Conflicts" }).click();
      await expect(page.getByTestId("conflict-view")).toBeVisible();
      await expect(page.getByTestId("conflict-list")).toContainText("modify_modify");
      await page.getByText("modify_modify").click();
      await page.getByTestId("keep-both-btn").click();
      await expect(page.getByTestId("conflict-list")).not.toContainText("modify_modify", {
        timeout: 5000,
      });
    } finally {
      rmSync(left, { recursive: true, force: true });
      rmSync(right, { recursive: true, force: true });
    }
  });

  test("block_large_delete_without_confirmation", async ({ page, request }) => {
    const srcDir = mkdtempSync(join(tmpdir(), "mesh-del-src-"));
    const dstDir = mkdtempSync(join(tmpdir(), "mesh-del-dst-"));
    for (let i = 0; i < 12; i++) {
      writeFileSync(join(dstDir, `orphan-${i}.txt`), "x");
    }

    try {
      await createMeshWithDepots(page, "Delete Mesh", [
        { name: "Source", root: srcDir },
        { name: "Target", root: dstDir },
      ]);
      await addLink(page, "Source", "Target");

      const meshRes = await request.get("/api/mesh");
      const meshes = (await meshRes.json()).meshes as { id: string; name: string }[];
      const meshId = meshes.find((m) => m.name === "Delete Mesh")!.id;

      await request.patch(`/api/mesh/${meshId}`, {
        data: { policy: { deletePolicy: "allow" } },
      });

      await page.getByRole("link", { name: "Plan" }).click();
      await page.getByTestId("generate-plan-btn").click();
      await expect(page.getByTestId("destructive-warning")).toBeVisible({ timeout: 10000 });

      const detail = await (await request.get(`/api/mesh/${meshId}`)).json();
      const sessionRes = await request.post(`/api/mesh/${meshId}/sessions`, {
        data: { action: "create" },
      });
      const { session } = await sessionRes.json();
      const planRes = await request.post(`/api/mesh/${meshId}/plan`, {
        data: {
          sourceDepotId: detail.mesh.depots[0].id,
          targetDepotId: detail.mesh.depots[1].id,
        },
      });
      const changeSet = (await planRes.json()).changeSet;
      const startRes = await request.post(`/api/mesh/${meshId}/sessions`, {
        data: { action: "start", sessionId: session.id, changeSet, confirmedDestructive: false },
      });
      expect(startRes.status()).toBe(400);
      expect(await startRes.json()).toHaveProperty("requiresConfirmation", true);

      const countBefore = existsSync(join(dstDir, "orphan-0.txt"));
      expect(countBefore).toBe(true);
    } finally {
      rmSync(srcDir, { recursive: true, force: true });
      rmSync(dstDir, { recursive: true, force: true });
    }
  });

  test("pause_resume_and_cancel_session", async ({ page }) => {
    const srcDir = mkdtempSync(join(tmpdir(), "mesh-pause-src-"));
    const dstDir = mkdtempSync(join(tmpdir(), "mesh-pause-dst-"));
    for (let i = 0; i < 8; i++) {
      writeFileSync(join(srcDir, `file-${i}.txt`), `data-${i}`);
    }

    try {
      await createMeshWithDepots(page, "Pause Mesh", [
        { name: "Source", root: srcDir },
        { name: "Target", root: dstDir },
      ]);
      await addLink(page, "Source", "Target");
      await planAndApprove(page);
      await startSync(page);

      await expect(page.getByTestId("pause-btn")).toBeVisible({ timeout: 10000 });
      await page.getByTestId("pause-btn").click();
      await expect(page.getByTestId("session-state")).toContainText("paused", { timeout: 10000 });

      await page.getByTestId("resume-btn").click();
      await expect(page.getByTestId("session-state")).toContainText("running", { timeout: 10000 });

      await page.getByTestId("cancel-btn").click();
      await expect(page.getByTestId("session-state")).toContainText("cancelled", { timeout: 15000 });
    } finally {
      rmSync(srcDir, { recursive: true, force: true });
      rmSync(dstDir, { recursive: true, force: true });
    }
  });

  test("permission_restricted_operator_cannot_manage_credentials", async ({ page }) => {
    await page.goto("/mesh");
    await page.getByTestId("new-mesh-name").fill("Cred Mesh");
    await page.getByTestId("create-mesh-btn").click();
    await page.getByRole("link", { name: "Cred Mesh" }).click();
    await page.getByTestId("manage-credentials-btn").click();
    await expect(page.getByTestId("credential-denied")).toBeVisible({ timeout: 5000 });
  });

  test("export_and_import_mesh_configuration", async ({ page, request }) => {
    const srcDir = mkdtempSync(join(tmpdir(), "mesh-imp-src-"));
    const dstDir = mkdtempSync(join(tmpdir(), "mesh-imp-dst-"));

    try {
      await createMeshWithDepots(page, "Export Mesh", [
        { name: "A", root: srcDir },
        { name: "B", root: dstDir },
      ]);
      await addLink(page, "A", "B");

      const listRes = await request.get("/api/mesh");
      const meshId = (
        (await listRes.json()).meshes as { id: string; name: string }[]
      ).find((m) => m.name === "Export Mesh")!.id;

      const exportRes = await request.get(`/api/mesh/${meshId}/export`);
      const exported = await exportRes.json();
      expect(exported.mesh).toBeDefined();
      expect(JSON.stringify(exported)).not.toContain("secret");

      const importRes = await request.post("/api/mesh/import", { data: exported });
      expect(importRes.ok()).toBeTruthy();
      const imported = (await importRes.json()) as { mesh: { id: string; links: unknown[] } };
      expect(imported.mesh.links.length).toBeGreaterThan(0);

      await page.goto(`/mesh/${imported.mesh.id}/topology`);
      await expect(page.getByTestId("topology-graph")).toBeVisible({ timeout: 10000 });
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

  test("archived_mesh_is_hidden_but_history_remains", async ({ page, request }) => {
    await page.goto("/mesh");
    await page.getByTestId("new-mesh-name").fill("Archive Mesh");
    await page.getByTestId("create-mesh-btn").click();
    await page.getByRole("link", { name: "Archive Mesh" }).click();

    const listRes = await request.get("/api/mesh");
    const meshId = (
      (await listRes.json()).meshes as { id: string; name: string }[]
    ).find((m) => m.name === "Archive Mesh")!.id;

    await request.post(`/api/mesh/${meshId}/sessions`, { data: { action: "create" } });
    await request.delete(`/api/mesh/${meshId}`);

    await page.goto("/mesh");
    await expect(page.getByRole("link", { name: "Archive Mesh" })).not.toBeVisible();
    await page.getByTestId("show-archived").check();
    await expect(page.getByRole("link", { name: "Archive Mesh" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("link", { name: "Archive Mesh" }).click();
    await page.getByRole("link", { name: "History" }).click();
    await expect(page.getByTestId("mesh-history")).toBeVisible();
  });
});
