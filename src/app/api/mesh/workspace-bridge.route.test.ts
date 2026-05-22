// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: Mesh create with workspace snapshot persists

import { describe, it, expect, beforeEach } from "vitest";
import { POST as createMesh } from "./route";
import { GET as getMesh } from "./[meshId]/route";
import {
  buildMeshCreatePayload,
  captureWorkspaceSnapshot,
  parseWorkspaceSnapshotFromMesh,
  WORKSPACE_SNAPSHOT_TAG,
} from "@/lib/workspace-mesh-bridge";

describe("workspace mesh bridge API BUILD_MESH_PAYLOAD [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  beforeEach(() => {
    process.env.MESH_DATA_DIR = "";
  });

  it("BUILD_MESH_PAYLOAD_post_mesh_with_workspace_snapshot_round_trips", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneColumn",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/ws-a",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "WS API", snapshot });
    const createRes = await createMesh(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { mesh: { id: string; tags: string[] } };
    expect(created.mesh.tags).toContain(WORKSPACE_SNAPSHOT_TAG);

    const getRes = await getMesh(new Request("http://localhost"), {
      params: Promise.resolve({ meshId: created.mesh.id }),
    });
    const loaded = (await getRes.json()) as { mesh: Parameters<typeof parseWorkspaceSnapshotFromMesh>[0] };
    const parsed = parseWorkspaceSnapshotFromMesh(loaded.mesh);
    expect(parsed?.panes[0].path).toBe("/tmp/ws-a");
    expect(parsed?.layout).toBe("OneColumn");
  });
});
