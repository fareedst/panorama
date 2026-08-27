// [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockFilesPane1: FileStat[] = [
  {
    name: "a.txt",
    path: "/pane1/a.txt",
    isDirectory: false,
    size: 100,
    mtime: new Date("2024-01-01"),
    extension: "txt",
  },
];

const mockFilesPane2: FileStat[] = [
  {
    name: "b.txt",
    path: "/pane2/b.txt",
    isDirectory: false,
    size: 200,
    mtime: new Date("2024-01-02"),
    extension: "txt",
  },
];

const mockLayout: FilesLayoutConfig = {
  default: "oneRow",
  defaultPaneCount: 2,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: false,
};

const mockColumns = [
  { id: "mtime" as const, visible: true, format: "age" as const },
  { id: "size" as const, visible: true },
  { id: "name" as const, visible: true },
];

const paneRefreshKeybindings = [
  {
    key: "r",
    modifiers: { ctrl: true },
    action: "pane.refresh",
    description: "Refresh current pane",
    category: "pane-management" as const,
  },
  {
    key: "r",
    modifiers: { ctrl: true, shift: true },
    action: "pane.refresh-all",
    description: "Refresh all panes",
    category: "pane-management" as const,
  },
];

const mockCopy = {
  title: "File Manager",
  subtitle: "Browse",
};

function listingResponse(files: FileStat[]) {
  return {
    ok: true,
    json: async () => files,
  } as Response;
}

describe("WorkspaceView pane refresh [IMPL-PANE_REFRESH] [REQ-PANE_REFRESH]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM]: pane.refresh → refreshPaneTree refetches focused pane listing
  it("pane_refresh_ctrl_r_refetches_focused_pane_listing [IMPL-PANE_REFRESH]", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("path=%2Fpane1")) {
        return Promise.resolve(listingResponse(mockFilesPane1));
      }
      return Promise.resolve(listingResponse([]));
    });

    render(
      <WorkspaceView
        initialPanes={[{ path: "/pane1", files: mockFilesPane1 }]}
        keybindings={paneRefreshKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );

    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "r", ctrlKey: true });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const refreshCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([url]) => typeof url === "string" && url.includes("path=%2Fpane1"),
    );
    expect(refreshCalls.length).toBeGreaterThanOrEqual(1);
  });

  // [IMPL-PANE_REFRESH]: pane.refresh-all → handleNavigate for each pane path in parallel
  it("pane_refresh_all_ctrl_shift_r_refetches_all_pane_listings [IMPL-PANE_REFRESH]", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("path=%2Fpane1")) {
        return Promise.resolve(listingResponse(mockFilesPane1));
      }
      if (typeof url === "string" && url.includes("path=%2Fpane2")) {
        return Promise.resolve(listingResponse(mockFilesPane2));
      }
      return Promise.resolve(listingResponse([]));
    });

    render(
      <WorkspaceView
        initialPanes={[
          { path: "/pane1", files: mockFilesPane1 },
          { path: "/pane2", files: mockFilesPane2 },
        ]}
        keybindings={paneRefreshKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );

    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "r", ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const pane1Calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([url]) => typeof url === "string" && url.includes("path=%2Fpane1"),
    );
    const pane2Calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([url]) => typeof url === "string" && url.includes("path=%2Fpane2"),
    );
    expect(pane1Calls.length).toBeGreaterThanOrEqual(1);
    expect(pane2Calls.length).toBeGreaterThanOrEqual(1);
  });
});
