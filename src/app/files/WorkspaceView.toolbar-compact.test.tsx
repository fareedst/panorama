// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] WORKSPACE_TOOLBAR_DISPLAY_MODE

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig, ToolbarsConfig } from "@/lib/config.types";

global.fetch = vi.fn();

let mockWorkspaceHeight = 620;

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
    mockWorkspaceHeight = 620;

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

    vi.stubGlobal(
      "ResizeObserver",
      class MockResizeObserver {
        private callback: ResizeObserverCallback;

        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
        }

        observe(element: Element) {
          Object.defineProperty(element, "clientWidth", {
            value: 1000,
            configurable: true,
          });
          Object.defineProperty(element, "clientHeight", {
            get: () => mockWorkspaceHeight,
            configurable: true,
          });
          this.callback(
            [
              {
                contentRect: { width: 1000, height: mockWorkspaceHeight },
              } as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver,
          );
        }

        disconnect() {}
      },
    );

    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockFiles,
    } as Response);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it("renders one merged compact toolbar by default", () => {
    renderWithToolbars();
    const toolbars = screen.getAllByRole("toolbar");
    expect(toolbars).toHaveLength(1);
    expect(toolbars[0]).toHaveClass("toolbar-compact");
    expect(screen.getByTestId("toolbar-compact-toggle")).toBeInTheDocument();
  });

  it("expands to three top toolbars with keystroke badges when toggled once", () => {
    renderWithToolbars();

    fireEvent.click(screen.getByTestId("toolbar-compact-toggle"));
    expect(screen.getAllByRole("toolbar")).toHaveLength(3);
    expect(within(screen.getAllByRole("toolbar")[0]).getByText("S")).toBeInTheDocument();
  });

  // [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] WORKSPACE_TOOLBAR_DISPLAY_MODE: named mode renders three tiers with showActionLabel and toolbar-named class
  it("shows named mode with visible Action labels after two toggles", () => {
    renderWithToolbars();

    fireEvent.click(screen.getByTestId("toolbar-compact-toggle"));
    fireEvent.click(screen.getByTestId("toolbar-compact-toggle"));

    const toolbars = screen.getAllByRole("toolbar");
    expect(toolbars).toHaveLength(3);
    expect(toolbars[0]).toHaveClass("toolbar-named");
    expect(within(toolbars[1]).getByText("Copy")).toBeInTheDocument();
    expect(within(toolbars[1]).queryByText("C")).not.toBeInTheDocument();
    expect(screen.getByTestId("toolbar-file.copy")).toHaveAttribute(
      "title",
      "Copy files (C)",
    );
  });

  // [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM] WORKSPACE_TOOLBAR_DISPLAY_MODE: cycle returns to compact merged row after three toggles
  it("collapses to one merged toolbar without keystroke badges after three toggles", () => {
    renderWithToolbars();

    fireEvent.click(screen.getByTestId("toolbar-compact-toggle"));
    fireEvent.click(screen.getByTestId("toolbar-compact-toggle"));
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

  // [IMPL-TOOLBAR_COMPONENT] [IMPL-LAYOUT_CALCULATOR] WORKSPACE_TOOLBAR_DISPLAY_MODE: pane height follows workspace-area remeasure on compact toggle
  it("resizes pane height when toolbar compact toggle changes workspace area size", async () => {
    renderWithToolbars();

    const pane = screen.getByTestId("pane-0");
    await waitFor(() => {
      expect(pane).toHaveStyle({ height: "620px" });
    });

    mockWorkspaceHeight = 560;
    fireEvent.click(screen.getByTestId("toolbar-compact-toggle"));

    await waitFor(() => {
      expect(pane).toHaveStyle({ height: "560px" });
    });
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

    fireEvent.click(screen.getByTestId("toolbar-compact-toggle"));

    const paneToolbar = document.querySelector(".pane-toolbar");
    expect(paneToolbar).not.toBeNull();
    expect(
      within(paneToolbar as HTMLElement).getByTestId("toolbar-compact-toggle"),
    ).toBeInTheDocument();
    expect(document.querySelector(".workspace-toolbar")).toBeNull();
  });
});
