// [REQ-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: UPDATE_EXISTING_WORKSPACE — PUT workspace update round-trip

import { describe, it, expect, beforeEach } from "vitest";
import { resetMeshRuntime } from "@/lib/mesh/runtime/mesh-runtime";
import { POST as createMesh } from "../../route";
import { PUT as putWorkspace } from "./route";
import { GET as getMesh } from "../route";
import {
  buildMeshCreatePayload,
  captureWorkspaceSnapshot,
  parseWorkspaceSnapshotFromMesh,
} from "@/lib/workspace-mesh-bridge";

describe("PUT /api/mesh/:meshId/workspace [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  beforeEach(() => {
    process.env.MESH_DATA_DIR = "";
    resetMeshRuntime();
  });

  it("UPDATE_EXISTING_WORKSPACE_round_trips_snapshot_and_depots", async () => {
    const initial = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/ws-initial",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const createRes = await createMesh(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildMeshCreatePayload({ name: "WS Update", snapshot: initial }),
        ),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { mesh: { id: string } };

    const updatedSnapshot = captureWorkspaceSnapshot({
      layout: "OneColumn",
      focusIndex: 0,
      linkedMode: true,
      comparisonMode: "size",
      panes: [
        {
          path: "/tmp/ws-updated",
          sortBy: "size",
          sortDirection: "desc",
          sortDirsFirst: false,
          cursor: 1,
        },
        {
          path: "/tmp/ws-second",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });

    const putRes = await putWorkspace(
      new Request("http://localhost/api/mesh/x/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "WS Updated Name",
          note: "update note",
          snapshot: updatedSnapshot,
        }),
      }),
      { params: Promise.resolve({ meshId: created.mesh.id }) },
    );
    expect(putRes.status).toBe(200);
    const putBody = (await putRes.json()) as {
      mesh: { name: string; description?: string; depots: { root: string }[] };
    };
    expect(putBody.mesh.name).toBe("WS Updated Name");
    expect(putBody.mesh.depots).toHaveLength(2);
    expect(putBody.mesh.depots[0].root).toBe("/tmp/ws-updated");
    expect(putBody.mesh.depots[1].root).toBe("/tmp/ws-second");

    const getRes = await getMesh(new Request("http://localhost"), {
      params: Promise.resolve({ meshId: created.mesh.id }),
    });
    const loaded = (await getRes.json()) as {
      mesh: Parameters<typeof parseWorkspaceSnapshotFromMesh>[0];
    };
    const parsed = parseWorkspaceSnapshotFromMesh(loaded.mesh);
    expect(parsed?.layout).toBe("OneColumn");
    expect(parsed?.linkedMode).toBe(true);
    expect(parsed?.panes).toHaveLength(2);
    expect(parsed?.panes[0].path).toBe("/tmp/ws-updated");
  });

  // [REQ-PANE_DISPLAY_FILTER] [REQ-WORKSPACE_MESH_BRIDGE] v2 snapshot with displaySpecId round-trips via PUT
  it("UPDATE_EXISTING_WORKSPACE_round_trips_displaySpecId_on_v2_snapshot", async () => {
    const initial = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/ws-filter-initial",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const createRes = await createMesh(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildMeshCreatePayload({ name: "WS Filter", snapshot: initial }),
        ),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { mesh: { id: string } };

    const updatedSnapshot = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/ws-filter-updated",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
          displaySpecId: "spec-abc",
        },
      ],
    });

    const putRes = await putWorkspace(
      new Request("http://localhost/api/mesh/x/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: updatedSnapshot }),
      }),
      { params: Promise.resolve({ meshId: created.mesh.id }) },
    );
    expect(putRes.status).toBe(200);

    const getRes = await getMesh(new Request("http://localhost"), {
      params: Promise.resolve({ meshId: created.mesh.id }),
    });
    const loaded = (await getRes.json()) as {
      mesh: Parameters<typeof parseWorkspaceSnapshotFromMesh>[0];
    };
    const parsed = parseWorkspaceSnapshotFromMesh(loaded.mesh);
    expect(parsed?.panes[0].displaySpecId).toBe("spec-abc");
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] UPDATE_EXISTING_WORKSPACE — unknown mesh returns 404
  it("UPDATE_EXISTING_WORKSPACE_returns_404_for_unknown_meshId", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/missing",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const res = await putWorkspace(
      new Request("http://localhost/api/mesh/no-such-mesh/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      }),
      { params: Promise.resolve({ meshId: "no-such-mesh" }) },
    );
    expect(res.status).toBe(404);
  });

  it("UPDATE_EXISTING_WORKSPACE_returns_400_for_invalid_snapshot", async () => {
    const res = await putWorkspace(
      new Request("http://localhost/api/mesh/any/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: { version: 1, panes: [] } }),
      }),
      { params: Promise.resolve({ meshId: "any" }) },
    );
    expect(res.status).toBe(400);
  });
});
