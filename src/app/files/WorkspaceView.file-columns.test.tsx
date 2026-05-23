// [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-TOOLBAR_SYSTEM] [IMPL-WORKSPACE_VIEW] [IMPL-FILE_COLUMN_CONFIG]: Workspace file columns composition

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesColumnConfig, FilesLayoutConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockKeybindings = [
  { key: "Tab", action: "navigate.tab", description: "Next pane", category: "navigation" as const },
];

const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 2,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: false,
};

const mockColumns: FilesColumnConfig[] = [
  { id: "mtime", visible: true, format: "age" },
  { id: "size", visible: true },
  { id: "name", visible: true },
];

const mockCopy = {
  title: "File Manager",
  columns: {
    columnOrderTitle: "Column order",
    moveUp: "Up",
    moveDown: "Down",
    apply: "Apply",
    cancel: "Cancel",
  },
};

const mockToolbars = {
  enabled: true,
  actions: {
    "view.columns": { description: "Reorder file columns", icon: "columns" },
  },
  workspace: {
    enabled: true,
    position: "top" as const,
    groups: [{ name: "Layout", actions: ["view.columns"] }],
  },
  pane: { enabled: false, position: "hidden" as const, groups: [] },
  system: { enabled: false, position: "hidden" as const, groups: [] },
};

const listingFiles: FileStat[] = [
  {
    name: "alpha.txt",
    path: "/test/alpha.txt",
    isDirectory: false,
    size: 10,
    mtime: new Date("2024-01-01"),
    extension: "txt",
  },
];

function getPaneRow(paneIndex: number) {
  const pane = screen.getByTestId(`pane-${paneIndex}`);
  return pane.querySelector('[data-testid="file-row-grid"]') as HTMLElement;
}

describe("WorkspaceView file columns [IMPL-WORKSPACE_VIEW] [IMPL-FILE_COLUMN_CONFIG]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => listingFiles,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // [IMPL-WORKSPACE_VIEW] [IMPL-FILE_COLUMN_CONFIG] COLUMN_ORDER_DIALOG_HANDLER — view.columns opens dialog; Apply reorders pane columns
  it("view.columns opens dialog and apply reorders file column cells", async () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/test", files: listingFiles }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("toolbar-view.columns")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("toolbar-view.columns"));
    expect(screen.getByTestId("column-order-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("column-order-down-mtime"));
    fireEvent.click(screen.getByTestId("column-order-apply"));

    await waitFor(() => {
      expect(screen.queryByTestId("column-order-dialog")).not.toBeInTheDocument();
    });

    const row = getPaneRow(0);
    const cells = row.querySelectorAll("[data-testid^='file-column-']");
    expect(cells[0]).toHaveAttribute("data-testid", "file-column-size");
    expect(cells[1]).toHaveAttribute("data-testid", "file-column-mtime");
    expect(cells[2]).toHaveAttribute("data-testid", "file-column-name");
  });

  // [IMPL-WORKSPACE_VIEW] [IMPL-FILE_COLUMN_CONFIG] SHARED_METADATA_WIDTHS_ONECOLUMN — workspace max Size/Time ch shared across panes
  it("OneColumn layout shares metadata column widths across panes", async () => {
    const pane0Files: FileStat[] = [
      {
        name: "tiny.txt",
        path: "/a/tiny.txt",
        isDirectory: false,
        size: 5,
        mtime: new Date("2024-01-01"),
        extension: "txt",
      },
    ];
    const pane1Files: FileStat[] = [
      {
        name: "huge-backup.tar",
        path: "/b/huge-backup.tar",
        isDirectory: false,
        size: 1024 * 1024 * 900,
        mtime: new Date("2024-06-01"),
        extension: "tar",
      },
    ];

    render(
      <WorkspaceView
        initialPanes={[
          { path: "/a", files: pane0Files },
          { path: "/b", files: pane1Files },
        ]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={{ ...mockLayout, default: "oneColumn" }}
        columns={mockColumns}
        toolbars={mockToolbars}
        restoreUi={{
          layout: "OneColumn",
          focusIndex: 0,
          linkedMode: false,
          comparisonMode: "off",
          sharedSort: { sortBy: "name", sortDirection: "asc", sortDirsFirst: true },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toBeInTheDocument();
      expect(screen.getByTestId("pane-1")).toBeInTheDocument();
    });

    const grid0 = getPaneRow(0).style.gridTemplateColumns;
    const grid1 = getPaneRow(1).style.gridTemplateColumns;
    expect(grid0).toBe(grid1);
    expect(grid0).toMatch(/\d+ch/);
    expect(grid0).toContain("minmax(0, 1fr)");
  });
});
