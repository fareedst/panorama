// [REQ-CROSS_PANE_VISIBILITY] [IMPL-WORKSPACE_VIEW]

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import WorkspaceView from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import type { FilesLayoutConfig, ToolbarsConfig } from "@/lib/config.types";

global.fetch = vi.fn();

const mockLayout: FilesLayoutConfig = {
  default: "tile",
  defaultPaneCount: 2,
  allowPaneManagement: true,
  maxPanes: 4,
  defaultLinkedMode: false,
};

const file = (name: string, size: number): FileStat => ({
  name,
  path: `/a/${name}`,
  isDirectory: false,
  size,
  mtime: "2024-01-01T00:00:00.000Z",
  extension: "txt",
});

const paneA = [file("shared.txt", 100), file("only-a.txt", 1)];
const paneB = [file("shared.txt", 200), file("only-b.txt", 2)];

const mockToolbars: ToolbarsConfig = {
  enabled: true,
  actions: {
    "view.compareFilter.sharedAll": {
      description: "Shared all",
      icon: "files",
    },
    "view.compareFilter.missingSome": {
      description: "Missing some",
      icon: "file-minus",
    },
  },
  workspace: {
    enabled: true,
    position: "top",
    groups: [
      {
        name: "Compare filters",
        actions: ["view.compareFilter.sharedAll", "view.compareFilter.missingSome"],
      },
    ],
  },
  pane: { enabled: false, position: "top", groups: [] },
  system: { enabled: false, position: "top", groups: [] },
};

describe("[REQ-CROSS_PANE_VISIBILITY] WorkspaceView cross-pane visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("include sharedAll shows only shared rows in both panes", () => {
    // [IMPL-CROSS_PANE_VISIBILITY_ENGINE] APPLY_CROSS_PANE_VISIBILITY: how: include sharedAll filters focused pane then mirrors basenames
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/a", files: paneA },
          { path: "/b", files: paneB },
        ]}
        keybindings={[]}
        copy={{ title: "FM" }}
        layout={mockLayout}
        columns={[{ id: "name", visible: true }]}
        toolbars={mockToolbars}
      />,
    );

    const sharedBtn = screen.getByTestId("toolbar-view.compareFilter.sharedAll");
    fireEvent.click(sharedBtn);
    expect(sharedBtn).toHaveAttribute("data-tri-state", "include");

    const pane0 = screen.getByTestId("pane-0");
    const pane1 = screen.getByTestId("pane-1");
    expect(within(pane0).getByText("shared.txt")).toBeInTheDocument();
    expect(within(pane0).queryByText("only-a.txt")).not.toBeInTheDocument();
    expect(within(pane1).getByText("shared.txt")).toBeInTheDocument();
    expect(within(pane1).queryByText("only-b.txt")).not.toBeInTheDocument();
  });

  it("toolbar tri-states follow focused pane draft when focus changes", () => {
    // [IMPL-CROSS_PANE_VISIBILITY_UI] SYNC_TOOLBAR_TO_FOCUS: how: tri-state buttons reflect focused pane draft on focusIndex change
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/a", files: paneA },
          { path: "/b", files: paneB },
        ]}
        keybindings={[]}
        copy={{ title: "FM" }}
        layout={mockLayout}
        columns={[{ id: "name", visible: true }]}
        toolbars={mockToolbars}
      />,
    );

    const sharedBtn = screen.getByTestId("toolbar-view.compareFilter.sharedAll");
    fireEvent.click(sharedBtn);
    expect(sharedBtn).toHaveAttribute("data-tri-state", "include");

    const pane1 = screen.getByTestId("pane-1");
    fireEvent.mouseDown(pane1);
    expect(sharedBtn).toHaveAttribute("data-tri-state", "inactive");

    fireEvent.click(sharedBtn);
    expect(sharedBtn).toHaveAttribute("data-tri-state", "include");

    const pane0 = screen.getByTestId("pane-0");
    fireEvent.mouseDown(pane0);
    expect(sharedBtn).toHaveAttribute("data-tri-state", "include");
  });

  // [IMPL-CROSS_PANE_VISIBILITY_ENGINE] EVALUATE_FOCUS_VISIBILITY: how: exclude hides matching rows before include evaluation
  it("exclude sharedAll hides shared rows in focused pane", () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/a", files: paneA },
          { path: "/b", files: paneB },
        ]}
        keybindings={[]}
        copy={{ title: "FM" }}
        layout={mockLayout}
        columns={[{ id: "name", visible: true }]}
        toolbars={mockToolbars}
      />,
    );

    const sharedBtn = screen.getByTestId("toolbar-view.compareFilter.sharedAll");
    fireEvent.click(sharedBtn);
    fireEvent.click(sharedBtn);
    expect(sharedBtn).toHaveAttribute("data-tri-state", "exclude");

    const pane0 = screen.getByTestId("pane-0");
    expect(within(pane0).queryByText("shared.txt")).not.toBeInTheDocument();
    expect(within(pane0).getByText("only-a.txt")).toBeInTheDocument();
  });

  // [IMPL-CROSS_PANE_VISIBILITY_ENGINE] RECONCILE_AFTER_VISIBILITY: how: marks on hidden files drop after filter apply
  it("RECONCILE_AFTER_VISIBILITY drops marks on hidden files", async () => {
    render(
      <WorkspaceView
        initialPanes={[
          { path: "/a", files: paneA },
          { path: "/b", files: paneB },
        ]}
        keybindings={[]}
        copy={{ title: "FM" }}
        layout={mockLayout}
        columns={[{ id: "name", visible: true }]}
        toolbars={mockToolbars}
      />,
    );

    const pane0 = screen.getByTestId("pane-0");
    const checkboxes = within(pane0).getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText("[1 marked]")).toBeInTheDocument();

    const sharedBtn = screen.getByTestId("toolbar-view.compareFilter.sharedAll");
    fireEvent.click(sharedBtn);

    await waitFor(() => {
      expect(screen.queryByText("[1 marked]")).not.toBeInTheDocument();
    });
  });
});
