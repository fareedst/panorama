// [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-WORKSPACE_VIEW] [IMPL-WORKSPACE_MESH_BRIDGE]: Tranche 5 — archive pane navigation composition tests

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig } from "@/lib/config.types";
import {
  buildWorkspaceRestoreBundle,
  captureWorkspaceSnapshot,
} from "@/lib/workspace-mesh-bridge";
import {
  decodeVirtualArchivePath,
  encodeVirtualArchivePath,
  isVirtualArchivePath,
} from "@/lib/archive-path-client";

global.fetch = vi.fn();

const mockKeybindings = [
  { key: "Enter", action: "navigate.enter", description: "Open/Enter", category: "navigation" as const },
  { key: "Backspace", action: "navigate.parent", description: "Parent", category: "navigation" as const },
  { key: "Tab", action: "navigate.tab", description: "Next pane", category: "navigation" as const },
  { key: "l", action: "link.toggle", description: "Toggle linked mode", category: "view-sort" as const },
  {
    key: "`",
    action: "view.comparison",
    description: "Toggle comparison mode",
    category: "view-sort" as const,
  },
];

const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 1,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: false,
};

const mockColumns = [
  { id: "mtime" as const, visible: true, format: "age" as const },
  { id: "size" as const, visible: true },
  { id: "name" as const, visible: true },
];

const mockCopy = {
  title: "File Manager",
  layouts: {
    tile: "Tile",
    oneRow: "One Row",
    oneColumn: "One Column",
    fullscreen: "Fullscreen",
  },
};

const mockToolbars = {
  enabled: true,
  workspace: { enabled: true, position: "top" as const, groups: [] },
  pane: { enabled: false, position: "hidden" as const, groups: [] },
  system: { enabled: false, position: "hidden" as const, groups: [] },
};

const archiveHostPath = "/downloads/sample.zip";
const archiveRootLocator = encodeVirtualArchivePath(archiveHostPath, "");
const archiveNestedLocator = encodeVirtualArchivePath(archiveHostPath, "docs");

function enrichedListingResponse(files: FileStat[], sourcePath?: string) {
  const resolvedSource =
    sourcePath ?? (files[0]?.path ? files[0].path.replace(/\/[^/]+$/, "") : "/");
  return {
    files,
    hiddenCount: 0,
    totalCount: files.length,
    volumeStats: {
      totalBytes: 1_000_000,
      availableBytes: 500_000,
      freePercent: 50,
      deviceId: 1,
      sourcePath: resolvedSource,
      status: "available" as const,
    },
  };
}

function hostArchiveFile(): FileStat {
  return {
    name: "sample.zip",
    path: archiveHostPath,
    isDirectory: false,
    size: 4096,
    mtime: new Date("2024-06-01"),
    extension: "zip",
  };
}

function ordinaryPaneFiles(): FileStat[] {
  return [
    hostArchiveFile(),
    {
      name: "readme.txt",
      path: "/downloads/readme.txt",
      isDirectory: false,
      size: 12,
      mtime: new Date("2024-06-02"),
      extension: "txt",
    },
  ];
}

function hostArchiveOnly(): FileStat[] {
  return [hostArchiveFile()];
}

function archiveRootFiles(): FileStat[] {
  return [
    {
      name: "docs",
      path: archiveNestedLocator,
      isDirectory: true,
      size: 0,
      mtime: new Date("2024-06-01"),
      extension: "",
      archiveSource: {
        archivePath: archiveHostPath,
        entryPath: "docs",
        isArchiveRoot: false,
        isVirtual: true,
        format: "zip",
        readOnly: true,
      },
    },
    {
      name: "hello.txt",
      path: encodeVirtualArchivePath(archiveHostPath, "hello.txt"),
      isDirectory: false,
      size: 5,
      mtime: new Date("2024-06-01"),
      extension: "txt",
      archiveSource: {
        archivePath: archiveHostPath,
        entryPath: "hello.txt",
        isArchiveRoot: true,
        isVirtual: true,
        format: "zip",
        readOnly: true,
      },
    },
  ];
}

function mockFetchForArchiveNavigation() {
  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
    async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      const pathMatch = url.match(/[?&]path=([^&]+)/);
      const requestedPath = pathMatch
        ? decodeURIComponent(pathMatch[1] ?? "")
        : "";

      if (requestedPath === archiveRootLocator) {
        return {
          ok: true,
          json: async () => enrichedListingResponse(archiveRootFiles(), archiveHostPath),
        } as Response;
      }
      if (requestedPath === archiveNestedLocator) {
        return {
          ok: true,
          json: async () =>
            enrichedListingResponse(
              [
                {
                  name: "guide.txt",
                  path: encodeVirtualArchivePath(archiveHostPath, "docs/guide.txt"),
                  isDirectory: false,
                  size: 20,
                  mtime: new Date("2024-06-01"),
                  extension: "txt",
                  archiveSource: {
                    archivePath: archiveHostPath,
                    entryPath: "docs/guide.txt",
                    isArchiveRoot: false,
                    isVirtual: true,
                    format: "zip",
                    readOnly: true,
                  },
                },
              ],
              archiveHostPath,
            ),
        } as Response;
      }
      if (requestedPath === "/downloads") {
        return {
          ok: true,
          json: async () => enrichedListingResponse(ordinaryPaneFiles()),
        } as Response;
      }
      if (requestedPath === archiveHostPath || url.includes(encodeURIComponent(archiveHostPath))) {
        return { ok: false, status: 404 } as Response;
      }
      return { ok: true, json: async () => enrichedListingResponse([]) } as Response;
    },
  );
}

describe("WorkspaceView archive navigation [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-WORKSPACE_VIEW]", () => {
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
    mockFetchForArchiveNavigation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("OPEN_ARCHIVE_IN_PANE_navigates_to_virtual_root_on_host_zip_enter", async () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/downloads", files: hostArchiveOnly() }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    fireEvent.keyDown(window, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("pane-archive-readonly")).toBeInTheDocument();
    });
    expect(screen.getByTestId("pane-0")).toHaveTextContent("Archive: sample.zip");
    expect(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls.some((call) => {
        const url = String(call[0]);
        return url.includes(encodeURIComponent(archiveRootLocator));
      }),
    ).toBe(true);
  });

  it("OPEN_ARCHIVE_IN_PANE_navigates_on_double_click_host_zip", async () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: "/downloads", files: hostArchiveOnly() }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    fireEvent.doubleClick(screen.getByText("sample.zip"));

    await waitFor(() => {
      expect(screen.getByTestId("pane-archive-readonly")).toBeInTheDocument();
    });
  });

  it("ARCHIVE_DESCEND_navigates_to_nested_virtual_locator_on_directory_enter", async () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: archiveRootLocator, files: archiveRootFiles() }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    fireEvent.keyDown(window, { key: "Enter" });

    await waitFor(() => {
      const pane = screen.getByTestId("pane-0");
      expect(within(pane).getByText("guide.txt")).toBeInTheDocument();
    });
    expect(decodeVirtualArchivePath(archiveNestedLocator).entryPath).toBe("docs");
  });

  it("ARCHIVE_PARENT_NAVIGATION_from_root_returns_host_parent_directory", async () => {
    render(
      <WorkspaceView
        initialPanes={[{ path: archiveRootLocator, files: archiveRootFiles() }]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    fireEvent.keyDown(window, { key: "Backspace" });

    await waitFor(() => {
      const pane = screen.getByTestId("pane-0");
      expect(pane).toHaveTextContent("/downloads");
      expect(screen.queryByTestId("pane-archive-readonly")).not.toBeInTheDocument();
    });
  });

  it("ARCHIVE_PARENT_NAVIGATION_from_nested_entry_returns_archive_root", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          {
            path: archiveNestedLocator,
            files: [
              {
                name: "guide.txt",
                path: encodeVirtualArchivePath(archiveHostPath, "docs/guide.txt"),
                isDirectory: false,
                size: 20,
                mtime: new Date("2024-06-01"),
                extension: "txt",
                archiveSource: {
                  archivePath: archiveHostPath,
                  entryPath: "docs/guide.txt",
                  isArchiveRoot: false,
                  isVirtual: true,
                  format: "zip",
                  readOnly: true,
                },
              },
            ],
          },
        ]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    fireEvent.keyDown(window, { key: "Backspace" });

    await waitFor(() => {
      expect(within(screen.getByTestId("pane-0")).getByText("hello.txt")).toBeInTheDocument();
    });
    expect(isVirtualArchivePath(archiveRootLocator)).toBe(true);
  });

  it("MESH_RESTORE_ARCHIVE_PATH_loads_listing_for_valid_virtual_path", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: archiveRootLocator,
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });

    const bundle = await buildWorkspaceRestoreBundle(snapshot, async (pathValue) => {
      if (pathValue === archiveRootLocator) {
        return archiveRootFiles();
      }
      return [];
    });

    expect(bundle.initialPanes[0]?.files).toHaveLength(2);
    expect(bundle.initialPanes[0]?.path).toBe(archiveRootLocator);
  });

  it("MESH_RESTORE_ARCHIVE_PATH_degrades_when_archive_missing", async () => {
    const snapshot = captureWorkspaceSnapshot({
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panes: [
        {
          path: archiveRootLocator,
          sortBy: "name",
          sortDirection: "asc",
          sortDirsFirst: true,
          cursor: 0,
        },
      ],
    });

    const bundle = await buildWorkspaceRestoreBundle(snapshot, async () => {
      throw new Error("Failed to list directory");
    });

    expect(bundle.initialPanes[0]?.files).toEqual([]);
    expect(bundle.restoreWarnings?.join(" ")).toMatch(/sample\.zip|Archive/i);
  });

  it("LINKED_NAV_skips_sync_when_opening_archive_in_linked_mode", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/downloads", files: hostArchiveOnly() },
          { path: "/other", files: hostArchiveOnly() },
        ]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={{ ...mockLayout, defaultLinkedMode: true }}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText("🔗")).toHaveLength(2);
    });

    fireEvent.keyDown(window, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("pane-archive-readonly")).toBeInTheDocument();
    });

    const pane1 = screen.getByTestId("pane-1");
    expect(pane1).toHaveTextContent("/other");
    expect(pane1).not.toHaveTextContent("@archive/v1/");
  });

  it("COMPARISON_INDEX_includes_archive_entry_basename_smoke", async () => {
    const sharedName = "hello.txt";
    render(
      <WorkspaceView
        initialPanes={[
          { path: archiveRootLocator, files: archiveRootFiles() },
          {
            path: "/mirror",
            files: [
              {
                name: sharedName,
                path: `/mirror/${sharedName}`,
                isDirectory: false,
                size: 5,
                mtime: new Date("2024-06-01"),
                extension: "txt",
              },
            ],
          },
        ]}
        keybindings={mockKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
        toolbars={mockToolbars}
        restoreUi={{
          layout: "Tile",
          focusIndex: 0,
          linkedMode: false,
          comparisonMode: "name",
        }}
      />,
    );

    await waitFor(() => {
      const archiveRow = within(screen.getByTestId("pane-0")).getByText(sharedName);
      expect(archiveRow.closest(".cursor-pointer")?.className).toMatch(/bg-/);
    });
  });

  it("COPY_from_archive_pane_routes_to_extract_not_bulk_copy", async () => {
    const destDir = "/dest/extract-target";
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("/api/files") && init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as { operation?: string };
        if (body.operation === "extract-archive-entry") {
          return { ok: true, json: async () => ({ success: true }) } as Response;
        }
        return {
          ok: false,
          status: 400,
          json: async () => ({
            error: "Virtual archive paths cannot be mutated",
            errorCode: "VIRTUAL_PATH_MUTATION_REJECTED",
          }),
        } as Response;
      }
      const pathMatch = url.match(/[?&]path=([^&]+)/);
      const requestedPath = pathMatch ? decodeURIComponent(pathMatch[1] ?? "") : "";
      if (requestedPath === archiveRootLocator) {
        return {
          ok: true,
          json: async () => enrichedListingResponse(archiveRootFiles(), archiveHostPath),
        } as Response;
      }
      if (requestedPath === destDir) {
        return {
          ok: true,
          json: async () => enrichedListingResponse([], destDir),
        } as Response;
      }
      return { ok: true, json: async () => enrichedListingResponse([]) } as Response;
    });

    render(
      <WorkspaceView
        initialPanes={[
          { path: archiveRootLocator, files: archiveRootFiles() },
          { path: destDir, files: [] },
        ]}
        keybindings={[
          ...mockKeybindings,
          { key: "c", action: "file.copy", description: "Copy", category: "file-operations" as const },
        ]}
        copy={mockCopy}
        layout={{ ...mockLayout, defaultPaneCount: 2 }}
        columns={mockColumns}
        toolbars={mockToolbars}
      />,
    );

    fireEvent.click(within(screen.getByTestId("pane-0")).getByText("hello.txt"));
    fireEvent.keyDown(window, { key: "c" });
    await waitFor(() => {
      expect(screen.getByText(/Extract 1 file\(s\) from archive to:/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      const postCalls = fetchMock.mock.calls.filter(
        ([, init]) => init?.method === "POST",
      );
      expect(
        postCalls.some(([, init]) => {
          const body = JSON.parse(String(init?.body)) as { operation?: string };
          return body.operation === "extract-archive-entry";
        }),
      ).toBe(true);
      expect(
        postCalls.some(([, init]) => {
          const body = JSON.parse(String(init?.body)) as { operation?: string };
          return body.operation === "bulk-copy";
        }),
      ).toBe(false);
    });
  });
});
