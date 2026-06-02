// [REQ-DIRECTORY_TREE] [IMPL-DIRECTORY_TREE] [IMPL-WORKSPACE_VIEW]

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig, ToolbarsConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 1,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: false,
};

const navKeybindings = [
  {
    key: "Enter",
    action: "navigate.enter",
    description: "Toggle directory expand",
    category: "navigation" as const,
  },
  {
    key: "m",
    action: "mark.toggle-cursor",
    description: "Toggle mark",
    category: "marking" as const,
  },
];

const mockToolbars: ToolbarsConfig = {
  enabled: false,
  actions: {},
  workspace: { enabled: false, position: "top", groups: [] },
  pane: { enabled: false, position: "top", groups: [] },
  system: { enabled: false, position: "top", groups: [] },
};

function dir(name: string, dirPath: string): FileStat {
  const path = `${dirPath}/${name}`.replace(/\/+/g, "/");
  return {
    name,
    path,
    isDirectory: true,
    size: 0,
    mtime: "2024-01-01T00:00:00.000Z",
    extension: "",
  };
}

function file(name: string, dirPath: string): FileStat {
  const path = `${dirPath}/${name}`.replace(/\/+/g, "/");
  return {
    name,
    path,
    isDirectory: false,
    size: 10,
    mtime: "2024-01-01T00:00:00.000Z",
    extension: ".txt",
  };
}

describe("[REQ-DIRECTORY_TREE] WorkspaceView directory tree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // [IMPL-DIRECTORY_TREE] CREATE_INITIAL_TREE_STATE — first_level_collapsed_on_paint
  it("first paint shows root children only with first-level dirs collapsed", () => {
    const base = "/parent";
    const rootFiles: FileStat[] = [
      dir("A", base),
      dir("B", base),
      file("root.txt", base),
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => rootFiles,
    });

    render(
      <WorkspaceView
        initialPanes={[{ path: base, files: rootFiles }]}
        keybindings={navKeybindings}
        copy={{ title: "FM" }}
        layout={mockLayout}
        columns={[{ id: "name", visible: true }]}
        toolbars={mockToolbars}
      />,
    );

    const pane0 = screen.getByTestId("pane-0");
    expect(within(pane0).getByText("A")).toBeInTheDocument();
    expect(within(pane0).getByText("B")).toBeInTheDocument();
    expect(within(pane0).getByText("root.txt")).toBeInTheDocument();
    expect(within(pane0).queryByText("same.txt")).not.toBeInTheDocument();
  });

  // [IMPL-DIRECTORY_TREE] [REQ-FILE_MARKING_WEB] marks_keyed_by_absolute_path — duplicate basenames under different parents
  it("path-keyed marks disambiguate same basename in expanded subtrees", async () => {
    const base = "/parent";
    const aPath = "/parent/A";
    const bPath = "/parent/B";
    const rootFiles: FileStat[] = [dir("A", base), dir("B", base)];
    const aChildren = [file("same.txt", aPath)];
    const bChildren = [file("same.txt", bPath)];

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      const urlStr = url.toString();
      if (urlStr.includes(encodeURIComponent(aPath))) {
        return { ok: true, json: async () => aChildren } as Response;
      }
      if (urlStr.includes(encodeURIComponent(bPath))) {
        return { ok: true, json: async () => bChildren } as Response;
      }
      if (urlStr.includes(encodeURIComponent(base))) {
        return { ok: true, json: async () => rootFiles } as Response;
      }
      return { ok: true, json: async () => [] } as Response;
    });

    render(
      <WorkspaceView
        initialPanes={[{ path: base, files: rootFiles }]}
        keybindings={navKeybindings}
        copy={{ title: "FM" }}
        layout={mockLayout}
        columns={[{ id: "name", visible: true }]}
        toolbars={mockToolbars}
      />,
    );

    const pane0 = screen.getByTestId("pane-0");

    fireEvent.doubleClick(within(pane0).getByText("A").closest("div") as HTMLElement);
    await waitFor(() => {
      expect(within(pane0).getAllByText("same.txt")).toHaveLength(1);
    });

    fireEvent.click(within(pane0).getAllByRole("checkbox")[1]);
    expect(screen.getByText("[1 marked]")).toBeInTheDocument();

    fireEvent.doubleClick(within(pane0).getByText("B").closest("div") as HTMLElement);
    await waitFor(() => {
      expect(within(pane0).getAllByText("same.txt")).toHaveLength(2);
    });

    fireEvent.click(within(pane0).getAllByRole("checkbox")[3]);
    expect(screen.getByText("[2 marked]")).toBeInTheDocument();
  });

  // [IMPL-DIRECTORY_TREE] HANDLE_NAVIGATE_TREE_RESET — re-root clears expanded subtree from visible rows
  it("handleNavigate re-root resets tree and collapses expanded paths", async () => {
    const base = "/parent";
    const subPath = "/parent/sub";
    const rootFiles: FileStat[] = [dir("sub", base), file("top.txt", base)];
    const subFiles: FileStat[] = [file("nested.txt", subPath)];
    const rootListing: FileStat[] = [dir("parent", "/"), file("etc.txt", "/")];

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      const urlStr = url.toString();
      if (urlStr.includes(encodeURIComponent(subPath))) {
        return { ok: true, json: async () => subFiles } as Response;
      }
      if (urlStr.includes(encodeURIComponent(base))) {
        return { ok: true, json: async () => rootFiles } as Response;
      }
      if (urlStr.includes("path=%2F") || urlStr.endsWith("path=/")) {
        return { ok: true, json: async () => rootListing } as Response;
      }
      return { ok: true, json: async () => [] } as Response;
    });

    render(
      <WorkspaceView
        initialPanes={[{ path: base, files: rootFiles }]}
        keybindings={navKeybindings}
        copy={{ title: "FM" }}
        layout={mockLayout}
        columns={[{ id: "name", visible: true }]}
        toolbars={mockToolbars}
      />,
    );

    const pane0 = screen.getByTestId("pane-0");
    fireEvent.keyDown(window, { key: "Enter" });
    await waitFor(() => {
      expect(within(pane0).getByText("nested.txt")).toBeInTheDocument();
    });

    fireEvent.click(within(pane0).getByRole("button", { name: "Parent directory" }));

    await waitFor(() => {
      expect(within(pane0).getByText("/")).toBeInTheDocument();
      expect(within(pane0).queryByText("nested.txt")).not.toBeInTheDocument();
    });
  });
});
