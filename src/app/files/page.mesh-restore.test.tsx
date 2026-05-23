// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: Files page server restore passes layout to WorkspaceView

import { describe, it, expect, vi, beforeEach } from "vitest";
import { isValidElement, type ReactElement } from "react";
import { POST as createMesh } from "@/app/api/mesh/route";
import {
  buildMeshCreatePayload,
  captureWorkspaceSnapshot,
} from "@/lib/workspace-mesh-bridge";
import FilesPage from "./page";

vi.mock("@/lib/files.data", () => ({
  listDirectory: vi.fn(async () => []),
  getUserHomeDirectory: vi.fn(() => "/home/test"),
  sortFiles: vi.fn((files: unknown[]) => files),
}));

function workspaceViewProps(
  element: ReactElement | Awaited<ReturnType<typeof FilesPage>>,
): Record<string, unknown> {
  if (!isValidElement(element)) {
    throw new Error("FilesPage did not return a valid element");
  }
  return element.props as Record<string, unknown>;
}

describe("REQ-WORKSPACE_MESH_BRIDGE FilesPage RESTORE_ON_FILES_PAGE [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  beforeEach(() => {
    process.env.MESH_DATA_DIR = "";
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_ON_FILES_PAGE — how: server passes restoreLayout and restoredFromMesh from mesh snapshot.
  it("passes_restoreLayout_OneRow_and_restoredFromMesh_when_mesh_snapshot_exists", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneRow",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/ws-pane-a",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "Page restore", snapshot });
    const createRes = await createMesh(
      new Request("http://localhost/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { mesh: { id: string } };

    const element = await FilesPage({
      searchParams: Promise.resolve({ meshId: created.mesh.id }),
    });
    const props = workspaceViewProps(element);

    expect(props.meshId).toBe(created.mesh.id);
    expect(props.restoredFromMesh).toBe(true);
    expect(props.restoreLayout).toBe("OneRow");
    expect((props.restoreUi as { layout: string } | undefined)?.layout).toBe("OneRow");
    expect((props.initialPanes as { path: string }[])[0]?.path).toBe("/tmp/ws-pane-a");
    expect(props.loadedMeshName).toBe("Page restore");
    expect((props.loadedSnapshot as { layout: string } | undefined)?.layout).toBe("OneRow");
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_ON_FILES_PAGE
  // how: missing mesh sets restoreWarning, meshRestorePending=true, empty initialPanes (client will rehydrate).
  it("sets_restoreWarning_when_meshId_not_found_on_server", async () => {
    const element = await FilesPage({
      searchParams: Promise.resolve({ meshId: "mesh-does-not-exist" }),
    });
    const props = workspaceViewProps(element);

    expect(props.restoredFromMesh).toBe(false);
    expect(props.restoreLayout).toBeUndefined();
    expect(String(props.restoreWarning)).toContain("Mesh not found on server");
    expect(props.meshId).toBe("mesh-does-not-exist");
    expect(props.meshRestorePending).toBe(true);
    expect((props.initialPanes as unknown[]).length).toBe(0);
  });
});
