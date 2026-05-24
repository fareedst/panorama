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
});
