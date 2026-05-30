// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

const mockFilesPane3: FileStat[] = [
  {
    name: "c.txt",
    path: "/pane3/c.txt",
    isDirectory: false,
    size: 300,
    mtime: new Date("2024-01-03"),
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

const paneReorderKeybindings = [
  { key: "s", modifiers: { ctrl: true, shift: true }, action: "pane.swap", description: "Swap", category: "pane-management" as const },
  { key: "s", modifiers: { ctrl: true, shift: true, alt: true }, action: "pane.swapPrev", description: "Swap prev", category: "pane-management" as const },
  { key: "]", modifiers: { ctrl: true, shift: true }, action: "pane.cycle", description: "Cycle", category: "pane-management" as const },
  { key: "[", modifiers: { ctrl: true, shift: true }, action: "pane.cyclePrev", description: "Cycle prev", category: "pane-management" as const },
];

const mockCopy = {
  title: "File Manager",
  subtitle: "Browse",
  paneManagement: {
    paneOrderTitle: "Pane order",
    cancel: "Cancel",
    apply: "Apply",
  },
};

describe("WorkspaceView pane reorder [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]: how: swap panes[i] and panes[j]; remap focusIndex; permute directory history; clear scrollTriggers
  it("swaps two panes via pane.swap keeping focus on same content", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/pane1", files: mockFilesPane1 },
          { path: "/pane2", files: mockFilesPane2 },
        ]}
        keybindings={paneReorderKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane1");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/pane2");
    });

    expect(screen.getByTestId("pane-0").closest(".border-2")).toHaveClass("border-blue-500");

    fireEvent.keyDown(window, { key: "s", ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane2");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/pane1");
    });

    expect(screen.getByTestId("pane-1").closest(".border-2")).toHaveClass("border-blue-500");
  });

  // [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: rotate all panes one slot forward or backward; remap focus and directory history
  it("cycles three panes forward via pane.cycle", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/pane1", files: mockFilesPane1 },
          { path: "/pane2", files: mockFilesPane2 },
          { path: "/pane3", files: mockFilesPane3 },
        ]}
        keybindings={paneReorderKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane1");
    });

    fireEvent.keyDown(window, { key: "]", ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane2");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/pane3");
      expect(screen.getByTestId("pane-2")).toHaveTextContent("/pane1");
    });
  });

  // [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: pane.swap / pane.swapPrev — two panes swap 0↔1; else swap focus with wrapped next/prev neighbor
  it("swaps focused pane with previous neighbor via pane.swapPrev on three panes", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/pane1", files: mockFilesPane1 },
          { path: "/pane2", files: mockFilesPane2 },
          { path: "/pane3", files: mockFilesPane3 },
        ]}
        keybindings={paneReorderKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane1");
    });

    fireEvent.keyDown(window, { key: "s", ctrlKey: true, shiftKey: true, altKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane3");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/pane2");
      expect(screen.getByTestId("pane-2")).toHaveTextContent("/pane1");
    });
  });

  // [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: rotate all panes one slot forward or backward; remap focus and directory history
  it("cycles three panes backward via pane.cyclePrev", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/pane1", files: mockFilesPane1 },
          { path: "/pane2", files: mockFilesPane2 },
          { path: "/pane3", files: mockFilesPane3 },
        ]}
        keybindings={paneReorderKeybindings}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane1");
    });

    fireEvent.keyDown(window, { key: "[", ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane3");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/pane1");
      expect(screen.getByTestId("pane-2")).toHaveTextContent("/pane2");
    });
  });

  // [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: Apply reorders panes[] by index permutation from dialog; focus follows previous focus pane content
  it("reorders panes via pane order dialog", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/pane1", files: mockFilesPane1 },
          { path: "/pane2", files: mockFilesPane2 },
        ]}
        keybindings={[
          ...paneReorderKeybindings,
          { key: "o", action: "pane.order", description: "Pane order", category: "pane-management" as const },
        ]}
        copy={mockCopy}
        layout={mockLayout}
        columns={mockColumns}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane1");
    });

    fireEvent.keyDown(window, { key: "o" });

    await waitFor(() => {
      expect(screen.getByTestId("pane-order-dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("pane-order-down-0"));
    fireEvent.click(screen.getByTestId("pane-order-apply"));

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane2");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/pane1");
    });
  });

  // [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: disable pane.swap, cycle, order when allowPaneManagement false or fewer than two panes
  it("does not reorder panes when allowPaneManagement is false", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/pane1", files: mockFilesPane1 },
          { path: "/pane2", files: mockFilesPane2 },
        ]}
        keybindings={paneReorderKeybindings}
        copy={mockCopy}
        layout={{ ...mockLayout, allowPaneManagement: false }}
        columns={mockColumns}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane1");
    });

    fireEvent.keyDown(window, { key: "s", ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("pane-0")).toHaveTextContent("/pane1");
      expect(screen.getByTestId("pane-1")).toHaveTextContent("/pane2");
    });
  });
});
