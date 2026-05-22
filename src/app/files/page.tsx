// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: Top-level File Manager Page Implementation: Server component loads directory data and config, renders WorkspaceView
// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
// [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: Restore workspace from ?meshId=

import { listDirectory, getUserHomeDirectory, sortFiles as sortFilesData } from "@/lib/files.data";
import { sortFiles as sortFilesUtils } from "@/lib/files.utils";
import { getFilesConfig } from "@/lib/config";
import WorkspaceView, {
  type RestorePaneMeta,
  type RestoreUiState,
} from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import path from "path";
import { getRuntime } from "@/lib/mesh/api/mesh-api-helpers";
import {
  applyMaxPanesLimit,
  parseWorkspaceSnapshotFromMesh,
} from "@/lib/workspace-mesh-bridge";
import type { LayoutType } from "@/lib/files.layout";

export interface PaneInitialState {
  path: string;
  files: FileStat[];
}

/**
 * File Manager Page - Server Component
 * [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]
 * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
 * [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
 *
 * Loads initial directory data for multiple panes based on config, renders WorkspaceView client component
 */
export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ meshId?: string }>;
}) {
  const { meshId } = await searchParams;

  const config = getFilesConfig();
  const keybindings = config.keybindings || [];
  const copy = config.copy || {};
  const layout = config.layout || {
    default: "tile",
    defaultPaneCount: 3,
    allowPaneManagement: true,
    maxPanes: 0,
  };
  const startup = config.startup || { mode: "home", paths: {} };
  const columns = config.columns || [
    { id: "mtime", visible: true },
    { id: "size", visible: true },
    { id: "name", visible: true },
  ];
  const toolbars = config.toolbars;

  const initialPanes: PaneInitialState[] = [];
  let restoreUi: RestoreUiState | undefined;
  let restorePaneMeta: RestorePaneMeta[] | undefined;
  let restoredFromMesh = false;
  let restoreWarning: string | null = null;

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_ON_FILES_PAGE
  if (meshId) {
    const record = getRuntime().meshService.getMesh(meshId);
    if (record) {
      const snapshot = parseWorkspaceSnapshotFromMesh(record.mesh);
      if (snapshot) {
        const { snapshot: limited, truncated } = applyMaxPanesLimit(
          snapshot,
          layout.maxPanes ?? 0,
        );
        if (truncated) {
          restoreWarning = `Restored first ${limited.panes.length} pane(s) due to maxPanes limit.`;
        }
        for (const pane of limited.panes) {
          const files = await listDirectory(pane.path);
          const sortedFiles = sortFilesUtils(
            files,
            pane.sortBy,
            pane.sortDirection,
            pane.sortDirsFirst,
          );
          initialPanes.push({ path: pane.path, files: sortedFiles });
        }
        restoreUi = {
          layout: limited.layout as LayoutType,
          focusIndex: limited.focusIndex,
          linkedMode: limited.linkedMode,
          comparisonMode: limited.comparisonMode,
        };
        restorePaneMeta = limited.panes.map((p) => ({
          sortBy: p.sortBy,
          sortDirection: p.sortDirection,
          sortDirsFirst: p.sortDirsFirst,
          cursor: p.cursor,
        }));
        restoredFromMesh = true;
      }
    }
  }

  if (initialPanes.length === 0) {
    const homeDir = getUserHomeDirectory();
    const paneCount = layout.defaultPaneCount || 1;

    for (let i = 0; i < paneCount; i++) {
      let panePath = homeDir;

      if (startup.mode === "configured" && startup.paths) {
        const configPath = startup.paths[`pane${i + 1}`];
        if (configPath) {
          panePath = configPath.startsWith("~")
            ? path.join(homeDir, configPath.slice(1))
            : configPath;
        }
      }

      const files = await listDirectory(panePath);
      const sortedFiles = sortFilesData(files, "Name", true);

      initialPanes.push({
        path: panePath,
        files: sortedFiles,
      });
    }
  }

  return (
    <WorkspaceView
      initialPanes={initialPanes}
      keybindings={keybindings}
      copy={copy}
      layout={layout}
      columns={columns}
      toolbars={toolbars}
      restoreUi={restoreUi}
      restorePaneMeta={restorePaneMeta}
      restoredFromMesh={restoredFromMesh}
      restoreWarning={restoreWarning}
    />
  );
}
