// [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_SNAPSHOT_SUMMARY UI

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkspaceSnapshotSummaryList } from "./WorkspaceSnapshotSummaryList";
import type { WorkspaceSnapshotSummary } from "@/lib/workspace-mesh-bridge";

describe("WorkspaceSnapshotSummaryList [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  // [IMPL-WORKSPACE_MESH_BRIDGE] [IMPL-FILE_COLUMN_CONFIG] WORKSPACE_SNAPSHOT_SUMMARY — fileColumnsLabel line on mesh detail
  it("renders file columns label when provided", () => {
    const summary: WorkspaceSnapshotSummary = {
      layout: "Tile",
      focusIndex: 0,
      linkedMode: false,
      comparisonMode: "off",
      panePaths: ["/tmp"],
      note: "",
      mostRecentSaveTime: null,
      sharedSortLabel: "name asc",
      fileColumnsLabel: "Modified, Size, Name",
      panes: [
        {
          path: "/tmp",
          sortLabel: "name asc",
          displayFilterLabel: "(none)",
          crossPaneVisibilityLabel: "(none)",
        },
      ],
    };
    render(<WorkspaceSnapshotSummaryList summary={summary} />);
    expect(screen.getByText(/File columns: Modified, Size, Name/)).toBeInTheDocument();
  });

  it("omits file columns line when label absent", () => {
    const summary: WorkspaceSnapshotSummary = {
      layout: "Tile",
      focusIndex: 0,
      linkedMode: true,
      comparisonMode: "off",
      panePaths: [],
      note: "",
      mostRecentSaveTime: null,
      sharedSortLabel: "name asc",
      panes: [],
    };
    render(<WorkspaceSnapshotSummaryList summary={summary} />);
    expect(screen.queryByText(/File columns:/)).not.toBeInTheDocument();
  });

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-CROSS_PANE_VISIBILITY] WORKSPACE_SNAPSHOT_SUMMARY_LIST — mesh_detail_snapshot_summary_shows_per_pane_compare_filters
  it("renders per-pane compare filter labels", () => {
    const summary: WorkspaceSnapshotSummary = {
      layout: "OneColumn",
      focusIndex: 0,
      linkedMode: true,
      comparisonMode: "name",
      panePaths: ["/tmp/a", "/tmp/b"],
      note: "note",
      mostRecentSaveTime: null,
      sharedSortLabel: "mtime asc dirs-first",
      panes: [
        {
          path: "/tmp/a",
          sortLabel: "mtime asc dirs-first",
          displayFilterLabel: "Hide dotfiles",
          crossPaneVisibilityLabel: "(none) · missingSome:exclude",
        },
        {
          path: "/tmp/b",
          sortLabel: "size desc dirs-first",
          displayFilterLabel: "Hide dotfiles",
          crossPaneVisibilityLabel: "(none)",
        },
      ],
    };
    render(<WorkspaceSnapshotSummaryList summary={summary} />);
    expect(screen.getByText("Compare filter: (none) · missingSome:exclude")).toBeInTheDocument();
    expect(screen.getByText("Compare filter: (none)")).toBeInTheDocument();
    expect(screen.queryByText(/^Compare filters:/)).not.toBeInTheDocument();
  });
});
