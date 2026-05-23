// [REQ-FILE_SORTING_ADVANCED] [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-SORT_FILTER] [IMPL-WORKSPACE_VIEW]: Workspace shared sort composition

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockKeybindings = [
  { key: "Tab", action: "navigate.tab", description: "Next pane", category: "navigation" as const },
  { key: "s", action: "view.sort", description: "Open sort menu", category: "view-sort" as const },
  { key: "=", action: "pane.add", description: "Add pane", category: "pane-management" as const },
];

const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 2,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: true,
};

const mockColumns = [{ id: "name" as const, visible: true }];

const mockCopy = {
  title: "File Manager",
  sort: { sharedButton: "Shared", shareButton: "Share" },
};

const mockToolbars = {
  enabled: true,
  workspace: {
    enabled: true,
    position: "top" as const,
    groups: [{ name: "Layout", actions: ["view.sort"] }],
  },
  pane: { enabled: false, position: "hidden" as const, groups: [] },
  system: { enabled: false, position: "hidden" as const, groups: [] },
};

const sortableFiles: FileStat[] = [
  {
    name: "alpha.txt",
    path: "/test/alpha.txt",
    isDirectory: false,
    size: 100,
    mtime: new Date("2024-01-01"),
    extension: "txt",
  },
  {
    name: "beta.txt",
    path: "/test/beta.txt",
    isDirectory: false,
    size: 1,
    mtime: new Date("2024-01-02"),
    extension: "txt",
  },
];

function openSortDialog() {
  fireEvent.click(screen.getByTestId("toolbar-view.sort"));
  expect(screen.getByTestId("sort-dialog")).toBeInTheDocument();
}

function getPaneFooter(paneIndex: number) {
  const pane = screen.getByTestId(`pane-${paneIndex}`);
  return within(pane).getByText(/Sort:/);
}

describe("WorkspaceView shared sort [REQ-FILE_SORTING_ADVANCED]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => sortableFiles,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED] [REQ-LINKED_PANES] SharedSortWorkspace — Shared applies sharedSort to focused pane only when linked
  it("Shared applies shared sort to focused pane only when linked [REQ-LINKED_PANES]", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/test", files: sortableFiles },
          { path: "/test2", files: sortableFiles },
        ]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={{ ...mockLayout, defaultLinkedMode: true }}
        columns={mockColumns}
        toolbars={mockToolbars}
        restoreUi={{
          layout: "Tile",
          focusIndex: 0,
          linkedMode: true,
          comparisonMode: "off",
          sharedSort: { sortBy: "size", sortDirection: "asc", sortDirsFirst: true },
        }}
        restoredFromMesh
      />,
    );

    await waitFor(() => {
      expect(getPaneFooter(0)).toHaveTextContent("Sort: Name");
      expect(getPaneFooter(1)).toHaveTextContent("Sort: Name");
    });

    openSortDialog();
    fireEvent.click(screen.getByTestId("sort-dialog-shared"));

    await waitFor(() => {
      expect(getPaneFooter(0)).toHaveTextContent("Sort: Size");
      expect(getPaneFooter(1)).toHaveTextContent("Sort: Name");
    });
  });

  // [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED] SharedSortWorkspace — new pane inherits sharedSort after Share
  it("new pane inherits workspace sharedSort after Share [REQ-MULTI_PANE_LAYOUT]", async () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/test", files: sortableFiles }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={{ ...mockLayout, defaultPaneCount: 1, defaultLinkedMode: false }}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    await waitFor(() => {
      expect(getPaneFooter(0)).toHaveTextContent("Sort: Name");
    });

    openSortDialog();
    fireEvent.click(screen.getByText("Modification Time"));
    fireEvent.click(screen.getByText("Descending ↓"));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(getPaneFooter(0)).toHaveTextContent("Sort: Time");
    });

    openSortDialog();
    fireEvent.click(screen.getByTestId("sort-dialog-share"));

    fireEvent.keyDown(window, { key: "=" });

    await waitFor(() => {
      expect(screen.getByTestId("pane-1")).toBeInTheDocument();
      expect(getPaneFooter(1)).toHaveTextContent("Sort: Time");
    });
  });
});
