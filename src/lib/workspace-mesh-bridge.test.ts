// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: Workspace ↔ mesh bridge unit tests

import { describe, it, expect } from "vitest";
import {
  WORKSPACE_SNAPSHOT_TAG,
  WORKSPACE_SNAPSHOT_VERSION,
  buildMeshCreatePayload,
  captureWorkspaceSnapshot,
  parseWorkspaceSnapshotFromMesh,
  depotPathsFromMesh,
  applyMaxPanesLimit,
  workspaceSnapshotSummary,
} from "./workspace-mesh-bridge";
import type { Mesh } from "./mesh/domain";

const baseSnapshot = captureWorkspaceSnapshot({
  layout: "OneRow",
  focusIndex: 1,
  linkedMode: true,
  comparisonMode: "name",
  panes: [
    {
      path: "/tmp/a",
      sortBy: "size",
      sortDirection: "desc",
      sortDirsFirst: false,
      cursor: 2,
    },
    {
      path: "/tmp/b",
      sortBy: "name",
      sortDirection: "asc",
      sortDirsFirst: true,
      cursor: 0,
    },
  ],
});

describe("REQ-WORKSPACE_MESH_BRIDGE [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  it("CAPTURE_SNAPSHOT_preserves_version_and_panes", () => {
    expect(baseSnapshot.version).toBe(WORKSPACE_SNAPSHOT_VERSION);
    expect(baseSnapshot.panes).toHaveLength(2);
    expect(baseSnapshot.layout).toBe("OneRow");
  });

  it("BUILD_MESH_PAYLOAD_maps_panes_to_local_depots", () => {
    const payload = buildMeshCreatePayload({
      name: "My Workspace",
      snapshot: baseSnapshot,
    });
    expect(payload.name).toBe("My Workspace");
    expect(payload.tags).toEqual([WORKSPACE_SNAPSHOT_TAG]);
    expect(payload.links).toEqual([]);
    const depots = payload.depots as { root: string; kind: string }[];
    expect(depots).toHaveLength(2);
    expect(depots[0].root).toBe("/tmp/a");
    expect(depots[0].kind).toBe("local");
    const desc = payload.description as string;
    expect(desc).toContain("workspaceSnapshot");
  });

  it("PARSE_SNAPSHOT_FROM_MESH_round_trips_description", () => {
    const payload = buildMeshCreatePayload({ name: "R", snapshot: baseSnapshot });
    const mesh: Pick<Mesh, "description" | "tags" | "depots"> = {
      description: payload.description as string,
      tags: [WORKSPACE_SNAPSHOT_TAG],
      depots: (payload.depots as { root: string }[]).map((d, i) => ({
        id: `d${i}`,
        name: `Pane ${i + 1}`,
        kind: "local",
        root: d.root,
        accessMode: "read_write",
      })),
    };
    const parsed = parseWorkspaceSnapshotFromMesh(mesh);
    expect(parsed?.layout).toBe("OneRow");
    expect(parsed?.linkedMode).toBe(true);
    expect(parsed?.panes[0].path).toBe("/tmp/a");
  });

  it("PARSE_SNAPSHOT_FROM_MESH_depot_only_fallback", () => {
    const mesh: Pick<Mesh, "description" | "tags" | "depots"> = {
      description: "plain note",
      tags: [],
      depots: [
        {
          id: "1",
          name: "A",
          kind: "local",
          root: "/x",
          accessMode: "read_write",
        },
      ],
    };
    const parsed = parseWorkspaceSnapshotFromMesh(mesh);
    expect(parsed?.panes[0].path).toBe("/x");
    expect(parsed?.layout).toBe("Tile");
  });

  it("PARSE_SNAPSHOT_FROM_MESH_rejects_invalid_json_and_empty_depots_with_tag", () => {
    const mesh: Pick<Mesh, "description" | "tags" | "depots"> = {
      description: "not json",
      tags: [WORKSPACE_SNAPSHOT_TAG],
      depots: [],
    };
    expect(parseWorkspaceSnapshotFromMesh(mesh)).toBeNull();
  });

  it("BUILD_MESH_PAYLOAD_prefixes_optional_note_before_json", () => {
    const payload = buildMeshCreatePayload({
      name: "Note Mesh",
      note: "my note",
      snapshot: baseSnapshot,
    });
    const desc = payload.description as string;
    expect(desc.startsWith("my note\n")).toBe(true);
    expect(desc).toContain("workspaceSnapshot");
    const mesh: Pick<Mesh, "description" | "tags" | "depots"> = {
      description: desc,
      tags: [WORKSPACE_SNAPSHOT_TAG],
      depots: [],
    };
    expect(parseWorkspaceSnapshotFromMesh(mesh)?.layout).toBe("OneRow");
  });

  it("depotPathsFromMesh_returns_roots_in_order", () => {
    const paths = depotPathsFromMesh({
      depots: [
        {
          id: "1",
          name: "A",
          kind: "local",
          root: "/first",
          accessMode: "read_write",
        },
        {
          id: "2",
          name: "B",
          kind: "local",
          root: "/second",
          accessMode: "read_write",
        },
      ],
    });
    expect(paths).toEqual(["/first", "/second"]);
  });

  it("APPLY_MAX_PANES_LIMIT_truncates_when_over_max", () => {
    const { snapshot, truncated } = applyMaxPanesLimit(baseSnapshot, 1);
    expect(truncated).toBe(true);
    expect(snapshot.panes).toHaveLength(1);
    expect(snapshot.focusIndex).toBe(0);
  });

  it("WORKSPACE_SNAPSHOT_SUMMARY_lists_paths", () => {
    const s = workspaceSnapshotSummary(baseSnapshot);
    expect(s.panePaths).toEqual(["/tmp/a", "/tmp/b"]);
    expect(s.comparisonMode).toBe("name");
  });
});
