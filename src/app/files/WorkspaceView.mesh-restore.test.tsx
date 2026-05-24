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
  {
    key: "l",
    modifiers: { ctrl: true, shift: true },
    action: "view.layout",
    description: "Choose workspace layout",
    category: "view-sort" as const,
  },
  { key: "s", action: "view.sort", description: "Open sort menu", category: "view-sort" as const },
  { key: "l", action: "link.toggle", description: "Toggle linked mode", category: "view-sort" as const },
  {
    key: "`",
    action: "view.comparison",
    description: "Toggle comparison mode",
    category: "view-sort" as const,
  },
];

const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 1,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: false,
};

const mockColumns = [
  { id: "mtime" as const, visible: true, format: "age" as const },
  { id: "size" as const, visible: true },
  { id: "name" as const, visible: true },
];

const mockCopy = {
  title: "File Manager",
  layouts: {
    tile: "Tile",
    oneRow: "One Row",
    oneColumn: "One Column",
    fullscreen: "Fullscreen",
  },
};

const mockToolbars = {
  enabled: true,
  workspace: {
    enabled: true,
    position: "top" as const,
    groups: [
      { name: "Layout", actions: ["view.layout", "view.sort", "view.comparison"] },
    ],
  },
  pane: { enabled: false, position: "hidden" as const, groups: [] },
  system: { enabled: false, position: "hidden" as const, groups: [] },
};

function openLayoutPickerAndExpectSelected(layout: LayoutType) {
  fireEvent.click(screen.getByTestId("toolbar-view.layout"));
  const option = screen.getByTestId(`workspace-layout-option-${layout}`);
  expect(option.className).toMatch(/bg-blue/);
  fireEvent.click(screen.getByTestId("workspace-layout-picker-overlay"));
}

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
        toolbars={mockToolbars}
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

    openLayoutPickerAndExpectSelected("OneRow");
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
        toolbars={mockToolbars}
        restoredFromMesh
      />,
    );

    await waitFor(() => {
      const pane2 = screen.getByTestId("pane-2");
      // Tile: third pane stacks in right column (container height 680 via jsdom fallback)
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
        toolbars={mockToolbars}
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
    openLayoutPickerAndExpectSelected("OneRow");
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
        toolbars={mockToolbars}
          restoredFromMesh
          restoreLayout={parsed!.layout}
        />,
      );

      await waitFor(async () => {
        await assertGeometry();
      });
      openLayoutPickerAndExpectSelected(layout);
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
        toolbars={mockToolbars}
        meshId={meshId}
        restoredFromMesh
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-1")).toHaveStyle({ left: "500px" });
    });
    openLayoutPickerAndExpectSelected("OneRow");
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
        toolbars={mockToolbars}
        meshId={meshId}
        restoredFromMesh={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-1")).toHaveStyle({ left: "500px" });
    });
    openLayoutPickerAndExpectSelected("OneRow");
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [IMPL-FILE_COLUMN_CONFIG] SNAPSHOT_V4_FILE_COLUMNS — loadedSnapshot fileColumns restore column cell order
  it("RESTORE_FROM_MESH_applies_fileColumns_from_loaded_snapshot", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      fileColumns: [
        { id: "name", visible: true },
        { id: "size", visible: true },
        { id: "mtime", visible: true, format: "age" },
      ],
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
        toolbars={mockToolbars}
        loadedSnapshot={snapshot}
        restoredFromMesh
        restoreUi={{
          layout: "Tile",
          focusIndex: 0,
          linkedMode: false,
          comparisonMode: "off",
          sharedSort: { sortBy: "name", sortDirection: "asc", sortDirsFirst: true },
        }}
      />,
    );

    await waitFor(() => {
      const pane = screen.getByTestId("pane-0");
      const row = pane.querySelector('[data-testid="file-row-grid"]');
      const cells = row?.querySelectorAll("[data-testid^='file-column-']");
      expect(cells?.[0]).toHaveAttribute("data-testid", "file-column-name");
      expect(cells?.[1]).toHaveAttribute("data-testid", "file-column-size");
      expect(cells?.[2]).toHaveAttribute("data-testid", "file-column-mtime");
    });
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
        toolbars={mockToolbars}
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
        toolbars={mockToolbars}
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
      expect(screen.queryAllByText("🔗")).toHaveLength(0);
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
        toolbars={mockToolbars}
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
      expect(screen.getByTestId("toolbar-view.comparison")).toHaveClass(/bg-blue/);
    });
  });

  it("PARTIAL_MESH_REHYDRATE_applies_comparisonMode_when_server_already_restored_layout", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "size",
      panes: [
        { path: "/pane0", sortBy: "name", sortDirection: "asc", sortDirsFirst: true, cursor: 0 },
        { path: "/pane1", sortBy: "name", sortDirection: "asc", sortDirsFirst: true, cursor: 0 },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "Mesh", snapshot });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        mesh: {
          name: "Mesh",
          description: payload.description as string,
          tags: ["workspace-snapshot"],
          depots: [],
        },
      }),
    } as Response);

    render(
      <WorkspaceView
        meshId="mesh-partial"
        initialPanes={twoInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
        restoredFromMesh
        restoreLayout="Tile"
        restoreUi={{
          layout: "Tile",
          focusIndex: 0,
          linkedMode: false,
          comparisonMode: "off",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("toolbar-view.comparison")).toHaveClass(/bg-blue/);
    });
  });

  // [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE] SNAPSHOT_V5_CROSS_PANE_VISIBILITY: how: restorePaneMeta inline crossPaneVisibility applies tri-state toolbar
  it("RESTORE_FROM_MESH_applies_crossPaneVisibility_via_restorePaneMeta", async () => {
    const toolbarsWithCompare = {
      ...mockToolbars,
      actions: {
        "view.compareFilter.sharedAll": { description: "Shared all", icon: "files" },
      },
      workspace: {
        ...mockToolbars.workspace,
        groups: [
          ...mockToolbars.workspace.groups,
          {
            name: "Compare filters",
            actions: ["view.compareFilter.sharedAll"],
          },
        ],
      },
    };

    render(
      <WorkspaceView
        initialPanes={twoInitialPanes}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={toolbarsWithCompare}
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
            cursor: 0,
            crossPaneVisibilityId: null,
            crossPaneVisibility: {
              toggles: { sharedAll: "include" },
              sizeThreshold: null,
              timeThreshold: null,
            },
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
      expect(screen.getByTestId("toolbar-view.compareFilter.sharedAll")).toHaveAttribute(
        "data-tri-state",
        "include",
      );
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
        toolbars={mockToolbars}
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
        toolbars={mockToolbars}
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
        toolbars={mockToolbars}
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
        toolbars={mockToolbars}
        meshId="mesh-with-baseline"
        loadedSnapshot={baseline}
      />,
    );
    expect(screen.getByTestId("workspace-diff-header-button")).toBeInTheDocument();
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] SHOW_LOADED_WORKSPACE_NAME — how: loadedMeshName renders in header without redundant success line.
  it("SHOW_LOADED_WORKSPACE_NAME_displays_mesh_name_in_header", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane0", files: mockPaneFiles("/pane0") }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
        meshId="mesh-name-1"
        loadedMeshName="My Saved Workspace"
        restoredFromMesh
      />,
    );
    expect(screen.getByTestId("workspace-header-status")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-loaded-name")).toHaveTextContent(
      "My Saved Workspace",
    );
    expect(screen.queryByTestId("workspace-restored-from-mesh")).not.toBeInTheDocument();
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_STATUS — how: partial restore warning uses amber workspace-restore-warning alongside loaded name.
  it("WORKSPACE_HEADER_STATUS_shows_restore_warning_when_restoredFromMesh", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane0", files: mockPaneFiles("/pane0") }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
        meshId="mesh-warn-1"
        loadedMeshName="Truncated Workspace"
        restoredFromMesh
        restoreWarning="Restored first 2 pane(s) due to maxPanes limit."
      />,
    );
    expect(screen.getByTestId("workspace-header-status")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-loaded-name")).toHaveTextContent("Truncated Workspace");
    const warning = screen.getByTestId("workspace-restore-warning");
    expect(warning).toHaveTextContent("maxPanes limit");
    expect(warning).toHaveClass("text-amber-700");
    expect(screen.queryByTestId("workspace-restore-error")).not.toBeInTheDocument();
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_STATUS — how: bootstrap failure uses red workspace-restore-error.
  it("WORKSPACE_HEADER_STATUS_shows_restore_error_when_not_restoredFromMesh", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane0", files: mockPaneFiles("/pane0") }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
        meshId="mesh-missing-1"
        restoreWarning="Mesh not found on server; workspace paths and layout may not restore."
      />,
    );
    expect(screen.getByTestId("workspace-header-status")).toBeInTheDocument();
    const error = screen.getByTestId("workspace-restore-error");
    expect(error).toHaveTextContent("Mesh not found on server");
    expect(error).toHaveClass("text-red-700");
    expect(screen.queryByTestId("workspace-restore-warning")).not.toBeInTheDocument();
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_STATUS — how: green fallback when restoredFromMesh with no loadedMeshName or warning.
  it("WORKSPACE_HEADER_STATUS_shows_fallback_when_no_loaded_name", () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane0", files: mockPaneFiles("/pane0") }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
        meshId="mesh-fallback-1"
        restoredFromMesh
      />,
    );
    expect(screen.getByTestId("workspace-header-status")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-restored-from-mesh")).toHaveTextContent(
      "Workspace restored from mesh",
    );
    expect(screen.queryByTestId("workspace-loaded-name")).not.toBeInTheDocument();
    expect(screen.queryByTestId("workspace-restore-warning")).not.toBeInTheDocument();
    expect(screen.queryByTestId("workspace-restore-error")).not.toBeInTheDocument();
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
        toolbars={mockToolbars}
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
        toolbars={mockToolbars}
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

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW
  // how: meshRestorePending triggers client full rehydrate; amber warning after clientRestoredFromMesh, no red error.
  it("RESTORE_FROM_MESH_client_full_rehydrate_when_meshRestorePending", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "OneRow",
      focusIndex: 1,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/saved/pane0",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
        {
          path: "/saved/pane1",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "Client full restore", snapshot });
    const meshId = "mesh-client-full-restore";
    const apiBody = {
      mesh: {
        id: meshId,
        name: "Client full restore",
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

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes(`/api/mesh/${meshId}`)) {
          return { ok: true, json: async () => apiBody } as Response;
        }
        if (url.includes(encodeURIComponent("/saved/pane0"))) {
          return { ok: true, json: async () => mockPaneFiles("/saved/pane0") } as Response;
        }
        if (url.includes(encodeURIComponent("/saved/pane1"))) {
          return { ok: true, json: async () => mockPaneFiles("/saved/pane1") } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      },
    );

    render(
      <WorkspaceView
        initialPanes={[]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={{ ...mockLayout, defaultLinkedMode: true }}
        columns={mockColumns}
        toolbars={mockToolbars}
        meshId={meshId}
        meshRestorePending
        restoreWarning="Mesh not found on server; workspace paths and layout may not restore."
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toBeInTheDocument();
      expect(screen.getByTestId("pane-1")).toBeInTheDocument();
    });
    openLayoutPickerAndExpectSelected("OneRow");

    expect(screen.getByTestId("pane-1").closest(".border-2")).toHaveClass("border-blue-500");
    expect(screen.queryAllByText("🔗")).toHaveLength(0);
    expect(screen.queryByTestId("workspace-restore-error")).not.toBeInTheDocument();
    expect(screen.getByTestId("workspace-restore-warning")).toHaveTextContent(
      "Workspace restored via API",
    );
    expect(screen.queryByTestId("workspace-diff-change-count")).not.toBeInTheDocument();
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_STATUS
  // how: workspace-restore-pending visible while client rehydrate fetch is in flight.
  it("WORKSPACE_HEADER_STATUS_shows_restore_pending_during_client_rehydrate", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: "/pending/pane0",
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });
    const payload = buildMeshCreatePayload({ name: "Pending banner", snapshot });
    const meshId = "mesh-pending-banner";
    const apiBody = {
      mesh: {
        id: meshId,
        name: "Pending banner",
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

    let resolveMesh: (value: Response) => void = () => {};
    const meshPromise = new Promise<Response>((resolve) => {
      resolveMesh = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes(`/api/mesh/${meshId}`)) {
          return meshPromise;
        }
        if (url.includes(encodeURIComponent("/pending/pane0"))) {
          return { ok: true, json: async () => mockPaneFiles("/pending/pane0") } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      },
    );

    render(
      <WorkspaceView
        initialPanes={[]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
        meshId={meshId}
        meshRestorePending
        restoreWarning="Mesh not found on server."
      />,
    );

    expect(screen.getByTestId("workspace-restore-pending")).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-restore-error")).not.toBeInTheDocument();

    resolveMesh({ ok: true, json: async () => apiBody } as Response);

    await waitFor(() => {
      expect(screen.queryByTestId("workspace-restore-pending")).not.toBeInTheDocument();
      expect(screen.getByTestId("pane-0")).toBeInTheDocument();
    });
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_STATUS
  // how: red workspace-restore-error when mesh fetch fails and client cannot recover.
  it("WORKSPACE_HEADER_STATUS_shows_restore_error_when_client_rehydrate_fails", async () => {
    const meshId = "mesh-rehydrate-fail";
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes(`/api/mesh/${meshId}`) || url.includes("/api/files")) {
          return { ok: false, status: 500 } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      },
    );

    render(
      <WorkspaceView
        initialPanes={[]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
        meshId={meshId}
        meshRestorePending
        restoreWarning="Mesh not found on server."
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-restore-error")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("workspace-restore-warning")).not.toBeInTheDocument();
  });
});
