// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: Mesh restore applies layout geometry

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig } from "@/lib/config.types";
import type { LayoutType } from "@/lib/files.layout";
import {
  buildMeshCreatePayload,
  captureWorkspaceSnapshot,
  parseWorkspaceSnapshotFromMesh,
} from "@/lib/workspace-mesh-bridge";

global.fetch = vi.fn();

const mockKeybindings = [
  { key: "Tab", action: "navigate.tab", description: "Next pane", category: "navigation" as const },
];

const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 1,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: false,
};

const mockColumns = [
  { id: "name" as const, visible: true },
];

const mockCopy = {
  title: "File Manager",
  subtitle: "Browse files",
};

function mockPaneFiles(dir: string): FileStat[] {
  return [
    {
      name: "file.txt",
      path: `${dir}/file.txt`,
      isDirectory: false,
      size: 1,
      mtime: new Date("2024-01-01"),
      extension: "txt",
    },
  ];
}

const threeInitialPanes = [
  { path: "/pane0", files: mockPaneFiles("/pane0") },
  { path: "/pane1", files: mockPaneFiles("/pane1") },
  { path: "/pane2", files: mockPaneFiles("/pane2") },
];

describe("REQ-WORKSPACE_MESH_BRIDGE mesh restore [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW — how: restoreUi OneRow drives pane geometry and layout select.
  it("RESTORE_FROM_MESH_applies_OneRow_layout_geometry", async () => {
    render(
      <WorkspaceView
        initialPanes={threeInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        restoredFromMesh
        restoreUi={{
          layout: "OneRow",
          focusIndex: 0,
          linkedMode: false,
          comparisonMode: "off",
        }}
      />,
    );

    await waitFor(() => {
      const pane2 = screen.getByTestId("pane-2");
      expect(pane2).toHaveStyle({ top: "0px" });
    });

    expect(screen.getByTestId("workspace-layout-select")).toHaveValue("OneRow");
    expect(screen.getByDisplayValue("One Row")).toBeInTheDocument();
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW — how: restoredFromMesh without layout props falls back to Tile.
  it("RESTORE_FROM_MESH_without_restoreUi_uses_Tile_geometry_for_three_panes", async () => {
    render(
      <WorkspaceView
        initialPanes={threeInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        restoredFromMesh
      />,
    );

    await waitFor(() => {
      const pane2 = screen.getByTestId("pane-2");
      // Tile: third pane stacks in right column (container height 680 = innerHeight - 120)
      expect(pane2).toHaveStyle({ top: "340px" });
    });
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] PARSE_SNAPSHOT_FROM_MESH + RESTORE_LAYOUT — how: parsed snapshot restoreUi applies OneRow geometry.
  it("RESTORE_FROM_MESH_round_trip_OneRow_layout_reaches_WorkspaceView", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneRow",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/pane0",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
        {
          path: "/pane1",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
        {
          path: "/pane2",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "Round trip", snapshot });
    const mesh = {
      description: payload.description as string,
      tags: ["workspace-snapshot"],
      depots: (payload.depots as { root: string }[]).map((d, i) => ({
        id: `d${i}`,
        name: `Pane ${i + 1}`,
        kind: "local" as const,
        root: d.root,
        accessMode: "read_write" as const,
      })),
    };
    const parsed = parseWorkspaceSnapshotFromMesh(mesh);
    expect(parsed?.layout).toBe("OneRow");

    render(
      <WorkspaceView
        initialPanes={threeInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        restoredFromMesh
        restoreUi={
          parsed
            ? {
                layout: parsed.layout,
                focusIndex: parsed.focusIndex,
                linkedMode: parsed.linkedMode,
                comparisonMode: parsed.comparisonMode,
              }
            : undefined
        }
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-2")).toHaveStyle({ top: "0px" });
    });
    expect(screen.getByTestId("workspace-layout-select")).toHaveValue("OneRow");
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] NORMALIZE_LAYOUT — how: oneColumn alias in JSON parses to OneColumn.
  it("RESTORE_FROM_MESH_rehydrates_layout_when_snapshot_json_uses_invalid_layout_casing", () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneColumn",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/pane0",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
        {
          path: "/pane1",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "Casing", snapshot });
    const corruptedDescription = (payload.description as string).replace(
      '"OneColumn"',
      '"oneColumn"',
    );
    const mesh = {
      description: corruptedDescription,
      tags: ["workspace-snapshot"],
      depots: (payload.depots as { root: string }[]).map((d, i) => ({
        id: `d${i}`,
        name: `Pane ${i + 1}`,
        kind: "local" as const,
        root: d.root,
        accessMode: "read_write" as const,
      })),
    };

    const parsed = parseWorkspaceSnapshotFromMesh(mesh);
    expect(parsed?.layout).toBe("OneColumn");
  });

  const twoFiles = (dir: string): FileStat[] => [
    {
      name: "alpha.txt",
      path: `${dir}/alpha.txt`,
      isDirectory: false,
      size: 1,
      mtime: new Date("2024-01-01"),
      extension: "txt",
    },
    {
      name: "beta.txt",
      path: `${dir}/beta.txt`,
      isDirectory: false,
      size: 2,
      mtime: new Date("2024-01-02"),
      extension: "txt",
    },
  ];

  const twoInitialPanes = [
    { path: "/pane0", files: twoFiles("/pane0") },
    { path: "/pane1", files: twoFiles("/pane1") },
  ];

  function buildTwoPaneMeshFromLayout(layout: LayoutType) {
    const snapshot = captureWorkspaceSnapshot({
      layout,
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/pane0",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
        {
          path: "/pane1",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: `Layout ${layout}`, snapshot });
    const mesh = {
      description: payload.description as string,
      tags: ["workspace-snapshot"],
      depots: (payload.depots as { root: string }[]).map((d, i) => ({
        id: `d${i}`,
        name: `Pane ${i + 1}`,
        kind: "local" as const,
        root: d.root,
        accessMode: "read_write" as const,
      })),
    };
    return parseWorkspaceSnapshotFromMesh(mesh);
  }

  // [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_ON_FILES_PAGE — how: restoreLayout alone (no restoreUi) applies each layout mode geometry.
  it.each([
    {
      layout: "Fullscreen" as const,
      assertGeometry: async () => {
        const pane0 = screen.getByTestId("pane-0");
        const pane1 = screen.getByTestId("pane-1");
        expect(pane0).toHaveStyle({ left: "0px", top: "0px" });
        expect(pane1).toHaveStyle({ left: "0px", top: "0px" });
      },
    },
    {
      layout: "OneRow" as const,
      assertGeometry: async () => {
        expect(screen.getByTestId("pane-1")).toHaveStyle({ left: "500px" });
      },
    },
    {
      layout: "OneColumn" as const,
      assertGeometry: async () => {
        expect(screen.getByTestId("pane-1")).toHaveStyle({ top: "340px" });
      },
    },
  ])(
    "RESTORE_FROM_MESH_applies_mesh_stored_layout_via_restoreLayout_without_restoreUi ($layout)",
    async ({ layout, assertGeometry }) => {
      const parsed = buildTwoPaneMeshFromLayout(layout);
      expect(parsed?.layout).toBe(layout);

      render(
        <WorkspaceView
          initialPanes={twoInitialPanes}
          keybindings={mockKeybindings}
          copy={mockCopy}
          layout={mockLayout}
          columns={mockColumns}
          restoredFromMesh
          restoreLayout={parsed!.layout}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("workspace-layout-select")).toHaveValue(layout);
      });
      await assertGeometry();
    },
  );

  // [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW — how: client fetch applies layout when server restoreLayout missing.
  it("RESTORE_FROM_MESH_rehydrates_layout_from_api_when_restoreLayout_prop_missing", async () => {
    const layout = "OneRow" as const;
    const snapshot = captureWorkspaceSnapshot({
      layout,
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/pane0",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
        {
          path: "/pane1",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "API rehydrate", snapshot });
    const meshId = "mesh-rehydrate-1";
    const apiBody = {
      mesh: {
        id: meshId,
        description: payload.description as string,
        tags: ["workspace-snapshot"],
        depots: (payload.depots as { root: string }[]).map((d, i) => ({
          id: `d${i}`,
          name: `Pane ${i + 1}`,
          kind: "local",
          root: d.root,
        })),
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes(`/api/mesh/${meshId}`)) {
        return { ok: true, json: async () => apiBody } as Response;
      }
      return { ok: true, json: async () => [] } as Response;
    });

    render(
      <WorkspaceView
        initialPanes={twoInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        meshId={meshId}
        restoredFromMesh
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-layout-select")).toHaveValue("OneRow");
    });
    expect(screen.getByTestId("pane-1")).toHaveStyle({ left: "500px" });
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW — how: meshId fetch rehydrates when restoredFromMesh false.
  it("RESTORE_FROM_MESH_rehydrates_layout_via_meshId_when_server_restore_did_not_run", async () => {
    const layout = "OneRow" as const;
    const snapshot = captureWorkspaceSnapshot({
      layout,
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/pane0",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
        {
          path: "/pane1",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "meshId only rehydrate", snapshot });
    const meshId = "mesh-rehydrate-no-server";
    const apiBody = {
      mesh: {
        id: meshId,
        description: payload.description as string,
        tags: ["workspace-snapshot"],
        depots: (payload.depots as { root: string }[]).map((d, i) => ({
          id: `d${i}`,
          name: `Pane ${i + 1}`,
          kind: "local",
          root: d.root,
        })),
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes(`/api/mesh/${meshId}`)) {
        return { ok: true, json: async () => apiBody } as Response;
      }
      return { ok: true, json: async () => [] } as Response;
    });

    render(
      <WorkspaceView
        initialPanes={twoInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        meshId={meshId}
        restoredFromMesh={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-layout-select")).toHaveValue("OneRow");
    });
    expect(screen.getByTestId("pane-1")).toHaveStyle({ left: "500px" });
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] restore_rehydrates_pane_count_paths_and_ui_state — how: restoreUi focusIndex selects focused pane.
  it("RESTORE_FROM_MESH_applies_focusIndex", async () => {
    render(
      <WorkspaceView
        initialPanes={twoInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        restoredFromMesh
        restoreUi={{
          layout: "Tile",
          focusIndex: 1,
          linkedMode: false,
          comparisonMode: "off",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-1").closest(".border-2")).toHaveClass("border-blue-500");
      expect(screen.getByTestId("pane-0").closest(".border-2")).not.toHaveClass("border-blue-500");
    });
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] restore_rehydrates — how: snapshot linkedMode off overrides layout.defaultLinkedMode.
  it("RESTORE_FROM_MESH_applies_linkedMode_off_over_config_default", async () => {
    render(
      <WorkspaceView
        initialPanes={twoInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={{ ...mockLayout, defaultLinkedMode: true }}
        columns={mockColumns}
        restoredFromMesh
        restoreUi={{
          layout: "Tile",
          focusIndex: 0,
          linkedMode: false,
          comparisonMode: "off",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText(/🔗.*Linked/)).not.toBeInTheDocument();
    });
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] restore_rehydrates — how: restoreUi comparisonMode shows Compare badge.
  it("RESTORE_FROM_MESH_applies_comparisonMode", async () => {
    render(
      <WorkspaceView
        initialPanes={twoInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        restoredFromMesh
        restoreUi={{
          layout: "Tile",
          focusIndex: 0,
          linkedMode: false,
          comparisonMode: "name",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Compare \(name\)/)).toBeInTheDocument();
    });
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] restore_rehydrates — how: restorePaneMeta cursor highlights correct file row.
  it("RESTORE_FROM_MESH_applies_cursor_via_restorePaneMeta", async () => {
    render(
      <WorkspaceView
        initialPanes={twoInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        restoredFromMesh
        restoreUi={{
          layout: "Tile",
          focusIndex: 0,
          linkedMode: false,
          comparisonMode: "off",
        }}
        restorePaneMeta={[
          {
            sortBy: "name",
            sortDirection: "asc",
            sortDirsFirst: true,
            cursor: 1,
          },
          {
            sortBy: "name",
            sortDirection: "asc",
            sortDirsFirst: true,
            cursor: 0,
          },
        ]}
      />,
    );

    await waitFor(() => {
      const pane0 = screen.getByTestId("pane-0");
      expect(within(pane0).getByText("beta.txt").closest(".cursor-pointer")).toHaveClass(
        "bg-blue-100",
      );
      expect(within(pane0).getByText("alpha.txt").closest(".cursor-pointer")).not.toHaveClass(
        "bg-blue-100",
      );
    });
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_MESH_LINK — how: header link targets /mesh with new-tab a11y.
  it("WORKSPACE_HEADER_MESH_LINK_points_to_mesh_hub_without_meshId", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane0", files: mockPaneFiles("/pane0") }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );
    const link = screen.getByTestId("open-mesh-from-workspace");
    expect(link).toHaveAttribute("href", "/mesh");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("aria-label", "Mesh Sync (opens in new tab)");
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] DIFF_SAVED_VS_CURRENT — how: header Diff hidden until saved baseline exists.
  it("DIFF_SAVED_VS_CURRENT_hides_header_diff_without_savedSnapshot", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane0", files: mockPaneFiles("/pane0") }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        meshId="mesh-no-baseline"
      />,
    );
    expect(screen.queryByTestId("workspace-diff-header-button")).not.toBeInTheDocument();
  });

  it("DIFF_SAVED_VS_CURRENT_shows_header_diff_when_savedSnapshot_loaded", () => {
    const baseline = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/pane0",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane0", files: mockPaneFiles("/pane0") }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        meshId="mesh-with-baseline"
        loadedSnapshot={baseline}
      />,
    );
    expect(screen.getByTestId("workspace-diff-header-button")).toBeInTheDocument();
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] SHOW_LOADED_WORKSPACE_NAME — how: loadedMeshName renders in header.
  it("SHOW_LOADED_WORKSPACE_NAME_displays_mesh_name_in_header", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane0", files: mockPaneFiles("/pane0") }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        meshId="mesh-name-1"
        loadedMeshName="My Saved Workspace"
        restoredFromMesh
      />,
    );
    expect(screen.getByTestId("workspace-loaded-name")).toHaveTextContent(
      "My Saved Workspace",
    );
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_MESH_LINK — how: meshId prop links to /mesh/{meshId} in new tab.
  it("WORKSPACE_HEADER_MESH_LINK_points_to_mesh_detail_when_meshId_set", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane0", files: mockPaneFiles("/pane0") }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        meshId="mesh-restore-nav-1"
      />,
    );
    const link = screen.getByTestId("open-mesh-from-workspace");
    expect(link).toHaveAttribute("href", "/mesh/mesh-restore-nav-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] save_update_clears_diff_baseline — how: setSavedSnapshot(snapshot) after PUT clears diff badge.
  it("UPDATE_WORKSPACE_MESH_clears_diff_badge_after_save", async () => {
    const meshId = "mesh-diff-clear-1";
    const meshSaveKeybindings = [
      ...mockKeybindings,
      {
        key: "m",
        modifiers: { ctrl: true, shift: true },
        action: "mesh.saveWorkspace",
        description: "Save workspace as mesh",
        category: "system" as const,
      },
    ];
    const oneRowSnapshot = captureWorkspaceSnapshot({
      layout: "OneRow",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/pane0",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
        {
          path: "/pane1",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes(`/api/mesh/${meshId}/workspace`) && init?.method === "PUT") {
          return {
            ok: true,
            json: async () => ({ mesh: { name: "Test Mesh" } }),
          } as Response;
        }
        if (url.includes(`/api/mesh/${meshId}`)) {
          return { ok: true, json: async () => ({ mesh: {} }) } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      },
    );

    render(
      <WorkspaceView
        initialPanes={twoInitialPanes}
        keybindings={meshSaveKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        meshId={meshId}
        loadedMeshName="Test Mesh"
        loadedSnapshot={oneRowSnapshot}
        restoredFromMesh
        restoreUi={{
          layout: "Tile",
          focusIndex: 0,
          linkedMode: false,
          comparisonMode: "off",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-diff-change-count")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "m", ctrlKey: true, shiftKey: true });
    await waitFor(() => {
      expect(screen.getByTestId("save-workspace-mesh-dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("save-workspace-mesh-submit"));

    await waitFor(() => {
      expect(screen.queryByTestId("workspace-diff-change-count")).not.toBeInTheDocument();
    });
  });
});
