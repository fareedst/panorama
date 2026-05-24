// [TEST-MOUSE_INTERACTION] [IMPL-WORKSPACE_VIEW] [IMPL-FILE_PANE] [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]
// PANE_FILES_LIST_TO_FILEPANE — how: WorkspaceView passes panes[].files into FilePane for cross-pane path clipboard

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
};

const mockToolbars = {
  enabled: false,
  actions: {},
  workspace: { enabled: false, position: "hidden" as const, groups: [] },
  pane: { enabled: false, position: "hidden" as const, groups: [] },
  system: { enabled: false, position: "hidden" as const, groups: [] },
};

const sharedLeft: FileStat = {
  name: "shared.txt",
  path: "/left/shared.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01"),
  extension: ".txt",
};

const sharedRight: FileStat = {
  name: "shared.txt",
  path: "/right/shared.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-02"),
  extension: ".txt",
};

describe("WorkspaceView file column clipboard [PANE_FILES_LIST_TO_FILEPANE]", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/left")) {
          return {
            ok: true,
            json: async () => [sharedLeft],
          } as Response;
        }
        if (url.includes("/right")) {
          return {
            ok: true,
            json: async () => [sharedRight],
          } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies cross-pane paths using workspace paneFilesList binding", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/left", files: [sharedLeft] },
          { path: "/right", files: [sharedRight] },
        ]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toBeInTheDocument();
      expect(screen.getByTestId("pane-1")).toBeInTheDocument();
    });

    const pane0NameCells = screen
      .getByTestId("pane-0")
      .querySelectorAll('[data-testid="file-column-name"]');
    fireEvent.contextMenu(pane0NameCells[0] as Element);

    expect(screen.getByTestId("file-column-context-menu")).toBeInTheDocument();
    expect(screen.getByTestId("file-column-copy-cross-pane-paths")).not.toBeDisabled();

    fireEvent.click(screen.getByTestId("file-column-copy-cross-pane-paths"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "Pane 1: /left/shared.txt\nPane 2: /right/shared.txt",
      );
    });
  });
});
