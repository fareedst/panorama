// [TEST-RENAME_REGEX] [IMPL-WORKSPACE_VIEW] [IMPL-RENAME_REGEX_DIALOG] [REQ-BULK_FILE_OPS]
// e2e_only_reason: not required — composition tests cover ContextMenu → dialog → POST without browser-only behavior

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesColumnConfig, FilesLayoutConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockKeybindings = [
  { key: "Tab", action: "navigate.tab", description: "Next pane", category: "navigation" as const },
];

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
  mtime: new Date("2024-06-01T00:00:00.000Z"),
};

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
  size: 10,
  mtime: new Date("2024-02-01T00:00:00.000Z"),
  extension: ".txt",
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
  renameRegex: {
    renameRegexMenu: "Rename Regex…",
    renameRegexTitle: "Rename Regex",
    renameRegexApply: "Apply",
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

describe("WorkspaceView rename regex [RENAME_REGEX]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/files") && init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({ successCount: 1, errorCount: 0, errors: [] }),
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

  // [IMPL-WORKSPACE_VIEW] [IMPL-RENAME_REGEX_DIALOG] [REQ-BULK_FILE_OPS]: context menu → dialog → bulk-rename POST
  it("opens Rename Regex dialog from file row context menu and posts bulk-rename", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    const pane = screen.getByTestId("pane-0");
    const row = within(pane).getByText("shared.txt").closest(".cursor-pointer") as Element;
    fireEvent.contextMenu(row);

    fireEvent.click(screen.getByTestId("rename-regex-menu-item"));

    await waitFor(() =>
      expect(screen.getByTestId("rename-regex-dialog")).toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByTestId("rename-regex-in-all-panes").querySelector("input")!,
    );
    fireEvent.change(screen.getByTestId("rename-regex-match"), {
      target: { value: "\\.txt$" },
    });
    fireEvent.change(screen.getByTestId("rename-regex-replacement"), {
      target: { value: ".bak" },
    });
    fireEvent.click(screen.getByTestId("rename-regex-apply"));

    await waitFor(() =>
      expect(screen.queryByTestId("rename-regex-dialog")).not.toBeInTheDocument(),
    );

    const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) =>
        String(url).includes("/api/files") &&
        (init as RequestInit)?.method === "POST",
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.operation).toBe("bulk-rename");
    expect(body.entries).toEqual([
      { src: "/left/shared.txt", dest: "/left/shared.bak" },
      { src: "/right/shared.txt", dest: "/right/shared.bak" },
    ]);
  });

  // [IMPL-WORKSPACE_VIEW] [IMPL-RENAME_REGEX_DIALOG] [REQ-BULK_FILE_OPS]: marksAtOpen flows to bulk-rename for marked basenames
  it("posts bulk-rename for marked files in this pane", async () => {
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

    const row = within(pane).getByText("a.txt").closest(".cursor-pointer") as Element;
    fireEvent.contextMenu(row);
    fireEvent.click(screen.getByTestId("rename-regex-menu-item"));

    await waitFor(() =>
      expect(screen.getByTestId("rename-regex-dialog")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId("rename-regex-match"), {
      target: { value: "\\.txt$" },
    });
    fireEvent.change(screen.getByTestId("rename-regex-replacement"), {
      target: { value: ".bak" },
    });
    fireEvent.click(screen.getByTestId("rename-regex-apply"));

    await waitFor(() =>
      expect(screen.queryByTestId("rename-regex-dialog")).not.toBeInTheDocument(),
    );

    const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) =>
        String(url).includes("/api/files") &&
        (init as RequestInit)?.method === "POST",
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.operation).toBe("bulk-rename");
    expect(body.entries).toEqual([
      { src: "/left/a.txt", dest: "/left/a.bak" },
      { src: "/left/b.txt", dest: "/left/b.bak" },
    ]);
  });

  // [IMPL-WORKSPACE_VIEW] [IMPL-RENAME_REGEX_DIALOG] [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — thisPane target renames only in initiating pane
  it("posts bulk-rename for this pane only", async () => {
    renderWorkspace();
    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    const pane = screen.getByTestId("pane-0");
    const row = within(pane).getByText("shared.txt").closest(".cursor-pointer") as Element;
    fireEvent.contextMenu(row);
    fireEvent.click(screen.getByTestId("rename-regex-menu-item"));

    await waitFor(() =>
      expect(screen.getByTestId("rename-regex-dialog")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId("rename-regex-match"), {
      target: { value: "\\.txt$" },
    });
    fireEvent.change(screen.getByTestId("rename-regex-replacement"), {
      target: { value: ".bak" },
    });
    fireEvent.click(screen.getByTestId("rename-regex-apply"));

    await waitFor(() =>
      expect(screen.queryByTestId("rename-regex-dialog")).not.toBeInTheDocument(),
    );

    const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) =>
        String(url).includes("/api/files") &&
        (init as RequestInit)?.method === "POST",
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.operation).toBe("bulk-rename");
    expect(body.entries).toEqual([
      { src: "/left/shared.txt", dest: "/left/shared.bak" },
    ]);
  });
});
