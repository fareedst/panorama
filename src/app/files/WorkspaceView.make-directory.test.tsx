// [TEST-MAKE_DIRECTORY] [IMPL-WORKSPACE_VIEW] [IMPL-MAKE_DIRECTORY_DIALOG] [REQ-DIRECTORY_NAVIGATION]

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesColumnConfig, FilesLayoutConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockKeybindings = [
  { key: "Tab", action: "navigate.tab", description: "Next pane", category: "navigation" as const },
];

const fileA: FileStat = {
  name: "a.txt",
  path: "/left/a.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01T00:00:00.000Z"),
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
  makeDirectory: {
    makeDirectoryMenu: "Make directory…",
    makeDirectoryTitle: "Make directory",
    makeDirectoryApply: "Create",
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

describe("WorkspaceView make directory [REQ-DIRECTORY_NAVIGATION]", () => {
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
          return { ok: true, json: async () => [fileA] } as Response;
        }
        if (url.includes("/right")) {
          return { ok: true, json: async () => [] } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens Make directory dialog from file row context menu and posts bulk-mkdir", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/left", files: [fileA] },
          { path: "/right", files: [] },
        ]}
        layout={mockLayout}
        columns={mockColumns}
        copy={mockCopy}
        keybindings={mockKeybindings}
        toolbars={mockToolbars}
      />,
    );

    await waitFor(() => expect(screen.getByTestId("pane-0")).toBeInTheDocument());

    const pane = screen.getByTestId("pane-0");
    const row = within(pane).getByText("a.txt").closest(".cursor-pointer") as Element;
    fireEvent.contextMenu(row);
    fireEvent.click(screen.getByTestId("make-directory-menu-item"));

    await waitFor(() =>
      expect(screen.getByTestId("make-directory-dialog")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId("make-directory-name-input"), {
      target: { value: "newfolder" },
    });
    fireEvent.click(screen.getByTestId("make-directory-apply"));

    await waitFor(() => {
      const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        ([url, init]) =>
          String(url).includes("/api/files") &&
          (init as RequestInit)?.method === "POST",
      );
      expect(postCall).toBeDefined();
    });

    const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) =>
        String(url).includes("/api/files") &&
        (init as RequestInit)?.method === "POST",
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.operation).toBe("bulk-mkdir");
    expect(body.entries).toEqual([{ path: "/left/newfolder" }]);
  });
});
