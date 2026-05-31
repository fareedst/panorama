// [TEST-PANE_COMMAND_EXEC] [IMPL-WORKSPACE_VIEW] [IMPL-EXECUTE_DIALOG] [REQ-PANE_COMMAND_EXEC]

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesColumnConfig, FilesLayoutConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockKeybindings = [
  { key: "Tab", action: "navigate.tab", description: "Next pane", category: "navigation" as const },
  { key: "m", action: "mark.toggle-cursor", description: "Toggle mark", category: "marking" as const },
];

const fileA: FileStat = {
  name: "a.txt",
  path: "/left/a.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01T00:00:00.000Z"),
  extension: ".txt",
};

const fileB: FileStat = {
  name: "b.txt",
  path: "/left/b.txt",
  isDirectory: false,
  size: 20,
  mtime: new Date("2024-02-01T00:00:00.000Z"),
  extension: ".txt",
};

const sharedFileLeft: FileStat = {
  name: "shared.txt",
  path: "/left/shared.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01T00:00:00.000Z"),
  extension: ".txt",
};

const sharedFileRight: FileStat = {
  ...sharedFileLeft,
  path: "/right/shared.txt",
};

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
  touchFile: {
    touchMenu: "Touch…",
  },
  executeFile: {
    executeMenu: "Execute…",
    executeTitle: "Execute",
    executeApply: "Execute",
  },
  paneManagement: {
    setBaseInThisPane: "In this pane",
    setBaseInAllPanes: "In all panes",
    cancel: "Cancel",
  },
};

const mockToolbars = {
  enabled: false,
  actions: {},
  workspace: { enabled: false, position: "hidden" as const, groups: [] },
  pane: { enabled: false, position: "hidden" as const, groups: [] },
  system: { enabled: false, position: "hidden" as const, groups: [] },
};

function isPaneListingGet(url: string, init?: RequestInit) {
  return (
    (init?.method === undefined || init?.method === "GET") &&
    (url.includes("/left") || url.includes("/right") || url.includes("%2Fleft") || url.includes("%2Fright"))
  );
}

describe("WorkspaceView execute command [PANE_COMMAND_EXEC]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/files") && init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({
              successCount: 2,
              errorCount: 0,
              results: [
                { paneIndex: 0, exitCode: 0 },
                { paneIndex: 1, exitCode: 0 },
              ],
            }),
          } as Response;
        }
        if (url.includes("/left")) {
          return { ok: true, json: async () => [sharedFileLeft] } as Response;
        }
        if (url.includes("/right")) {
          return { ok: true, json: async () => [sharedFileRight] } as Response;
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
          { path: "/left", files: [sharedFileLeft] },
          { path: "/right", files: [sharedFileRight] },
        ]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );
  }

  // [IMPL-WORKSPACE_VIEW] [IMPL-EXECUTE_DIALOG] [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — context menu → dialog → execute-command POST with cross-pane $FILE expansion
  it("opens Execute dialog from file row context menu and posts execute-command", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    const pane = screen.getByTestId("pane-0");
    const row = within(pane).getByText("shared.txt").closest(".cursor-pointer") as Element;
    fireEvent.contextMenu(row);

    fireEvent.click(screen.getByTestId("execute-file-menu-item"));

    await waitFor(() =>
      expect(screen.getByTestId("execute-file-dialog")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId("execute-command-input"), {
      target: { value: "echo $FILE" },
    });
    fireEvent.click(screen.getByTestId("execute-in-all-panes").querySelector("input")!);
    fireEvent.click(screen.getByTestId("execute-file-apply"));

    await waitFor(() =>
      expect(screen.queryByTestId("execute-file-dialog")).not.toBeInTheDocument(),
    );

    const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) =>
        String(url).includes("/api/files") &&
        (init as RequestInit)?.method === "POST",
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.operation).toBe("execute-command");
    expect(body.entries).toHaveLength(2);
    expect(body.entries[0].command).toBe("echo /left/shared.txt");
    expect(body.entries[1].command).toBe("echo /right/shared.txt");
  });

  // [IMPL-WORKSPACE_VIEW] [IMPL-EXECUTE_DIALOG] [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: execute_refresh_panes — handleNavigate refreshes affected pane listings after success
  it("refreshes affected pane listings after execute-command succeeds", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    const listingGetsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([url, init]) => isPaneListingGet(String(url), init as RequestInit),
    ).length;

    const pane = screen.getByTestId("pane-0");
    const row = within(pane).getByText("shared.txt").closest(".cursor-pointer") as Element;
    fireEvent.contextMenu(row);
    fireEvent.click(screen.getByTestId("execute-file-menu-item"));

    await waitFor(() =>
      expect(screen.getByTestId("execute-file-dialog")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId("execute-command-input"), {
      target: { value: "echo hi" },
    });
    fireEvent.click(screen.getByTestId("execute-in-all-panes").querySelector("input")!);
    fireEvent.click(screen.getByTestId("execute-file-apply"));

    await waitFor(() => {
      const listingGetsAfter = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([url, init]) => isPaneListingGet(String(url), init as RequestInit),
      ).length;
      expect(listingGetsAfter).toBeGreaterThan(listingGetsBefore);
    });
  });

  // [IMPL-WORKSPACE_VIEW] [IMPL-EXECUTE_DIALOG] [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: execute_marks_scope — marksAtOpen flows to execute-command markedPaths
  it("posts execute-command for marked files in this pane", async () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/left", files: [fileA, fileB, sharedFileLeft] }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    const pane = screen.getByTestId("pane-0");
    const checkboxes = within(pane).getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    await waitFor(() => expect(screen.getByText("[2 marked]")).toBeInTheDocument());

    const row = within(pane).getByText("a.txt").closest(".cursor-pointer") as Element;
    fireEvent.contextMenu(row);
    fireEvent.click(screen.getByTestId("execute-file-menu-item"));

    await waitFor(() =>
      expect(screen.getByTestId("execute-file-dialog")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId("execute-command-input"), {
      target: { value: "echo $MARKED" },
    });
    fireEvent.click(screen.getByTestId("execute-file-apply"));

    await waitFor(() =>
      expect(screen.queryByTestId("execute-file-dialog")).not.toBeInTheDocument(),
    );

    const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) =>
        String(url).includes("/api/files") &&
        (init as RequestInit)?.method === "POST",
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.operation).toBe("execute-command");
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0].markedPaths.sort()).toEqual(["/left/a.txt", "/left/b.txt"]);
    expect(body.entries[0].command).toBe("echo /left/a.txt\n/left/b.txt");
  });
});
