// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] WORKSPACE_TOOLBAR_DISPLAY_MODE

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig, ToolbarsConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockKeybindings = [
  {
    key: "c",
    action: "file.copy",
    description: "Copy files",
    category: "file-operations" as const,
  },
  {
    key: "s",
    action: "view.sort",
    description: "Sort files",
    category: "view-sort" as const,
  },
  {
    key: "?",
    action: "help.show",
    description: "Show keyboard shortcuts",
    category: "system" as const,
  },
];

const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 1,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: false,
};

const mockColumns = [{ id: "name" as const, visible: true }];

const mockCopy = {
  title: "File Manager",
};

const mockFiles: FileStat[] = [
  {
    name: "file.txt",
    path: "/test/file.txt",
    isDirectory: false,
    size: 1,
    mtime: new Date("2024-01-01"),
    extension: "txt",
  },
];

const mockToolbars: ToolbarsConfig = {
  enabled: true,
  workspace: {
    enabled: true,
    position: "top",
    groups: [{ name: "Layout", actions: ["view.sort"] }],
  },
  pane: {
    enabled: true,
    position: "top",
    groups: [{ name: "File Operations", actions: ["file.copy"] }],
  },
  system: {
    enabled: true,
    position: "top",
    groups: [{ name: "System", actions: ["help.show"] }],
  },
};

describe("[REQ-TOOLBAR_SYSTEM] IMPL-TOOLBAR_COMPONENT_WorkspaceToolbarDisplayMode", () => {
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
      json: async () => mockFiles,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderWithToolbars(toolbars: ToolbarsConfig = mockToolbars) {
    return render(
      <WorkspaceView
        initialPanes={[{ path: "/test", files: mockFiles }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={toolbars}
      />,
    );
  }

  it("renders three top toolbars when expanded", () => {
    renderWithToolbars();
    expect(screen.getAllByRole("toolbar")).toHaveLength(3);
    expect(screen.getByTestId("toolbar-compact-toggle")).toBeInTheDocument();
  });

  it("collapses to one merged toolbar without keystroke badges when compact", () => {
    renderWithToolbars();

    fireEvent.click(screen.getByTestId("toolbar-compact-toggle"));

    const toolbars = screen.getAllByRole("toolbar");
    expect(toolbars).toHaveLength(1);
    expect(toolbars[0]).toHaveClass("toolbar-compact");
    expect(within(toolbars[0]).queryByText("C")).not.toBeInTheDocument();
    expect(within(toolbars[0]).queryByText("S")).not.toBeInTheDocument();
    expect(within(toolbars[0]).getByTestId("toolbar-compact-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-file.copy")).toHaveAttribute(
      "title",
      "Copy files (C)",
    );
  });

  it("places toggle on pane toolbar when workspace tier is not top", () => {
    const toolbars: ToolbarsConfig = {
      ...mockToolbars,
      workspace: {
        enabled: true,
        position: "bottom",
        groups: [{ name: "Layout", actions: ["view.sort"] }],
      },
    };

    renderWithToolbars(toolbars);

    const paneToolbar = document.querySelector(".pane-toolbar");
    expect(paneToolbar).not.toBeNull();
    expect(
      within(paneToolbar as HTMLElement).getByTestId("toolbar-compact-toggle"),
    ).toBeInTheDocument();
    expect(document.querySelector(".workspace-toolbar")).toBeNull();
  });
});
