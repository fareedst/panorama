// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI] [REQ-CROSS_PANE_VISIBILITY]: WORKSPACE_SNAPSHOT_SUMMARY_LIST UI

import type { WorkspaceSnapshotSummary } from "@/lib/workspace-mesh-bridge";
import { formatDateTime } from "@/lib/files.utils";

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI] [REQ-FILE_SORTING_ADVANCED] [REQ-PANE_DISPLAY_FILTER]
// how: Map WORKSPACE_SNAPSHOT_SUMMARY fields to workspace-snapshot-summary list items on mesh detail.
export function WorkspaceSnapshotSummaryList({ summary }: { summary: WorkspaceSnapshotSummary }) {
  return (
    <ul className="mt-2 list-inside list-disc space-y-1">
      {summary.note ? <li>Note: {summary.note}</li> : null}
      {summary.mostRecentSaveTime ? (
        <li>Most recent save time: {formatDateTime(summary.mostRecentSaveTime)}</li>
      ) : null}
      <li>Layout: {summary.layout}</li>
      <li>Focus pane: {summary.focusIndex + 1}</li>
      <li>Linked: {summary.linkedMode ? "on" : "off"}</li>
      <li>Comparison: {summary.comparisonMode}</li>
      <li>Shared sort: {summary.sharedSortLabel}</li>
      {summary.fileColumnsLabel ? <li>File columns: {summary.fileColumnsLabel}</li> : null}
      {summary.panes.map((pane, i) => (
        <li key={`pane-${i}-${pane.path}`} className="list-none">
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>
              Pane {i + 1}: {pane.path}
            </li>
            <li>Sort: {pane.sortLabel}</li>
            <li>Display filter: {pane.displayFilterLabel}</li>
            {/* [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-CROSS_PANE_VISIBILITY] WORKSPACE_SNAPSHOT_SUMMARY_LIST — how: per-pane Compare filter label, not workspace aggregate. */}
            <li>Compare filter: {pane.crossPaneVisibilityLabel}</li>
          </ul>
        </li>
      ))}
    </ul>
  );
}
