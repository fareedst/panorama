// [TEST-SET_BASE_DIRECTORY] [IMPL-WORKSPACE_VIEW] [IMPL-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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
  paneManagement: {
    setBaseDirectoryMenu: "Set as Base directory…",
    setBaseDirectoryTitle: "Set as Base directory",
  },
};

const mockToolbars = {
  enabled: false,
  actions: {},
  workspace: { enabled: false, position: "hidden" as const, groups: [] },
  pane: { enabled: false, position: "hidden" as const, groups: [] },
  system: { enabled: false, position: "hidden" as const, groups: [] },
};

const fileEntry: FileStat = {
  name: "file.txt",
  path: "/left/file.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01"),
  extension: ".txt",
};

const dirEntry: FileStat = {
  name: "projects",
  path: "/left/projects",
  isDirectory: true,
  size: 0,
  mtime: new Date("2024-01-01"),
  extension: "",
};

describe("WorkspaceView set base directory [SET_BASE_DIRECTORY]", () => {
  const openSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    openSpy.mockReturnValue(null);
    vi.stubGlobal("open", openSpy);
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/left/projects")) {
          return {
            ok: true,
            json: async () => [],
          } as Response;
        }
        if (url.includes("/left")) {
          return {
            ok: true,
            json: async () => [fileEntry, dirEntry],
          } as Response;
        }
        if (url.includes("/right")) {
          return {
            ok: true,
            json: async () => [fileEntry],
          } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderWorkspace() {
    return render(
      <WorkspaceView
        initialPanes={[
          { path: "/left", files: [fileEntry, dirEntry] },
          { path: "/right", files: [fileEntry] },
        ]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );
  }

  function contextMenuDirectoryRow(paneIndex = 0) {
    const pane = screen.getByTestId(`pane-${paneIndex}`);
    const dirRow = within(pane).getByText("projects").closest(".cursor-pointer") as Element;
    fireEvent.contextMenu(dirRow);
  }

  async function openSetBaseDialog(paneIndex = 0) {
    contextMenuDirectoryRow(paneIndex);
    fireEvent.click(screen.getByTestId("set-base-directory-menu-item"));
    await waitFor(() =>
      expect(screen.getByTestId("set-base-directory-dialog")).toBeInTheDocument(),
    );
  }

  async function applySetBaseTarget(testId: string, paneIndex = 0) {
    const fetchCallsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await openSetBaseDialog(paneIndex);
    fireEvent.click(screen.getByTestId(testId));
    await waitFor(() =>
      expect(
        screen.queryByTestId("set-base-directory-dialog"),
      ).not.toBeInTheDocument(),
    );
    return fetchCallsBefore;
  }

  function projectFetchCallsSince(sinceIndex: number) {
    return (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      .slice(sinceIndex)
      .filter(([url]) => String(url).includes(encodeURIComponent("/left/projects")));
  }

  it("shows Set as Base directory on directory row only", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    contextMenuDirectoryRow();
    expect(screen.getByTestId("set-base-directory-menu-item")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );

    const fileRow = within(screen.getByTestId("pane-0"))
      .getByText("file.txt")
      .closest(".cursor-pointer") as Element;
    fireEvent.contextMenu(fileRow);
    expect(screen.queryByTestId("set-base-directory-menu-item")).not.toBeInTheDocument();
  });

  it("opens dialog with directory path and applies In this pane", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    contextMenuDirectoryRow();
    fireEvent.click(screen.getByTestId("set-base-directory-menu-item"));

    await waitFor(() => {
      expect(screen.getByTestId("set-base-directory-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("set-base-directory-path")).toHaveTextContent(
        "/left/projects",
      );
    });

    fireEvent.click(screen.getByTestId("set-base-in-this-pane"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("set-base-directory-dialog"),
      ).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("/left/projects")),
    );
  });

  // SetBaseDirectoryApply allPanes — [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION]: how — NavigateAbsoluteBase assigns absolute path to every pane
  it("applies In all panes and navigates both panes to directory", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    const before = await applySetBaseTarget("set-base-in-all-panes");
    await waitFor(() => expect(projectFetchCallsSince(before).length).toBeGreaterThanOrEqual(2));

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/left/projects");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/left/projects");
    });
  });

  // SetBaseDirectoryApply otherPanes — [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION]: how — only non-initiating pane receives navigate
  it("applies In all other panes from initiating pane only", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    const before = await applySetBaseTarget("set-base-in-other-panes", 0);
    expect(projectFetchCallsSince(before).length).toBe(1);

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/left");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/left/projects");
    });
  });

  // SetBaseDirectorySwapCompose — [IMPL-WORKSPACE_VIEW] [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]: how — neighbor navigates then swap
  it("applies next pane swap and swaps pane positions", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    await applySetBaseTarget("set-base-in-next-pane-swap", 0);

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/left/projects");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/left");
    });
  });

  it("opens new workspace tab with single-pane URL", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    contextMenuDirectoryRow();
    fireEvent.click(screen.getByTestId("set-base-directory-menu-item"));

    await waitFor(() =>
      expect(screen.getByTestId("set-base-new-workspace")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("set-base-new-workspace"));

    expect(openSpy).toHaveBeenCalledWith(
      "/files?panes=1&pane0=%2Fleft%2Fprojects",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
