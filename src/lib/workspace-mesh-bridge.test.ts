// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: Workspace ↔ mesh bridge unit tests

import { describe, it, expect } from "vitest";
import {
  WORKSPACE_SNAPSHOT_TAG,
  WORKSPACE_SNAPSHOT_VERSION,
  buildMeshCreatePayload,
  buildMeshPatchPayload,
  buildMeshUpdateDescription,
  captureWorkspaceSnapshot,
  diffWorkspaceSnapshots,
  extractNotePrefixFromDescription,
  parseWorkspaceSnapshotFromMesh,
  planDepotSync,
  depotPathsFromMesh,
  applyMaxPanesLimit,
  appendSnapshotLayoutWarnings,
  buildWorkspaceRestoreBundle,
  workspaceSnapshotSummary,
  type WorkspaceCaptureInput,
} from "./workspace-mesh-bridge";
import type { FileStat } from "./files.types";
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

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] APPEND_SNAPSHOT_LAYOUT_WARNINGS
  it("APPEND_SNAPSHOT_LAYOUT_WARNINGS_when_tile_without_layout_field", () => {
    const tileSnapshot = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/a",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const warn = appendSnapshotLayoutWarnings(
      tileSnapshot,
      '{"workspaceSnapshot":{"version":1,"focusIndex":0}}',
      null,
    );
    expect(warn).toContain("Layout was not stored");
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] APPEND_SNAPSHOT_LAYOUT_WARNINGS
  it("APPEND_SNAPSHOT_LAYOUT_WARNINGS_when_tile_and_unreadable_snapshot_json", () => {
    const tileSnapshot = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/a",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const warn = appendSnapshotLayoutWarnings(
      tileSnapshot,
      '{"layout":"Tile","broken":true}',
      "Existing.",
    );
    expect(warn).toContain("Existing.");
    expect(warn).toContain("Workspace snapshot JSON could not be read");
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] BUILD_WORKSPACE_RESTORE_BUNDLE
  it("BUILD_WORKSPACE_RESTORE_BUNDLE_hydrates_panes_and_restore_props", async () => {
    const filesA: FileStat[] = [
      {
        name: "a.txt",
        path: "/tmp/a/a.txt",
        isDirectory: false,
        size: 1,
        mtime: new Date("2024-01-01"),
        extension: "txt",
      },
    ];
    const filesB: FileStat[] = [
      {
        name: "b.txt",
        path: "/tmp/b/b.txt",
        isDirectory: false,
        size: 2,
        mtime: new Date("2024-01-02"),
        extension: "txt",
      },
    ];
    const listDir = async (p: string) => (p === "/tmp/a" ? filesA : filesB);
    const bundle = await buildWorkspaceRestoreBundle(baseSnapshot, listDir);
    expect(bundle.initialPanes).toHaveLength(2);
    expect(bundle.initialPanes[0]?.path).toBe("/tmp/a");
    expect(bundle.restoreUi.focusIndex).toBe(1);
    expect(bundle.restoreUi.linkedMode).toBe(true);
    expect(bundle.restoreLayout).toBe("OneRow");
    expect(bundle.restorePaneMeta[0]?.cursor).toBe(2);
  });

  it("WORKSPACE_SNAPSHOT_SUMMARY_lists_paths", () => {
    const s = workspaceSnapshotSummary(baseSnapshot);
    expect(s.panePaths).toEqual(["/tmp/a", "/tmp/b"]);
    expect(s.comparisonMode).toBe("name");
  });

  it("CAPTURE_SNAPSHOT_normalizes_config_style_tile_layout", () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "tile" as WorkspaceCaptureInput["layout"],
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/a",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    expect(snapshot.layout).toBe("Tile");
    const payload = buildMeshCreatePayload({ name: "Tile norm", snapshot });
    expect(payload.description as string).toContain('"layout":"Tile"');
  });

  it("PARSE_SNAPSHOT_FROM_MESH_accepts_config_style_oneColumn_in_json", () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneColumn",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/a",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "Col", snapshot });
    const corrupted = (payload.description as string).replace(
      '"OneColumn"',
      '"oneColumn"',
    );
    const mesh: Pick<Mesh, "description" | "tags" | "depots"> = {
      description: corrupted,
      tags: [WORKSPACE_SNAPSHOT_TAG],
      depots: (payload.depots as { root: string }[]).map((d, i) => ({
        id: `d${i}`,
        name: `Pane ${i + 1}`,
        kind: "local",
        root: d.root,
        accessMode: "read_write",
      })),
    };
    expect(parseWorkspaceSnapshotFromMesh(mesh)?.layout).toBe("OneColumn");
  });

  it("PARSE_SNAPSHOT_FROM_MESH_accepts_display_label_One_Row_in_json", () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneRow",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/a",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "Row label", snapshot });
    const withDisplayLabel = (payload.description as string).replace(
      '"OneRow"',
      '"One Row"',
    );
    const mesh: Pick<Mesh, "description" | "tags" | "depots"> = {
      description: withDisplayLabel,
      tags: [WORKSPACE_SNAPSHOT_TAG],
      depots: (payload.depots as { root: string }[]).map((d, i) => ({
        id: `d${i}`,
        name: `Pane ${i + 1}`,
        kind: "local",
        root: d.root,
        accessMode: "read_write",
      })),
    };
    expect(parseWorkspaceSnapshotFromMesh(mesh)?.layout).toBe("OneRow");
  });

  it("PARSE_SNAPSHOT_FROM_MESH_round_trips_displaySpecId_v2", () => {
    const snapshot = captureWorkspaceSnapshot({
      ...baseSnapshot,
      panes: [
        {
          ...baseSnapshot.panes[0],
          displaySpecId: "spec-abc",
        },
      ],
    });
    expect(snapshot.version).toBe(WORKSPACE_SNAPSHOT_VERSION);
    const payload = buildMeshCreatePayload({ name: "Filter", snapshot });
    const mesh: Pick<Mesh, "description" | "tags" | "depots"> = {
      description: payload.description as string,
      tags: [WORKSPACE_SNAPSHOT_TAG],
      depots: [],
    };
    const parsed = parseWorkspaceSnapshotFromMesh(mesh);
    expect(parsed?.panes[0].displaySpecId).toBe("spec-abc");
  });

  it("PARSE_SNAPSHOT_FROM_MESH_accepts_root_level_snapshot_without_wrapper", () => {
    const mesh: Pick<Mesh, "description" | "tags" | "depots"> = {
      description: JSON.stringify({
        version: 1,
        layout: "OneRow",
        focusIndex: 0,
        linkedMode: false,
        comparisonMode: "off",
        panes: [
          {
            path: "/tmp/a",
            sortBy: "name",
            sortDirection: "asc",
            sortDirsFirst: true,
            cursor: 0,
          },
        ],
      }),
      tags: [WORKSPACE_SNAPSHOT_TAG],
      depots: [
        {
          id: "d0",
          name: "Pane 1",
          kind: "local",
          root: "/tmp/a",
          accessMode: "read_write",
        },
      ],
    };
    expect(parseWorkspaceSnapshotFromMesh(mesh)?.layout).toBe("OneRow");
  });

  it("buildMeshPatchPayload_preserves_note_prefix_from_existing_description", () => {
    const snapshot = baseSnapshot;
    const existing = buildMeshUpdateDescription(snapshot, "kept note");
    const patch = buildMeshPatchPayload({
      snapshot,
      existingDescription: existing,
    });
    expect(extractNotePrefixFromDescription(patch.description)).toBe("kept note");
    expect(patch.tags).toContain(WORKSPACE_SNAPSHOT_TAG);
  });

  it("planDepotSync_updates_adds_and_removes_depots", () => {
    const twoToOne = planDepotSync(
      [
        { id: "d1", name: "Pane 1", root: "/old-a" },
        { id: "d2", name: "Pane 2", root: "/old-b" },
      ],
      [
        { path: "/new-a", sortBy: "name", sortDirection: "asc", sortDirsFirst: true, cursor: 0 },
      ],
    );
    expect(twoToOne).toContainEqual({
      op: "update",
      depotId: "d1",
      root: "/new-a",
      name: "Pane 1",
    });
    expect(twoToOne).toContainEqual({ op: "remove", depotId: "d2" });

    const oneToTwo = planDepotSync(
      [{ id: "d1", name: "Pane 1", root: "/a" }],
      [
        { path: "/a", sortBy: "name", sortDirection: "asc", sortDirsFirst: true, cursor: 0 },
        { path: "/b", sortBy: "name", sortDirection: "asc", sortDirsFirst: true, cursor: 0 },
      ],
    );
    expect(oneToTwo).toContainEqual({ op: "add", name: "Pane 2", root: "/b" });
  });

  it("diffWorkspaceSnapshots_lists_layout_and_pane_changes", () => {
    const current = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/tmp/changed",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const changes = diffWorkspaceSnapshots(baseSnapshot, current);
    expect(changes.some((c) => c.field === "layout")).toBe(true);
    expect(changes.some((c) => c.field === "Pane 1 path")).toBe(true);
  });

  it("diffWorkspaceSnapshots_returns_empty_when_equal", () => {
    expect(diffWorkspaceSnapshots(baseSnapshot, baseSnapshot)).toEqual([]);
  });

  it("PARSE_SNAPSHOT_FROM_MESH_round_trips_focus_linked_comparison", () => {
    const payload = buildMeshCreatePayload({ name: "UI", snapshot: baseSnapshot });
    const mesh: Pick<Mesh, "description" | "tags" | "depots"> = {
      description: payload.description as string,
      tags: [WORKSPACE_SNAPSHOT_TAG],
      depots: [],
    };
    const parsed = parseWorkspaceSnapshotFromMesh(mesh);
    expect(parsed?.focusIndex).toBe(1);
    expect(parsed?.linkedMode).toBe(true);
    expect(parsed?.comparisonMode).toBe("name");
  });
});
