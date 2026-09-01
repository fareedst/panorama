// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: Top-level File Manager Page Implementation: Server component loads directory data and config, renders WorkspaceView
// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
// [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: Restore workspace from ?meshId=

import { getUserHomeDirectory, sortFiles as sortFilesData } from "@/lib/files.data";
import {
  listDirectoryForRequestPath,
  volumeStatsSourcePath,
} from "@/lib/directory-listing";
import { getVolumeStats } from "@/lib/volume-stats";
import { getFilesConfig, getThemeConfig, DEFAULT_FILE_TYPES } from "@/lib/config";
import WorkspaceView, {
  type RestorePaneMeta,
  type RestoreUiState,
} from "./WorkspaceView";
import type { FileStat } from "@/lib/files.types";
import path from "path";
import { getRuntime } from "@/lib/mesh/api/mesh-api-helpers";
import {
  applyMaxPanesLimit,
  appendSnapshotLayoutWarnings,
  buildWorkspaceRestoreBundle,
  parseWorkspaceSnapshotFromMesh,
  type WorkspaceSnapshot,
} from "@/lib/workspace-mesh-bridge";
import type { LayoutType } from "@/lib/files.layout";
import { FilesStartupMeshGate } from "./FilesStartupMeshGate";
import { captureRequestAgeReferenceMs } from "@/lib/request-age-reference";
import { parsePaneDeepLinkPaths, searchParamString } from "@/lib/files.utils";

// [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_ON_FILES_PAGE — per-request meshId (not static /files shell).
export const dynamic = "force-dynamic";

export interface PaneInitialState {
  path: string;
  files: FileStat[];
  volumeStats?: Awaited<ReturnType<typeof getVolumeStats>>;
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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const meshId = searchParamString(resolvedSearchParams.meshId);
  const panesQuery = searchParamString(resolvedSearchParams.panes);
  const pane0Query = searchParamString(resolvedSearchParams.pane0);
  const paneDeepLinkPaths = parsePaneDeepLinkPaths(resolvedSearchParams);

  const config = getFilesConfig();
  const fileTypes = getThemeConfig().files?.fileTypes ?? DEFAULT_FILE_TYPES;
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
  let restoreLayout: LayoutType | undefined;
  let restorePaneMeta: RestorePaneMeta[] | undefined;
  let restoredFromMesh = false;
  let restoreWarning: string | null = null;
  let loadedMeshName: string | undefined;
  let loadedSnapshot: WorkspaceSnapshot | undefined;

  // [IMPL-FILE_MANAGER_PAGE] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: how: meshId query restores snapshot before default startup panes
  if (meshId) {
    const record = getRuntime().meshService.getMesh(meshId);
    if (record) {
      // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] SHOW_LOADED_WORKSPACE_NAME
      // how: pass mesh name and baseline snapshot to WorkspaceView for header and diff
      loadedMeshName = record.mesh.name;
      const snapshot = parseWorkspaceSnapshotFromMesh(record.mesh);
      if (snapshot) {
        const { snapshot: limited, truncated } = applyMaxPanesLimit(
          snapshot,
          layout.maxPanes ?? 0,
        );
        if (truncated) {
          restoreWarning = `Restored first ${limited.panes.length} pane(s) due to maxPanes limit.`;
        }
        restoreWarning = appendSnapshotLayoutWarnings(
          limited,
          record.mesh.description ?? "",
          restoreWarning,
        );
        const bundle = await buildWorkspaceRestoreBundle(limited, listDirectoryForRequestPath);
        initialPanes.push(...bundle.initialPanes);
        if (bundle.restoreWarnings?.length) {
          const archiveWarn = bundle.restoreWarnings.join(" ");
          restoreWarning = restoreWarning
            ? `${restoreWarning} ${archiveWarn}`
            : archiveWarn;
        }
        restoreLayout = bundle.restoreLayout;
        restoreUi = bundle.restoreUi;
        restorePaneMeta = bundle.restorePaneMeta;
        restoredFromMesh = true;
        loadedSnapshot = bundle.snapshot;
      } else {
        restoreWarning =
          "Workspace snapshot could not be read from this mesh; pane layout may use defaults. Save the workspace again or open mesh detail to verify.";
      }
    } else {
      restoreWarning =
        "Mesh not found on server; workspace paths and layout may not restore. Ensure MESH_DATA_DIR is shared across processes or reload after saving.";
    }
  }

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_ON_FILES_PAGE
  // how: meshRestorePending when meshId present but server did not hydrate panes; defer default startup panes.
  const meshRestorePending = Boolean(meshId && !restoredFromMesh);

  // [IMPL-FILE_MANAGER_PAGE] [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how — SinglePaneWorkspaceUrl bootstrap one pane from ?panes=1&pane0=
  // [IMPL-WORKSPACE_VIEW] [REQ-README_DEMO_AUTOMATION]: how — ?pane0=&pane1=&pane2= bootstrap N panes regardless of layout.defaultPaneCount
  if (initialPanes.length === 0 && !meshRestorePending) {
    if (!meshId && panesQuery === "1" && pane0Query) {
      const panePath = pane0Query;
      const files = await listDirectoryForRequestPath(panePath);
      const sortedFiles = sortFilesData(files, "Name", true);
      const volumeStats = await getVolumeStats(volumeStatsSourcePath(panePath));
      initialPanes.push({
        path: panePath,
        files: sortedFiles,
        volumeStats,
      });
    } else if (!meshId && paneDeepLinkPaths.length > 0) {
      for (const panePath of paneDeepLinkPaths) {
        const files = await listDirectoryForRequestPath(panePath);
        const sortedFiles = sortFilesData(files, "Name", true);
        const volumeStats = await getVolumeStats(volumeStatsSourcePath(panePath));
        initialPanes.push({
          path: panePath,
          files: sortedFiles,
          volumeStats,
        });
      }
    } else {
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

        const files = await listDirectoryForRequestPath(panePath);
        const sortedFiles = sortFilesData(files, "Name", true);

        initialPanes.push({
          path: panePath,
          files: sortedFiles,
          volumeStats: await getVolumeStats(volumeStatsSourcePath(panePath)),
        });
      }
    }
  }

  // [IMPL-FILE_MANAGER_PAGE] [IMPL-PANE_VOLUME_CAPACITY] [ARCH-SERVER_CLIENT_BOUNDARY] [REQ-FILE_MANAGER_PAGE] [REQ-PANE_VOLUME_CAPACITY]: how — SSR_ATTACH_VOLUME_STATS ensures mesh-restored panes receive ephemeral capacity metadata before first paint
  await Promise.all(
    initialPanes.map(async (pane) => {
      if (!pane.volumeStats) {
        pane.volumeStats = await getVolumeStats(volumeStatsSourcePath(pane.path));
      }
    }),
  );

  // [REQ-REACT_SSR_STABILITY] [IMPL-FILE_AGE_DISPLAY]: single request clock for relative mtime SSR/hydration
  const ageReferenceMs = captureRequestAgeReferenceMs();

  return (
    // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: FILES_STARTUP_MESH_GATE — validate localStorage pref before WorkspaceView when no meshId in URL
    <FilesStartupMeshGate>
      <WorkspaceView
        key={meshId ?? "files-workspace"}
        meshId={meshId}
        ageReferenceMs={ageReferenceMs}
        initialPanes={initialPanes}
        keybindings={keybindings}
        copy={copy}
        layout={layout}
        columns={columns}
        toolbars={toolbars}
        fileTypes={fileTypes}
        restoreUi={restoreUi}
        restoreLayout={restoreLayout}
        restorePaneMeta={restorePaneMeta}
        restoredFromMesh={restoredFromMesh}
        restoreWarning={restoreWarning}
        loadedMeshName={loadedMeshName}
        loadedSnapshot={loadedSnapshot}
        meshRestorePending={meshRestorePending}
      />
    </FilesStartupMeshGate>
  );
}
