// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT] [REQ-REACT_SSR_STABILITY]: Top-level Workspace View Client Component with Stable React Keys: Client component with unique dialog keys, useMemo keybinding initialization, and API integration
// [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]
// [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
// [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
// Workspace client component managing multiple file panes with directory history and sorting
// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] Toolbar integration for visual operation access

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import path from "path-browserify";
import type { FileStat, OperationResult, ComparisonMode } from "@/lib/files.types";
import {
  swapArrayAt,
  rotateArray,
  reorderArrayByIndices,
  remapFocusIndexAfterSwap,
  remapFocusIndexAfterRotate,
  neighborIndexNext,
  neighborIndexPrev,
  type RotateDirection,
} from "@/lib/pane-order";
import { calculateLayout, normalizeLayoutType, type LayoutType } from "@/lib/files.layout";
import { buildEnhancedComparisonIndex } from "@/lib/files.comparison";
import { reconcilePaneSelection } from "@/lib/display-filter-engine";
import {
  applyCrossPaneVisibility,
  COMPARE_FILTER_CRITERION_IDS,
  compareFilterActionId,
  cycleTriState,
  copyCrossPaneVisibilityState,
  type CompareFilterCriterionId,
  type CrossPaneVisibilityState,
  type TriState,
} from "@/lib/cross-pane-visibility";
import {
  getCrossPaneVisibilityStore,
  CROSS_PANE_VISIBILITY_STORAGE_KEY,
  type CrossPaneVisibilityStore,
} from "@/lib/cross-pane-visibility-store";
import type { CrossPaneVisibilityPreset } from "@/lib/cross-pane-visibility.types";
import {
  initialPaneCrossPaneVisibilityFields,
  isCrossPaneVisibilityDraftDirty,
  loadPresetIntoPane,
  mergePaneListingWithCrossPaneFields,
  resolvePaneCrossPaneVisibility,
  snapshotPaneCrossPaneVisibilityFields,
  type PaneWithCrossPaneVisibility,
} from "@/lib/pane-cross-pane-visibility";
import { CompareFilterThresholdDialog } from "./components/CompareFilterThresholdDialog";
import { CrossPaneVisibilityManagerDialog } from "./components/CrossPaneVisibilityManagerDialog";
import { globalDirectoryHistory } from "@/lib/files.history";
import { globalBookmarkManager } from "@/lib/files.bookmarks";
import {
  sortFiles,
  describeFileComparison,
  DEFAULT_PANE_SORT,
  type PaneSortSettings,
  type SortCriterion,
  type SortDirection,
} from "@/lib/files.utils";
import { initializeKeybindingRegistry, matchKeybinding } from "@/lib/files.keybinds";
import type { KeybindingConfig, FilesCopyConfig, FilesLayoutConfig, ToolbarsConfig } from "@/lib/config.types";
import FilePane from "./components/FilePane";
import ConfirmDialog, { type FileConflict } from "./components/ConfirmDialog";
import ProgressDialog from "./components/ProgressDialog";
import GotoDialog from "./components/GotoDialog";
import BookmarkDialog from "./components/BookmarkDialog";
import SortDialog from "./components/SortDialog";
import { ColumnOrderDialog } from "./components/ColumnOrderDialog";
import { PaneOrderDialog } from "./components/PaneOrderDialog";
import { SetBaseDirectoryDialog } from "./components/SetBaseDirectoryDialog";
import { LayoutPickerPopover } from "./components/LayoutPickerPopover";
import {
  getVisibleFileColumns,
  measureFileMetadataColumnWidthsForPanes,
  normalizeFileColumns,
} from "@/lib/file-columns";
import RenameDialog from "./components/RenameDialog";
import { InfoPanel } from "./components/InfoPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { HelpOverlay } from "./components/HelpOverlay";
import { CommandPalette } from "./components/CommandPalette";
import { FinderDialog } from "./components/FinderDialog";
import { SearchDialog } from "./components/SearchDialog";
// [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] Toolbar components
import { WorkspaceToolbar } from "./components/WorkspaceToolbar";
import { PaneToolbar } from "./components/PaneToolbar";
import { SystemToolbar } from "./components/SystemToolbar";
import { Toolbar } from "./components/Toolbar";
import { ToolbarCompactToggle } from "./components/ToolbarCompactToggle";
import { mergeTopToolbarConfigs } from "@/lib/toolbar.utils";
import { useElementSize } from "@/lib/useElementSize";
import {
  SaveWorkspaceMeshDialog,
  type WorkspaceMeshSaveMode,
} from "./components/SaveWorkspaceMeshDialog";
import { WorkspaceDiffDialog } from "./components/WorkspaceDiffDialog";
import { NewTabLink } from "@/components/NewTabLink";
import { getDisplaySpecStore, type DisplaySpecStore } from "@/lib/display-spec-store";
import type { DisplayFilterSpec } from "@/lib/display-filter.types";
import {
  ensureDisplaySpecOnServer,
  syncDisplaySpecCatalogToServer,
} from "@/lib/display-spec-sync";
import {
  buildSinglePaneWorkspaceUrl,
  allowsLinkedPropagationForSetBaseTarget,
  resolveSetBaseDirectoryPaneTargets,
  resolveSetBaseDirectorySwapPair,
  type SetBaseDirectoryTarget,
} from "@/lib/set-base-directory";
import {
  buildPaneFromRawListing,
  fetchDirectoryListing,
  type PaneWithDisplayFilter,
} from "@/lib/pane-display-filter";
import { DisplaySpecManagerDialog } from "./components/DisplaySpecManagerDialog";
import {
  applyMaxPanesLimit,
  appendSnapshotLayoutWarnings,
  buildMeshCreatePayload,
  buildWorkspaceRestoreBundle,
  captureWorkspaceSnapshot,
  diffWorkspaceSnapshots,
  listDirectoryViaFilesApi,
  parseWorkspaceSnapshotFromMesh,
  type WorkspaceSnapshot,
} from "@/lib/workspace-mesh-bridge";

type PaneState = PaneWithCrossPaneVisibility;

// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] Pane initial state from server
interface PaneInitialState {
  path: string;
  files: FileStat[];
}

/** [IMPL-WORKSPACE_MESH_BRIDGE] Per-pane UI restored from mesh snapshot */
export type RestorePaneMeta = {
  sortBy: SortCriterion;
  sortDirection: SortDirection;
  sortDirsFirst: boolean;
  cursor: number;
  displaySpecId?: string | null;
  crossPaneVisibilityId?: string | null;
  crossPaneVisibility?: CrossPaneVisibilityState;
};

/** [IMPL-WORKSPACE_MESH_BRIDGE] Workspace-level UI restored from mesh */
export type RestoreUiState = {
  layout: LayoutType;
  focusIndex: number;
  linkedMode: boolean;
  comparisonMode: ComparisonMode;
  sharedSort?: PaneSortSettings;
};

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW — resolveInitialWorkspaceLayout init.
function resolveInitialWorkspaceLayout(
  restoredFromMesh: boolean,
  restoreLayout: LayoutType | undefined,
  restoreUi: RestoreUiState | undefined,
  layoutConfig: FilesLayoutConfig,
): LayoutType {
  const fromRestore =
    normalizeLayoutType(restoreLayout) ?? normalizeLayoutType(restoreUi?.layout);
  if (fromRestore) {
    return fromRestore;
  }
  if (restoredFromMesh) {
    return "Tile";
  }
  return normalizeLayoutType(layoutConfig.default) ?? "Tile";
}

interface WorkspaceViewProps {
  /** Initial panes from server */
  initialPanes: PaneInitialState[];
  /** Keybindings from server */
  keybindings: KeybindingConfig[];
  /** Copy configuration from server */
  copy: FilesCopyConfig;
  /** Layout configuration from server */
  layout: FilesLayoutConfig;
  /** Column configuration from server [IMPL-FILE_COLUMN_CONFIG] */
  columns: import("@/lib/config.types").FilesColumnConfig[];
  /** Toolbar configuration from server [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] */
  toolbars?: ToolbarsConfig;
  /** [REQ-WORKSPACE_MESH_BRIDGE] meshId from /files?meshId= (server + client layout rehydrate). */
  meshId?: string;
  /** [REQ-WORKSPACE_MESH_BRIDGE] Restored from /files?meshId= */
  restoreUi?: RestoreUiState;
  /** Canonical layout from mesh restore (avoids restoreUi object drop on RSC boundary). */
  restoreLayout?: LayoutType;
  restorePaneMeta?: RestorePaneMeta[];
  restoredFromMesh?: boolean;
  restoreWarning?: string | null;
  /** [REQ-WORKSPACE_MESH_BRIDGE] Mesh name when loaded via meshId */
  loadedMeshName?: string;
  /** [REQ-WORKSPACE_MESH_BRIDGE] Baseline snapshot for diff/update */
  loadedSnapshot?: WorkspaceSnapshot;
  /** [REQ-WORKSPACE_MESH_BRIDGE] Server missed mesh; client will rehydrate from /api/mesh */
  meshRestorePending?: boolean;
}

/**
 * WorkspaceView component - manages multiple file panes with keyboard navigation
 * [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-MULTI_PANE_LAYOUT] [REQ-KEYBOARD_NAVIGATION]
 * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
 * [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] Toolbar integration
 */
// [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_ON_FILES_PAGE — apply restorePaneMeta to pane state
function buildPaneStatesFromInitial(
  initialPanes: PaneInitialState[],
  restorePaneMeta?: RestorePaneMeta[],
  crossPaneStore?: CrossPaneVisibilityStore,
): PaneState[] {
  const cpvStore = crossPaneStore ?? getCrossPaneVisibilityStore();
  return initialPanes.map((pane, i) => {
    const meta = restorePaneMeta?.[i];
    const sortBy = meta?.sortBy ?? "name";
    const sortDirection = meta?.sortDirection ?? "asc";
    const sortDirsFirst = meta?.sortDirsFirst ?? true;
    const files = sortFiles([...pane.files], sortBy, sortDirection, sortDirsFirst);
    const cursor =
      meta?.cursor !== undefined
        ? Math.min(meta.cursor, Math.max(0, files.length - 1))
        : 0;
    const base: PaneWithDisplayFilter & {
      path: string;
      files: FileStat[];
      cursor: number;
      marks: Set<string>;
      sortBy: SortCriterion;
      sortDirection: SortDirection;
      sortDirsFirst: boolean;
    } = {
      path: pane.path,
      files,
      cursor,
      marks: new Set<string>(),
      sortBy,
      sortDirection,
      sortDirsFirst,
      activeDisplaySpecId: meta?.displaySpecId ?? null,
      loadedSpecVersion: null,
      hiddenCount: 0,
      rawFileCount: files.length,
    };
    const store = getDisplaySpecStore();
    const withFilter = buildPaneFromRawListing(files, base, store, { preserveMarks: true });
    return {
      ...withFilter,
      ...initialPaneCrossPaneVisibilityFields(
        {
          crossPaneVisibilityId: meta?.crossPaneVisibilityId,
          crossPaneVisibility: meta?.crossPaneVisibility,
        },
        cpvStore,
      ),
    };
  });
}

export default function WorkspaceView({
  initialPanes,
  keybindings,
  copy,
  layout: layoutConfig,
  columns,
  toolbars,
  meshId,
  restoreUi,
  restoreLayout,
  restorePaneMeta,
  restoredFromMesh = false,
  restoreWarning = null,
  loadedMeshName: loadedMeshNameProp,
  loadedSnapshot: loadedSnapshotProp,
  meshRestorePending = false,
}: WorkspaceViewProps) {
  const workspaceMeshCopy = copy.workspaceMesh;
  const router = useRouter();
  // [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: how: WorkspaceView useMemo calls initializeKeybindingRegistry once per keybindings prop before children render
  useMemo(() => {
    initializeKeybindingRegistry(keybindings);
  }, [keybindings]);
  
  // [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] Initialize panes from server data
  // State
  const [crossPaneVisibilityStore] = useState<CrossPaneVisibilityStore>(() =>
    getCrossPaneVisibilityStore(),
  );
  const [panes, setPanes] = useState<PaneState[]>(() =>
    buildPaneStatesFromInitial(initialPanes, restorePaneMeta, crossPaneVisibilityStore),
  );
  const [layout, setLayout] = useState<LayoutType>(() =>
    resolveInitialWorkspaceLayout(restoredFromMesh, restoreLayout, restoreUi, layoutConfig),
  );
  const meshRehydratedRef = useRef(false);
  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW
  // how: meshRehydrating true while client full rehydrate runs; suppress red error until recovery completes.
  const [meshRehydrating, setMeshRehydrating] = useState(meshRestorePending);
  const [clientRestoredFromMesh, setClientRestoredFromMesh] = useState(false);
  const [effectiveRestoreWarning, setEffectiveRestoreWarning] = useState<string | null>(
    restoreWarning ?? null,
  );
  useEffect(() => {
    setEffectiveRestoreWarning(restoreWarning ?? null);
  }, [restoreWarning]);
  const [focusIndex, setFocusIndex] = useState(() => restoreUi?.focusIndex ?? 0);
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Track scroll triggers for linked pane synchronization
  const [scrollTriggers, setScrollTriggers] = useState<Map<number, number>>(new Map());
  
  // [IMPL-DIR_HISTORY] [REQ-ADVANCED_NAV] Goto dialog state
  const [gotoDialog, setGotoDialog] = useState<{
    isOpen: boolean;
    path: string;
  }>({
    isOpen: false,
    path: "",
  });
  
  // [IMPL-DIR_HISTORY] [REQ-ADVANCED_NAV] Bookmark dialog state
  const [bookmarkDialog, setBookmarkDialog] = useState<{
    isOpen: boolean;
    mode: "list" | "add";
    currentPath: string;
  }>({
    isOpen: false,
    mode: "list",
    currentPath: "",
  });

  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [IMPL-MOUSE_SUPPORT] Rename dialog state
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    filePath: string;
    fileName: string;
    paneIndex: number;
  }>({
    isOpen: false,
    filePath: "",
    fileName: "",
    paneIndex: 0,
  });
  
  // [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL] Comparison mode state
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(
    () => restoreUi?.comparisonMode ?? "off",
  );

  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV] Linked navigation state
  const [linkedMode, setLinkedMode] = useState<boolean>(
    () => restoreUi?.linkedMode ?? layoutConfig.defaultLinkedMode ?? true,
  );

  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-WORKSPACE_MESH_BRIDGE] SharedSortWorkspace — workspace sharedSort state; restore from mesh snapshot v3
  const [sharedSort, setSharedSort] = useState<PaneSortSettings>(
    () => restoreUi?.sharedSort ?? { ...DEFAULT_PANE_SORT },
  );

  // [IMPL-WORKSPACE_VIEW] [IMPL-LAYOUT_CALCULATOR] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM] [REQ-KEYBOARD_NAVIGATION] [REQ-WORKSPACE_MESH_BRIDGE]: how: view.layout handler opens LayoutPickerPopover; option selects layout and closes; Escape or overlay closes without change; activeActions includes view.layout while open
  const [layoutPickerOpen, setLayoutPickerOpen] = useState(false);

  // [REQ-PANE_DISPLAY_FILTER] [IMPL-DISPLAY_SPEC_STORE] [IMPL-PANE_DISPLAY_FILTER_UI]
  const [displaySpecStore] = useState<DisplaySpecStore>(() => getDisplaySpecStore());
  // [REQ-REACT_SSR_STABILITY]: empty initial catalog; hydrate from localStorage after mount (SSR has no window)
  const [catalogSpecs, setCatalogSpecs] = useState<DisplayFilterSpec[]>([]);
  const [displaySpecManagerOpen, setDisplaySpecManagerOpen] = useState(false);
  const [recentSpecIds, setRecentSpecIds] = useState<string[]>([]);
  const [specDeletedNotice, setSpecDeletedNotice] = useState<string | null>(null);

  useEffect(() => {
    void syncDisplaySpecCatalogToServer(displaySpecStore);
  }, [displaySpecStore]);

  useEffect(() => {
    setCatalogSpecs(displaySpecStore.list());
    const unsub = displaySpecStore.subscribe((ev) => {
      setCatalogSpecs(displaySpecStore.list());
      void syncDisplaySpecCatalogToServer(displaySpecStore);
      if (ev.type === "deleted") {
        // [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: catalog delete event clears activeDisplaySpecId on affected panes and shows notice banner
        setPanes((prev) =>
          prev.map((p) =>
            p.activeDisplaySpecId === ev.specId
              ? { ...p, activeDisplaySpecId: null, hiddenCount: 0, loadedSpecVersion: null }
              : p,
          ),
        );
        setSpecDeletedNotice("A display spec was deleted; affected panes now use No filter.");
      }
    });
    const onStorage = (e: StorageEvent) => {
      if (e.key === "panorama.displaySpecs.v1") {
        displaySpecStore.load();
        setCatalogSpecs(displaySpecStore.list());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, [displaySpecStore]);

  // [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [IMPL-CROSS_PANE_VISIBILITY_UI]
  // [REQ-REACT_SSR_STABILITY]: empty initial presets; hydrate from localStorage after mount (SSR has no window)
  const [visibilityPresets, setVisibilityPresets] = useState<CrossPaneVisibilityPreset[]>([]);
  const [crossPaneVisibilityManagerOpen, setCrossPaneVisibilityManagerOpen] = useState(false);
  const [recentCrossPanePresetIds, setRecentCrossPanePresetIds] = useState<string[]>([]);
  const [compareFilterPresetDeletedNotice, setCompareFilterPresetDeletedNotice] = useState<
    string | null
  >(null);
  const [compareFilterThresholdOpen, setCompareFilterThresholdOpen] = useState(false);

  useEffect(() => {
    setVisibilityPresets(crossPaneVisibilityStore.list());
    const unsub = crossPaneVisibilityStore.subscribe((ev) => {
      setVisibilityPresets(crossPaneVisibilityStore.list());
      if (ev.type === "deleted") {
        setPanes((prev) =>
          prev.map((p) =>
            p.activeCrossPaneVisibilityId === ev.presetId
              ? { ...p, ...loadPresetIntoPane(p, null, crossPaneVisibilityStore) }
              : p,
          ),
        );
        setCompareFilterPresetDeletedNotice(
          "A compare filter preset was deleted; affected panes now use No compare filter.",
        );
      }
    });
    const onStorage = (e: StorageEvent) => {
      if (e.key === CROSS_PANE_VISIBILITY_STORAGE_KEY) {
        crossPaneVisibilityStore.load();
        setVisibilityPresets(crossPaneVisibilityStore.list());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, [crossPaneVisibilityStore]);

  // [REQ-TOOLBAR_SYSTEM] [REQ-MULTI_PANE_LAYOUT] [IMPL-TOOLBAR_COMPONENT] [IMPL-LAYOUT_CALCULATOR] [ARCH-TOOLBAR_LAYOUT] WORKSPACE_TOOLBAR_DISPLAY_MODE: session toolbarExpanded (not persisted); default compact
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  // [IMPL-LAYOUT_CALCULATOR] [IMPL-TOOLBAR_COMPONENT] WORKSPACE_AREA_MEASUREMENT: flex workspace-area ref for pane bounds
  const workspaceAreaRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useElementSize(workspaceAreaRef, [
    toolbarExpanded,
    toolbars?.enabled,
  ]);

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] STORE_FROM_WORKSPACE_UI / DIFF_SAVED_VS_CURRENT
  const [saveMeshDialogOpen, setSaveMeshDialogOpen] = useState(false);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [loadedMeshName, setLoadedMeshName] = useState<string | undefined>(loadedMeshNameProp);
  const [savedSnapshot, setSavedSnapshot] = useState<WorkspaceSnapshot | null>(
    loadedSnapshotProp ?? null,
  );
  
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Track if we're in a sync operation (prevent infinite recursion)
  const syncingRef = useRef<Set<number>>(new Set());
  /** Skip one loadedSnapshotProp sync after local update save (router.replace may deliver stale RSC props). */
  const skipPropBaselineSyncRef = useRef(false);
  
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] Sort dialog state
  const [sortDialog, setSortDialog] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  // [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER] Workspace file column order (mesh v4 + session)
  const [fileColumns, setFileColumns] = useState(() =>
    normalizeFileColumns(loadedSnapshotProp?.fileColumns, columns),
  );
  const [columnOrderDialogOpen, setColumnOrderDialogOpen] = useState(false);
  const [paneOrderDialogOpen, setPaneOrderDialogOpen] = useState(false);
  const [setBaseDirectoryDialog, setSetBaseDirectoryDialog] = useState<{
    isOpen: boolean;
    path: string;
    paneIndex: number;
  }>({ isOpen: false, path: "", paneIndex: 0 });
  
  // [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW] Preview panel state
  const [previewPanel, setPreviewPanel] = useState<{
    type: "info" | "preview" | null;
    filePath: string | null;
  }>({
    type: null,
    filePath: null,
  });
  
  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS] Help overlay state
  const [showHelp, setShowHelp] = useState(false);
  
  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS] Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH] Search dialog states
  const [showFinderDialog, setShowFinderDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  
  // [IMPL-BULK_OPS] [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS] Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    conflicts?: FileConflict[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  
  const [progressDialog, setProgressDialog] = useState<{
    isOpen: boolean;
    title: string;
    total: number;
    completed: number;
    currentFile: string;
    errors: Array<{ file: string; error: string }>;
    isComplete: boolean;
    result?: OperationResult;
  }>({
    isOpen: false,
    title: "",
    total: 0,
    completed: 0,
    currentFile: "",
    errors: [],
    isComplete: false,
  });
  
  // [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW — sync restoreLayout prop from server.
  useEffect(() => {
    const fromProp = normalizeLayoutType(restoreLayout);
    if (fromProp) {
      setLayout((prev) => (prev === fromProp ? prev : fromProp));
    }
  }, [restoreLayout]);

  // [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_ON_FILES_PAGE — sync restoreUi when server restored from mesh.
  useEffect(() => {
    if (!restoredFromMesh || !restoreUi) {
      return;
    }
    setFocusIndex(restoreUi.focusIndex);
    setLinkedMode(restoreUi.linkedMode);
    setComparisonMode(restoreUi.comparisonMode);
    if (restoreUi.sharedSort) {
      setSharedSort(restoreUi.sharedSort);
    }
  }, [restoredFromMesh, restoreUi]);

  useEffect(() => {
    setLoadedMeshName(loadedMeshNameProp);
  }, [loadedMeshNameProp]);

  useEffect(() => {
    if (loadedSnapshotProp) {
      if (skipPropBaselineSyncRef.current) {
        skipPropBaselineSyncRef.current = false;
        return;
      }
      setSavedSnapshot(loadedSnapshotProp);
    }
  }, [loadedSnapshotProp]);

  const captureCurrentSnapshot = useCallback((): WorkspaceSnapshot => {
    return captureWorkspaceSnapshot({
      layout,
      focusIndex,
      linkedMode,
      comparisonMode,
      sharedSort,
      fileColumns,
      panes: panes.map((p) => ({
        path: p.path,
        sortBy: p.sortBy,
        sortDirection: p.sortDirection,
        sortDirsFirst: p.sortDirsFirst,
        cursor: p.cursor,
        displaySpecId: p.activeDisplaySpecId,
        ...snapshotPaneCrossPaneVisibilityFields(p, crossPaneVisibilityStore),
      })),
    });
  }, [
    layout,
    focusIndex,
    linkedMode,
    comparisonMode,
    sharedSort,
    fileColumns,
    panes,
    crossPaneVisibilityStore,
  ]);

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] DIFF_SAVED_VS_CURRENT
  // how: diffWorkspaceSnapshots(savedSnapshot, current) drives header badge and WorkspaceDiffDialog rows
  const workspaceDiffChanges = useMemo(() => {
    if (!savedSnapshot) {
      return [];
    }
    return diffWorkspaceSnapshots(savedSnapshot, captureCurrentSnapshot());
  }, [savedSnapshot, captureCurrentSnapshot]);

  // [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW — client fetch /api/mesh/:meshId once (meshRehydratedRef).
  useEffect(() => {
    if (!meshId || meshRehydratedRef.current) {
      return;
    }
    meshRehydratedRef.current = true;

    void (async () => {
      const needsFullRestore = meshRestorePending;
      try {
        const res = await fetch(`/api/mesh/${meshId}`);
        if (!res.ok) {
          console.debug("DEBUG: mesh rehydrate fetch failed", res.status, meshId);
          if (needsFullRestore) {
            await bootstrapDefaultPanesFromApi();
          }
          setMeshRehydrating(false);
          return;
        }
        const data = (await res.json()) as {
          mesh?: {
            name?: string;
            description?: string;
            tags?: string[];
            depots?: { id?: string; name?: string; kind?: string; root?: string }[];
          };
        };
        const mesh = data.mesh;
        if (!mesh) {
          console.debug("DEBUG: mesh rehydrate missing mesh in response", meshId);
          if (needsFullRestore) {
            await bootstrapDefaultPanesFromApi();
          }
          setMeshRehydrating(false);
          return;
        }
        if (mesh.name) {
          setLoadedMeshName(mesh.name);
        }
        const parsed = parseWorkspaceSnapshotFromMesh({
          description: mesh.description,
          tags: mesh.tags ?? [],
          depots: (mesh.depots ?? []).map((d, i) => ({
            id: d.id ?? `d${i}`,
            name: d.name ?? `Pane ${i + 1}`,
            kind: (d.kind === "remote" || d.kind === "virtual" ? d.kind : "local") as
              | "local"
              | "remote"
              | "virtual",
            root: d.root ?? "",
            accessMode: "read_write" as const,
          })),
        });
        if (!parsed) {
          console.debug("DEBUG: mesh rehydrate no snapshot in mesh", meshId);
          if (needsFullRestore) {
            await bootstrapDefaultPanesFromApi();
          }
          setMeshRehydrating(false);
          return;
        }

        const { snapshot: limited, truncated } = applyMaxPanesLimit(
          parsed,
          layoutConfig.maxPanes ?? 0,
        );
        if (truncated) {
          console.debug(
            "DEBUG: mesh rehydrate truncated panes",
            limited.panes.length,
            meshId,
          );
        }
        // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] APPEND_SNAPSHOT_LAYOUT_WARNINGS
        const clientRestoreWarning = appendSnapshotLayoutWarnings(
          limited,
          mesh.description ?? "",
          restoreWarning ?? null,
        );

        if (needsFullRestore) {
          console.debug("DEBUG: mesh rehydrate applying full workspace snapshot", meshId);
          const bundle = await buildWorkspaceRestoreBundle(limited, listDirectoryViaFilesApi);
          setPanes(buildPaneStatesFromInitial(bundle.initialPanes, bundle.restorePaneMeta));
          setLayout(bundle.restoreLayout);
          setFocusIndex(bundle.restoreUi.focusIndex);
          setLinkedMode(bundle.restoreUi.linkedMode);
          setComparisonMode(bundle.restoreUi.comparisonMode);
          setSharedSort(bundle.restoreUi.sharedSort);
          setFileColumns(normalizeFileColumns(bundle.snapshot.fileColumns, columns));
          setSavedSnapshot(bundle.snapshot);
          setEffectiveRestoreWarning(clientRestoreWarning);
          setClientRestoredFromMesh(true);
        } else {
          setSavedSnapshot(limited);
          const normalized = normalizeLayoutType(limited.layout);
          if (!normalized) {
            console.debug("DEBUG: mesh rehydrate no layout in snapshot", meshId);
            setMeshRehydrating(false);
            return;
          }
          // how: skip client layout overwrite when server already passed restoreLayout (avoids clobbering user edits after async fetch)
          setFocusIndex(limited.focusIndex);
          setLinkedMode(limited.linkedMode);
          setComparisonMode(limited.comparisonMode);
          setSharedSort({ ...limited.sharedSort });
          if (restoreLayout || restoreUi?.layout) {
            console.debug(
              "DEBUG: mesh rehydrate skipped layout apply (server restoreLayout prop)",
              normalized,
              meshId,
            );
            setMeshRehydrating(false);
            return;
          }
          console.debug("DEBUG: mesh rehydrate applying layout only", normalized, meshId);
          setLayout((prev) => (prev === normalized ? prev : normalized));
          if (limited.fileColumns?.length) {
            setFileColumns(normalizeFileColumns(limited.fileColumns, columns));
          }
        }
        setMeshRehydrating(false);
      } catch (err) {
        console.debug("DEBUG: mesh rehydrate error", meshId, err);
        if (needsFullRestore) {
          try {
            await bootstrapDefaultPanesFromApi();
          } catch (bootstrapErr) {
            console.debug("DEBUG: mesh rehydrate default bootstrap failed", bootstrapErr);
          }
        }
        setMeshRehydrating(false);
      }
    })();

    // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] RESTORE_LAYOUT_IN_WORKSPACE_VIEW
    // how: when mesh fetch fails during meshRestorePending, bootstrap default pane count from GET /api/files home listing.
    async function bootstrapDefaultPanesFromApi() {
      const response = await fetch("/api/files");
      if (!response.ok) {
        throw new Error("Failed to list home directory");
      }
      const files = (await response.json()) as FileStat[];
      const homePath = files[0]?.path ? path.dirname(files[0].path) : "/";
      const paneCount = layoutConfig.defaultPaneCount || 1;
      const defaults: PaneInitialState[] = Array.from({ length: paneCount }, () => ({
        path: homePath,
        files: [...files],
      }));
      setPanes(buildPaneStatesFromInitial(defaults));
    }
  }, [
    meshId,
    meshRestorePending,
    restoreWarning,
    restoreLayout,
    restoreUi?.layout,
    layoutConfig.defaultPaneCount,
    layoutConfig.maxPanes,
    columns,
  ]);

  // [IMPL-WORKSPACE_VIEW] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] [REQ-README_DEMO_AUTOMATION]: how: PANE_URL_DEEP_LINK_INIT — pane0..paneN query params navigate panes on mount for E2E and bookmarkable workspaces; skip when mesh restore active
  // Query params: ?pane0=/path/to/dir&pane1=/another/path&pane2=/third/path
  useEffect(() => {
    if (restoredFromMesh || clientRestoredFromMesh || meshRehydrating) {
      return;
    }
    const searchParams = new URLSearchParams(window.location.search);
    const panePathsFromUrl: string[] = [];
    
    // Collect pane paths from query parameters
    for (let i = 0; i < panes.length; i++) {
      const panePath = searchParams.get(`pane${i}`);
      if (panePath) {
        panePathsFromUrl.push(panePath);
      }
    }
    
    // Navigate panes to URL-specified paths
    if (panePathsFromUrl.length > 0) {
      panePathsFromUrl.forEach((panePath, index) => {
        // Small delay to avoid overwhelming the server
        setTimeout(() => {
          handleNavigate(index, panePath);
        }, index * 100);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoredFromMesh, clientRestoredFromMesh, meshRehydrating]); // Run only once on mount
  
  // [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]: measured workspace-area dimensions → calculateLayout
  const bounds = calculateLayout(
    containerWidth,
    containerHeight,
    panes.length,
    layout
  );

  // [IMPL-FILE_COLUMN_CONFIG] [REQ-MULTI_PANE_LAYOUT] OneColumn: shared Size/Time ch across stacked panes
  const sharedMetadataColumnWidths = useMemo(() => {
    if (layout !== "OneColumn") return undefined;
    return measureFileMetadataColumnWidthsForPanes(
      panes.map((p) => p.files),
      getVisibleFileColumns(fileColumns),
    );
  }, [layout, panes, fileColumns]);

  // [IMPL-COMPARISON_INDEX] [REQ-CROSS_PANE_VISIBILITY] BUILD_INDEX_FOR_FILTERS — index for compare filters whenever 2+ panes
  const comparisonIndexForFilters = useMemo(() => {
    if (panes.length < 2) {
      return new Map();
    }
    return buildEnhancedComparisonIndex(panes.map((p) => p.files));
  }, [panes]);

  const focusedPane = panes[focusIndex];

  // [IMPL-CROSS_PANE_VISIBILITY_UI] SYNC_TOOLBAR_TO_FOCUS — resolved draft for focused pane
  const focusedVisibilityState = useMemo(
    () =>
      focusedPane
        ? resolvePaneCrossPaneVisibility(focusedPane)
        : copyCrossPaneVisibilityState({ toggles: {}, sizeThreshold: null, timeThreshold: null }),
    [focusedPane],
  );

  const updateFocusedPaneCrossPaneDraft = useCallback(
    (updater: (prev: CrossPaneVisibilityState) => CrossPaneVisibilityState) => {
      setPanes((prev) => {
        const pane = prev[focusIndex];
        if (!pane) return prev;
        const nextDraft = updater(pane.crossPaneVisibilityDraft);
        const updated = [...prev];
        updated[focusIndex] = { ...pane, crossPaneVisibilityDraft: nextDraft };
        return updated;
      });
    },
    [focusIndex],
  );

  const pushRecentCrossPanePreset = useCallback((presetId: string) => {
    setRecentCrossPanePresetIds((prev) => {
      const next = [presetId, ...prev.filter((id) => id !== presetId)];
      return next.slice(0, 5);
    });
  }, []);

  const countPanesUsingCrossPanePreset = useCallback(
    (presetId: string) =>
      panes.filter((p) => p.activeCrossPaneVisibilityId === presetId).length,
    [panes],
  );

  const handleSetActiveCrossPaneVisibility = useCallback(
    (paneIndex: number, presetId: string | null) => {
      if (presetId) {
        pushRecentCrossPanePreset(presetId);
      }
      setPanes((prev) => {
        const updated = [...prev];
        const pane = updated[paneIndex];
        if (!pane) return prev;
        updated[paneIndex] = {
          ...pane,
          ...loadPresetIntoPane(pane, presetId, crossPaneVisibilityStore),
        };
        return updated;
      });
    },
    [crossPaneVisibilityStore, pushRecentCrossPanePreset],
  );

  // [IMPL-CROSS_PANE_VISIBILITY_ENGINE] APPLY cross-pane visibility on listings (after display spec)
  const crossPaneVisibilityResult = useMemo(
    () =>
      applyCrossPaneVisibility(
        panes.map((p) => p.files),
        focusIndex,
        comparisonIndexForFilters,
        focusedVisibilityState,
      ),
    [panes, focusIndex, comparisonIndexForFilters, focusedVisibilityState],
  );

  // [IMPL-CROSS_PANE_VISIBILITY_ENGINE] RECONCILE_AFTER_VISIBILITY
  useEffect(() => {
    const displayFiles = crossPaneVisibilityResult.displayFilesByPane[focusIndex];
    if (!displayFiles) return;
    setPanes((prev) => {
      const pane = prev[focusIndex];
      if (!pane) return prev;
      const reconciled = reconcilePaneSelection({
        ...pane,
        files: displayFiles,
      });
      const marksEqual =
        reconciled.marks.size === pane.marks.size &&
        [...reconciled.marks].every((name) => pane.marks.has(name));
      if (marksEqual && reconciled.cursor === pane.cursor) {
        return prev;
      }
      const updated = [...prev];
      updated[focusIndex] = {
        ...pane,
        marks: reconciled.marks,
        cursor: reconciled.cursor,
      };
      return updated;
    });
  }, [crossPaneVisibilityResult, focusIndex]);

  // [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]
  const enhancedComparisonIndex = useMemo(() => {
    if (comparisonMode === "off" || panes.length < 2) {
      return new Map();
    }
    return comparisonIndexForFilters;
  }, [comparisonMode, panes.length, comparisonIndexForFilters]);

  const pushRecentSpec = useCallback((specId: string | null) => {
    if (!specId) return;
    setRecentSpecIds((prev) => [specId, ...prev.filter((id) => id !== specId)].slice(0, 5));
  }, []);

  const countPanesUsingSpec = useCallback(
    (specId: string) => panes.filter((p) => p.activeDisplaySpecId === specId).length,
    [panes],
  );

  /** [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]: how: on spec version change while manager open, re-list every pane with matching activeDisplaySpecId preserving marks */
  const refreshPanesUsingSpec = useCallback(
    async (specId: string) => {
      const indices = panes
        .map((p, i) => (p.activeDisplaySpecId === specId ? i : -1))
        .filter((i) => i >= 0);
      for (const idx of indices) {
        const pane = panes[idx];
        try {
          await ensureDisplaySpecOnServer(displaySpecStore.get(specId));
          const listing = await fetchDirectoryListing(pane.path, pane.activeDisplaySpecId);
          setPanes((prev) => {
            const updated = [...prev];
            const restored = globalDirectoryHistory.restoreCursorPosition(
              idx,
              pane.path,
              listing.files.map((f) => f.name),
            );
            const built = buildPaneFromRawListing(
              listing.files,
              { ...updated[idx] },
              displaySpecStore,
              {
                preserveMarks: true,
                serverPreFiltered: listing.serverPreFiltered,
                hiddenCount: listing.hiddenCount,
                totalCount: listing.totalCount,
              },
            );
            updated[idx] = mergePaneListingWithCrossPaneFields(built, updated[idx]);
            updated[idx].cursor = restored.cursor;
            return updated;
          });
        } catch (err) {
          console.error("DEBUG: refreshPanesUsingSpec failed", err);
        }
      }
    },
    [panes, displaySpecStore],
  );

  /** [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: user selects no filter or catalog spec; sync spec to server; refetch listing and buildPaneFromRawListing with preserveMarks false */
  const handleSetActiveDisplaySpec = useCallback(
    async (paneIndex: number, specId: string | null) => {
      if (specId && !displaySpecStore.get(specId)) {
        setSpecDeletedNotice("Display spec is no longer available; using No filter.");
        specId = null;
      }
      pushRecentSpec(specId);
      setPanes((prev) => {
        const updated = [...prev];
        updated[paneIndex] = {
          ...updated[paneIndex],
          activeDisplaySpecId: specId,
        };
        return updated;
      });
      const pane = panes[paneIndex];
      if (specId) {
        await ensureDisplaySpecOnServer(displaySpecStore.get(specId));
      }
      const listing = await fetchDirectoryListing(pane.path, specId);
      setPanes((prev) => {
        const updated = [...prev];
        const built = buildPaneFromRawListing(
          listing.files,
          { ...updated[paneIndex], activeDisplaySpecId: specId },
          displaySpecStore,
          {
            preserveMarks: false,
            serverPreFiltered: listing.serverPreFiltered,
            hiddenCount: listing.hiddenCount,
            totalCount: listing.totalCount,
          },
        );
        updated[paneIndex] = mergePaneListingWithCrossPaneFields(built, updated[paneIndex]);
        return updated;
      });
    },
    [panes, displaySpecStore, pushRecentSpec],
  );

  useEffect(() => {
    if (!displaySpecManagerOpen) return;
    const unsub = displaySpecStore.subscribe((ev) => {
      if (ev.type === "updated") {
        void refreshPanesUsingSpec(ev.spec.id);
      }
    });
    return unsub;
  }, [displaySpecManagerOpen, displaySpecStore, refreshPanesUsingSpec]);
  
  // Handle navigation into directory
  // [IMPL-DIR_HISTORY] [ARCH-DIRECTORY_HISTORY] [REQ-ADVANCED_NAV]
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
  const handleNavigate = useCallback(async (paneIndex: number, newPath: string) => {
    // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Check if this pane is currently syncing
    const isInitiatingNavigation = !syncingRef.current.has(paneIndex);
    
    try {
      const pane = panes[paneIndex];
      // [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION]: how: guard invalid paneIndex during async navigate
      if (!pane) return;
      
      // [IMPL-CURSOR_BOUNDS_CHECK] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how: add cursor >= 0 to guard before saveCursorPosition and pane.files[cursor] read
      if (pane.files.length > 0 && pane.cursor >= 0 && pane.cursor < pane.files.length) {
        const currentFile = pane.files[pane.cursor];
        globalDirectoryHistory.saveCursorPosition(
          paneIndex,
          pane.path,
          currentFile.name,
          pane.cursor,
          0 // scrollTop - would need ref to get actual scroll position
        );
      }
      
      // [IMPL-DISPLAY_FILTER_API] [REQ-PANE_DISPLAY_FILTER] Fetch listing (filtered when spec active)
      if (pane.activeDisplaySpecId) {
        await ensureDisplaySpecOnServer(displaySpecStore.get(pane.activeDisplaySpecId));
      }
      const listing = await fetchDirectoryListing(newPath, pane.activeDisplaySpecId);
      
      const restored = globalDirectoryHistory.restoreCursorPosition(
        paneIndex,
        newPath,
        listing.files.map((f) => f.name),
      );
      
      setPanes((prev) => {
        const updated = [...prev];
        const built = buildPaneFromRawListing(
          listing.files,
          {
            ...updated[paneIndex],
            path: newPath,
            sortBy: pane.sortBy,
            sortDirection: pane.sortDirection,
            sortDirsFirst: pane.sortDirsFirst,
          },
          displaySpecStore,
          {
            preserveMarks: false,
            serverPreFiltered: listing.serverPreFiltered,
            hiddenCount: listing.hiddenCount,
            totalCount: listing.totalCount,
          },
        );
        updated[paneIndex] = {
          ...mergePaneListingWithCrossPaneFields(built, updated[paneIndex]),
          cursor: restored.cursor,
        };
        return updated;
      });
      
      // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
      // Synchronize linked panes (only on initiating navigation)
      if (isInitiatingNavigation && linkedMode && panes.length > 1) {
        const oldPath = pane.path;
        
        // Determine if this is a downward or upward navigation
        // [IMPL-LINKED_NAV] When at root, oldPath+'/' is "//" so newPath.startsWith("//") is false for e.g. /Users; treat from-root-to-subdir as downward
        const normalizedOld = (oldPath === '' ? '/' : oldPath);
        const isDownward = newPath.startsWith(oldPath + '/') ||
          (normalizedOld === '/' && newPath.startsWith('/') && newPath.length > 1);
        // [IMPL-LINKED_NAV] Treat "navigate to root" as upward: newPath+'/' is "//" so oldPath.startsWith("//") is false for e.g. /Users
        const normalizedNew = (newPath === '' ? '/' : newPath);
        const isUpward = normalizedNew === '/'
          ? (oldPath !== '/' && oldPath.length > 1)
          : oldPath.startsWith(normalizedNew + '/');
        
        if (isDownward) {
          // Navigating into subdirectory
          // [IMPL-LINKED_NAV] When at root, oldPath.length+1 is 2 so slice(2) drops "/p"; strip only leading slash.
          const relativePath = normalizedOld === '/' ? newPath.slice(1) : newPath.slice(oldPath.length + 1);
          
          // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Track success for auto-disable
          let successCount = 1; // Source pane always succeeds
          let failureCount = 0;
          
          // Navigate other panes to matching subdirectory
          for (let i = 0; i < panes.length; i++) {
            if (i === paneIndex) continue; // Skip source pane
            
            syncingRef.current.add(i); // Mark this pane as syncing
            
            const linkedPane = panes[i];
            const linkedTargetPath = `${linkedPane.path}/${relativePath}`.replace(/\/+/g, '/');
            
            // Check if target directory exists in linked pane
            try {
              const checkResponse = await fetch(`/api/files?path=${encodeURIComponent(linkedTargetPath)}`);
              if (checkResponse.ok) {
                const checkData: FileStat[] = await checkResponse.json();
                // Verify it's a directory (API returns files if it's a directory)
                if (Array.isArray(checkData)) {
                  await handleNavigate(i, linkedTargetPath);
                  successCount++;
                } else {
                  failureCount++;
                }
              } else {
                console.warn(`[IMPL-LINKED_NAV] Target directory not found in pane ${i}: ${linkedTargetPath}`);
                failureCount++;
              }
            } catch (error) {
              console.warn(`[IMPL-LINKED_NAV] Failed to check/navigate linked pane ${i}:`, error);
              failureCount++;
            } finally {
              syncingRef.current.delete(i); // Clear syncing flag
            }
          }
          
          // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Auto-disable if partial navigation failure
          if (successCount > 0 && failureCount > 0) {
            setLinkedMode(false);
            console.warn("[IMPL-LINKED_NAV] Linked navigation disabled - directory structures diverged");
          }
        } else if (isUpward) {
          // Navigating to parent directory
          const stepsUp = oldPath.split('/').filter(Boolean).length - newPath.split('/').filter(Boolean).length;
          
          // Navigate other panes up by same number of levels
          for (let i = 0; i < panes.length; i++) {
            if (i === paneIndex) continue;
            
            syncingRef.current.add(i); // Mark this pane as syncing
            
            const linkedPane = panes[i];
            let linkedTargetPath = linkedPane.path;
            
            // Go up stepsUp levels
            for (let step = 0; step < stepsUp; step++) {
              const parts = linkedTargetPath.split('/').filter(Boolean);
              if (parts.length > 0) {
                parts.pop();
                linkedTargetPath = '/' + parts.join('/');
              } else {
                linkedTargetPath = '/';
                break;
              }
            }
            
            try {
              const checkResponse = await fetch(`/api/files?path=${encodeURIComponent(linkedTargetPath)}`);
              if (checkResponse.ok) {
                await handleNavigate(i, linkedTargetPath);
              } else {
                console.warn(`[IMPL-LINKED_NAV] Target parent not found in pane ${i}: ${linkedTargetPath}`);
              }
            } catch (error) {
              console.warn(`[IMPL-LINKED_NAV] Failed to navigate linked pane ${i} to parent:`, error);
            } finally {
              syncingRef.current.delete(i); // Clear syncing flag
            }
          }
        }
      }
    } catch (error) {
      console.error("Error navigating:", error);
    }
  }, [panes, linkedMode, displaySpecStore]);

  
  // [IMPL-LINKED_NAV] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-KEYBIND_SYSTEM] [ARCH-LINKED_NAV] [ARCH-SORT_PIPELINE] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES] [REQ-MULTI_PANE_LAYOUT]: sync cursor to same filename in all panes when linkedMode ON
  const handleCursorMove = useCallback((paneIndex: number, newCursor: number) => {
    setPanes((prev) => {
      const updated = [...prev];
      const pane = updated[paneIndex];
      const visibleFiles =
        crossPaneVisibilityResult.displayFilesByPane[paneIndex] ?? pane.files;
      const clampedCursor = Math.max(
        0,
        Math.min(newCursor, Math.max(0, visibleFiles.length - 1)),
      );

      updated[paneIndex] = {
        ...pane,
        cursor: clampedCursor,
      };

      // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Sync cursor to same filename in all panes when linked
      if (linkedMode && panes.length > 1 && clampedCursor < visibleFiles.length) {
        const cursorFilename = visibleFiles[clampedCursor].name;

        const triggers = new Map<number, number>();

        for (let i = 0; i < updated.length; i++) {
          if (i === paneIndex) continue;

          const linkedPane = updated[i];
          const linkedVisible =
            crossPaneVisibilityResult.displayFilesByPane[i] ?? linkedPane.files;
          const matchIndex = linkedVisible.findIndex((f) => f.name === cursorFilename);
          
          if (matchIndex !== -1) {
            // Found matching file, update cursor
            updated[i] = {
              ...linkedPane,
              cursor: matchIndex,
            };
            // Track this pane for scrolling
            triggers.set(i, matchIndex);
          } else {
            // File doesn't exist in this pane, clear selection
            updated[i] = {
              ...linkedPane,
              cursor: -1,
            };
            // No scroll trigger for cleared selection
          }
        }
        
        // Trigger scroll effects in other panes (after state update)
        setScrollTriggers(triggers);
      }
      
      return updated;
    });
  }, [linkedMode, panes.length, crossPaneVisibilityResult]);
  
  // [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: m key and checkbox call handleToggleMark without cursor move
  const handleToggleMark = useCallback((paneIndex: number, filename: string) => {
    setPanes((prev) => {
      const updated = [...prev];
      const marks = new Set(updated[paneIndex].marks);
      
      if (marks.has(filename)) {
        marks.delete(filename);
      } else {
        marks.add(filename);
      }
      
      updated[paneIndex] = {
        ...updated[paneIndex],
        marks,
      };
      return updated;
    });
  }, []);
  
  // [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-PANE_DISPLAY_FILTER]: how: Shift+M mark.all sets marks to all names in displayFilesByPane when filter active
  const handleMarkAll = useCallback((paneIndex: number) => {
    setPanes((prev) => {
      const updated = [...prev];
      const visible =
        crossPaneVisibilityResult.displayFilesByPane[paneIndex] ??
        updated[paneIndex].files;
      const marks = new Set(visible.map((f) => f.name));

      updated[paneIndex] = {
        ...updated[paneIndex],
        marks,
      };
      return updated;
    });
  }, [crossPaneVisibilityResult]);
  
  // [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-PANE_DISPLAY_FILTER]: how: Ctrl+M mark.invert symmetric difference over visible file names only
  const handleInvertMarks = useCallback((paneIndex: number) => {
    setPanes((prev) => {
      const updated = [...prev];
      const pane = updated[paneIndex];
      const visible =
        crossPaneVisibilityResult.displayFilesByPane[paneIndex] ?? pane.files;
      const marks = new Set<string>();

      for (const file of visible) {
        if (!pane.marks.has(file.name)) {
          marks.add(file.name);
        }
      }

      updated[paneIndex] = {
        ...updated[paneIndex],
        marks,
      };
      return updated;
    });
  }, [crossPaneVisibilityResult]);
  
  // [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: remove all marks on Escape via handleClearMarks
  const handleClearMarks = useCallback((paneIndex: number) => {
    setPanes((prev) => {
      const updated = [...prev];
      updated[paneIndex] = {
        ...updated[paneIndex],
        marks: new Set<string>(),
      };
      return updated;
    });
  }, []);
  
  // [REQ-FILE_SEARCH] [IMPL-FILE_SEARCH] Handle file selection from FinderDialog
  const handleFinderSelect = useCallback((file: FileStat) => {
    if (file.isDirectory) {
      // Navigate into directory
      handleNavigate(focusIndex, file.path);
    } else {
      // Move cursor to file
      const pane = panes[focusIndex];
      const fileIndex = pane.files.findIndex(f => f.name === file.name);
      if (fileIndex !== -1) {
        handleCursorMove(focusIndex, fileIndex);
      }
    }
  }, [focusIndex, panes, handleNavigate, handleCursorMove]);
  
  // [REQ-FILE_SEARCH] Handle result selection from SearchDialog
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSearchResultSelect = useCallback((filePath: string, _line: number) => {
    // For now, just show in info panel
    // Future: Could open file in editor or preview with line highlighted
    setPreviewPanel({
      type: "preview",
      filePath: filePath,
    });
  }, []);
  
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-LINKED_PANES]: handleSortChange updates one or all panes, re-sorts listing, preserves cursor by matching filename after sort
  const handleSortChange = (
    criterion: SortCriterion,
    direction: SortDirection,
    dirsFirst: boolean,
    options?: { singlePaneOnly?: boolean },
  ) => {
    setPanes((prev) => {
      const updated = [...prev];
      
      // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Apply sort to all panes if linked (unless Shared → single pane)
      const panesToUpdate =
        options?.singlePaneOnly || !(linkedMode && panes.length > 1)
          ? [focusIndex]
          : updated.map((_, idx) => idx);
      
      for (const paneIdx of panesToUpdate) {
        const pane = updated[paneIdx];
        
        // Remember current file for cursor preservation
        const currentFilename = pane.files[pane.cursor]?.name;
        
        // Sort files with new settings
        const sortedFiles = sortFiles(pane.files, criterion, direction, dirsFirst);
        
        // Find cursor position on same file
        const newCursor = currentFilename
          ? sortedFiles.findIndex((f) => f.name === currentFilename)
          : 0;
        
        updated[paneIdx] = {
          ...pane,
          files: sortedFiles,
          cursor: newCursor >= 0 ? newCursor : 0,
          sortBy: criterion,
          sortDirection: direction,
          sortDirsFirst: dirsFirst,
        };
      }
      
      return updated;
    });
  };
  
  // [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] Pane management handlers
  
  /**
   * Add a new pane to the workspace
   * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE]: how: clone focused pane path and listing into new pane when under maxPanes and management allowed
   */
  const handleAddPane = useCallback(async () => {
    // Check if pane management is allowed
    if (!layoutConfig.allowPaneManagement) {
      console.warn("Pane management is disabled in configuration");
      return;
    }
    
    // Check if we've reached the maximum number of panes (0 = no limit)
    const maxPanes = layoutConfig.maxPanes ?? 0;
    if (maxPanes > 0 && panes.length >= maxPanes) {
      console.warn(`Cannot add pane: maximum of ${maxPanes} panes reached`);
      return;
    }
    
    // [IMPL-PANE_MANAGEMENT] [IMPL-SORT_FILTER] [REQ-MULTI_PANE_LAYOUT] [REQ-FILE_SORTING_ADVANCED] Add pane — clone path from focus; sort from workspace sharedSort
    const sourcePane = panes[focusIndex];
    
    try {
      if (sourcePane.activeDisplaySpecId) {
        await ensureDisplaySpecOnServer(displaySpecStore.get(sourcePane.activeDisplaySpecId));
      }
      const listing = await fetchDirectoryListing(
        sourcePane.path,
        sourcePane.activeDisplaySpecId,
      );
      const built = buildPaneFromRawListing(
        listing.files,
        {
          path: sourcePane.path,
          files: listing.files,
          cursor: 0,
          marks: new Set<string>(),
          sortBy: sharedSort.sortBy,
          sortDirection: sharedSort.sortDirection,
          sortDirsFirst: sharedSort.sortDirsFirst,
          activeDisplaySpecId: sourcePane.activeDisplaySpecId,
          loadedSpecVersion: null,
          hiddenCount: 0,
          rawFileCount: listing.totalCount,
        },
        displaySpecStore,
        {
          preserveMarks: false,
          serverPreFiltered: listing.serverPreFiltered,
          hiddenCount: listing.hiddenCount,
          totalCount: listing.totalCount,
        },
      );
      const newPane = mergePaneListingWithCrossPaneFields(built, {
        activeCrossPaneVisibilityId: sourcePane.activeCrossPaneVisibilityId,
        crossPaneVisibilityDraft: copyCrossPaneVisibilityState(
          sourcePane.crossPaneVisibilityDraft,
        ),
        crossPaneVisibilityDraftSourceVersion:
          sourcePane.crossPaneVisibilityDraftSourceVersion,
      });
      setPanes((prev) => [...prev, newPane]);
      setFocusIndex(panes.length);
    } catch (error) {
      console.error("Failed to add pane:", error);
    }
  }, [panes, focusIndex, layoutConfig, displaySpecStore, sharedSort]);
  
  /**
   * Remove a pane from the workspace
   * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT] [REQ-FILES_CONFIG_COMPLETE]: how: splice pane at index and remap focusIndex when removed pane was focused or before focus
   */
  const handleRemovePane = useCallback((paneIndex: number) => {
    // Check if pane management is allowed
    if (!layoutConfig.allowPaneManagement) {
      console.warn("Pane management is disabled in configuration");
      return;
    }
    
    // Cannot remove if only one pane left
    if (panes.length <= 1) {
      console.warn("Cannot remove pane: at least one pane must remain");
      return;
    }
    
    // Remove the pane
    setPanes((prev) => {
      const updated = [...prev];
      updated.splice(paneIndex, 1);
      return updated;
    });
    
    // Adjust focus index if necessary
    setFocusIndex((prev) => {
      if (paneIndex < prev) {
        // Removed pane before focused pane, shift focus left
        return prev - 1;
      } else if (paneIndex === prev) {
        // Removed the focused pane, focus previous or first
        return Math.max(0, prev - 1);
      }
      // Removed pane after focused pane, no change needed
      return prev;
    });
  }, [panes, layoutConfig]);

  /**
   * Swap two panes by index; focus and directory history follow pane content.
   * [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]: how: swap panes[i] and panes[j]; remap focusIndex; permute directory history; clear scrollTriggers
   */
  const handleSwapPanes = useCallback(
    (i: number, j: number) => {
      if (!layoutConfig.allowPaneManagement || panes.length < 2 || i === j) {
        return;
      }
      setPanes((prev) => swapArrayAt(prev, i, j));
      setFocusIndex((prev) => remapFocusIndexAfterSwap(prev, i, j));
      globalDirectoryHistory.swapPaneHistories(i, j);
      setScrollTriggers(new Map());
    },
    [panes.length, layoutConfig.allowPaneManagement],
  );

  // [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: pane.swap / pane.swapPrev — two panes swap 0↔1; else swap focus with wrapped next/prev neighbor
  const handleSwapFocusedNext = useCallback(() => {
    if (panes.length === 2) {
      handleSwapPanes(0, 1);
      return;
    }
    const j = neighborIndexNext(focusIndex, panes.length);
    handleSwapPanes(focusIndex, j);
  }, [panes.length, focusIndex, handleSwapPanes]);

  // [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: pane.swap / pane.swapPrev — two panes swap 0↔1; else swap focus with wrapped next/prev neighbor
  const handleSwapFocusedPrev = useCallback(() => {
    if (panes.length === 2) {
      handleSwapPanes(0, 1);
      return;
    }
    const j = neighborIndexPrev(focusIndex, panes.length);
    handleSwapPanes(focusIndex, j);
  }, [panes.length, focusIndex, handleSwapPanes]);

  /**
   * Rotate all panes one slot; focus and history follow pane content.
   * [IMPL-PANE_MANAGEMENT] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: rotate all panes one slot forward or backward; remap focus and directory history
   */
  const handleCyclePanes = useCallback(
    (direction: RotateDirection) => {
      if (!layoutConfig.allowPaneManagement || panes.length < 2) {
        return;
      }
      setPanes((prev) => rotateArray(prev, direction));
      setFocusIndex((prev) =>
        remapFocusIndexAfterRotate(prev, panes.length, direction),
      );
      globalDirectoryHistory.rotatePaneHistories(direction, panes.length);
      setScrollTriggers(new Map());
    },
    [panes.length, layoutConfig.allowPaneManagement],
  );

  /**
   * Apply arbitrary pane order from PaneOrderDialog.
   * [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: Apply reorders panes[] by index permutation from dialog; focus follows previous focus pane content
   */
  const handleApplyPaneOrder = useCallback(
    (order: number[]) => {
      if (!layoutConfig.allowPaneManagement || order.length !== panes.length) {
        return;
      }
      const previousFocusPaneIndex = focusIndex;
      setPanes((prev) => reorderArrayByIndices(prev, order));
      setFocusIndex(order.indexOf(previousFocusPaneIndex));
      globalDirectoryHistory.reorderPaneHistories(order);
      setScrollTriggers(new Map());
    },
    [panes.length, focusIndex, layoutConfig.allowPaneManagement],
  );

  // [IMPL-WORKSPACE_VIEW] [IMPL-PANE_MANAGEMENT] [IMPL-LINKED_NAV] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]: how — SetBaseDirectoryApply routes through handleNavigate; linked propagation only for thisPane; swap variants compose handleSwapPanes
  const handleApplySetBaseDirectory = useCallback(
    async (target: SetBaseDirectoryTarget) => {
      const { path: directoryPath, paneIndex: initiatingPaneIndex } =
        setBaseDirectoryDialog;

      if (target === "newWorkspace") {
        window.open(
          buildSinglePaneWorkspaceUrl(directoryPath),
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }

      const paneTargets = resolveSetBaseDirectoryPaneTargets(
        target,
        initiatingPaneIndex,
        panes.length,
      );
      const allowLinked = allowsLinkedPropagationForSetBaseTarget(target);

      // NavigateAbsoluteBase — [IMPL-WORKSPACE_VIEW] [IMPL-LINKED_NAV] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES]: how — syncingRef suppresses linked relative sync for multi-target base assignment
      for (const idx of paneTargets) {
        if (allowLinked) {
          await handleNavigate(idx, directoryPath);
        } else {
          syncingRef.current.add(idx);
          try {
            await handleNavigate(idx, directoryPath);
          } finally {
            syncingRef.current.delete(idx);
          }
        }
      }

      const swapPair = resolveSetBaseDirectorySwapPair(
        target,
        initiatingPaneIndex,
        panes.length,
      );
      if (swapPair) {
        handleSwapPanes(swapPair[0], swapPair[1]);
      }
    },
    [
      setBaseDirectoryDialog,
      panes.length,
      handleNavigate,
      handleSwapPanes,
    ],
  );
  
  // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS] Bulk operation handlers
  
  /**
   * Get files to operate on: marked files if any, otherwise cursor file
   */
  const displaySpecPayload = useCallback(
    (paneIndex: number) => {
      const id = panes[paneIndex]?.activeDisplaySpecId;
      return id ? { displaySpecId: id } : {};
    },
    [panes],
  );

  // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: resolve source paths from marked visible files or cursor file in focused pane
  const getOperationFiles = useCallback((paneIndex: number): string[] => {
    const pane = panes[paneIndex];
    const visibleFiles =
      crossPaneVisibilityResult.displayFilesByPane[paneIndex] ?? pane.files;

    if (pane.marks.size > 0) {
      const markedFiles: string[] = [];
      for (const filename of pane.marks) {
        const file = visibleFiles.find((f) => f.name === filename);
        if (file) {
          markedFiles.push(file.path);
        }
      }
      return markedFiles;
    }
    const file = visibleFiles[pane.cursor];
    return file ? [file.path] : [];
  }, [panes, crossPaneVisibilityResult]);
  
  /**
   * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: require 2 panes; dest is other pane path; detect overwrite conflicts; confirm then POST bulk-copy; refresh both panes and clear marks
   * [IMPL-OVERWRITE_PROMPT]
   */
  const handleBulkCopy = useCallback(async (sourcePaneIndex?: number) => {
    const paneIndex = sourcePaneIndex ?? focusIndex;
    // Need at least 2 panes for cross-pane copy
    if (panes.length < 2) {
      alert("Copy requires at least 2 panes");
      return;
    }
    
    const sources = getOperationFiles(paneIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Destination is the other pane
    const destPaneIndex = paneIndex === 0 ? 1 : 0;
    const destDir = panes[destPaneIndex].path;
    
    // [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: before confirm, foreach source path compare basename to destination pane file names; build FileConflict when match
    const conflicts: FileConflict[] = [];
    for (const sourcePath of sources) {
      const basename = path.basename(sourcePath);
      const existingFile = panes[destPaneIndex].files.find(f => f.name === basename);
      
      if (existingFile) {
        // Find source file stat
        const sourceFile = panes[paneIndex].files.find(f => f.path === sourcePath);
        if (sourceFile) {
          const { sourceSummary, existingSummary, comparison } = describeFileComparison(
            sourceFile,
            existingFile
          );
          conflicts.push({
            name: basename,
            sourceSummary,
            existingSummary,
            comparison,
          });
        }
      }
    }
    
    // [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: base message shows source count and destDir; append overwrite count line when conflicts non-empty
    let message = `Copy ${sources.length} file(s) to:\n${destDir}`;
    if (conflicts.length > 0) {
      message += `\n\n${conflicts.length} file(s) will be overwritten.`;
    }
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Copy Files",
      message,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Copying Files",
          total: sources.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "bulk-copy",
              sources,
              dest: destDir,
              ...displaySpecPayload(paneIndex),
            }),
          });
          
          const result: OperationResult = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Copy Complete",
            total: sources.length,
            completed: result.successCount,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh both panes
          await handleNavigate(paneIndex, panes[paneIndex].path);
          await handleNavigate(destPaneIndex, panes[destPaneIndex].path);
          
          // Clear marks in source pane
          handleClearMarks(paneIndex);
        } catch (error) {
          console.error("Bulk copy failed:", error);
          alert(`Copy failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, confirmDialog, progressDialog, handleNavigate, handleClearMarks, displaySpecPayload]);
  
  /**
   * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: same client flow as BulkCopy with operation bulk-move and file.move keybinding (V)
   * [IMPL-OVERWRITE_PROMPT]
   */
  const handleBulkMove = useCallback(async (sourcePaneIndex?: number) => {
    const paneIndex = sourcePaneIndex ?? focusIndex;
    // Need at least 2 panes for cross-pane move
    if (panes.length < 2) {
      alert("Move requires at least 2 panes");
      return;
    }
    
    const sources = getOperationFiles(paneIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Destination is the other pane
    const destPaneIndex = paneIndex === 0 ? 1 : 0;
    const destDir = panes[destPaneIndex].path;
    
    // [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: before confirm, foreach source path compare basename to destination pane file names; build FileConflict when match
    const conflicts: FileConflict[] = [];
    for (const sourcePath of sources) {
      const basename = path.basename(sourcePath);
      const existingFile = panes[destPaneIndex].files.find(f => f.name === basename);
      
      if (existingFile) {
        // Find source file stat
        const sourceFile = panes[paneIndex].files.find(f => f.path === sourcePath);
        if (sourceFile) {
          const { sourceSummary, existingSummary, comparison } = describeFileComparison(
            sourceFile,
            existingFile
          );
          conflicts.push({
            name: basename,
            sourceSummary,
            existingSummary,
            comparison,
          });
        }
      }
    }
    
    // [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: base message shows source count and destDir; append overwrite count line when conflicts non-empty
    let message = `Move ${sources.length} file(s) to:\n${destDir}`;
    if (conflicts.length > 0) {
      message += `\n\n${conflicts.length} file(s) will be overwritten.`;
    }
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Move Files",
      message,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Moving Files",
          total: sources.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "bulk-move",
              sources,
              dest: destDir,
              ...displaySpecPayload(paneIndex),
            }),
          });
          
          const result: OperationResult = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Move Complete",
            total: sources.length,
            completed: result.successCount,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh both panes
          await handleNavigate(paneIndex, panes[paneIndex].path);
          await handleNavigate(destPaneIndex, panes[destPaneIndex].path);
          
          // Clear marks in source pane
          handleClearMarks(paneIndex);
        } catch (error) {
          console.error("Bulk move failed:", error);
          alert(`Move failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, confirmDialog, progressDialog, handleNavigate, handleClearMarks, displaySpecPayload]);
  
  /**
   * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: destructive confirm then POST bulk-delete; refresh focused pane and clear marks
   */
  const handleBulkDelete = useCallback(async (sourcePaneIndex?: number) => {
    const paneIndex = sourcePaneIndex ?? focusIndex;
    const sources = getOperationFiles(paneIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Delete Files",
      message: `Permanently delete ${sources.length} file(s)?\n\nThis action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Deleting Files",
          total: sources.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "bulk-delete",
              sources,
              ...displaySpecPayload(paneIndex),
            }),
          });
          
          const result: OperationResult = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Delete Complete",
            total: sources.length,
            completed: result.successCount,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh current pane
          await handleNavigate(paneIndex, panes[paneIndex].path);
          
          // Clear marks
          handleClearMarks(paneIndex);
        } catch (error) {
          console.error("Bulk delete failed:", error);
          alert(`Delete failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, confirmDialog, progressDialog, handleNavigate, handleClearMarks, displaySpecPayload]);

  // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET] Helper to get other visible pane directories
  /**
   * Get all pane directories except the focused pane
   * [IMPL-NSYNC_ENGINE]
   */
  const getOtherPaneDirs = useCallback((): string[] => {
    return panes
      .map((pane, idx) => (idx !== focusIndex ? pane.path : null))
      .filter((p): p is string => p !== null);
  }, [panes, focusIndex]);

  // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET] Copy to all other panes
  /**
   * Execute CopyAll operation - copy sources to ALL other visible panes
   * [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET]
   */
  const handleCopyAll = useCallback(async () => {
    const destinations = getOtherPaneDirs();
    
    // Need at least 2 panes (1 source + 1+ destinations)
    if (destinations.length === 0) {
      alert("CopyAll requires at least 2 panes. Use regular copy (c) instead.");
      return;
    }
    
    const sources = getOperationFiles(focusIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Build message
    const message = `Copy ${sources.length} file(s) to ${destinations.length} pane(s):\n${destinations.join("\n")}`;
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Copy to All Panes",
      message,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Copying to All Panes",
          total: sources.length * destinations.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "sync-all",
              sources,
              destinations,
              move: false,
              compareMethod: "size-mtime",
              verify: false,
              ...displaySpecPayload(focusIndex),
            }),
          });
          
          const result = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Copy Complete",
            total: sources.length * destinations.length,
            completed: result.itemsCompleted,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh all panes
          await Promise.all(panes.map((pane, idx) => handleNavigate(idx, pane.path)));
          
          // Clear marks in source pane
          handleClearMarks(focusIndex);
        } catch (error) {
          console.error("CopyAll failed:", error);
          alert(`CopyAll failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, getOtherPaneDirs, confirmDialog, progressDialog, handleNavigate, handleClearMarks, displaySpecPayload]);

  // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET] Move to all other panes
  /**
   * Execute MoveAll operation - move sources to ALL other visible panes
   * [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]
   */
  const handleMoveAll = useCallback(async () => {
    const destinations = getOtherPaneDirs();
    
    // Need at least 2 panes (1 source + 1+ destinations)
    if (destinations.length === 0) {
      alert("MoveAll requires at least 2 panes. Use regular move (m) instead.");
      return;
    }
    
    const sources = getOperationFiles(focusIndex);
    if (sources.length === 0) {
      return;
    }
    
    // Build message
    const message = `Move ${sources.length} file(s) to ${destinations.length} pane(s):\n${destinations.join("\n")}\n\nSource files will be deleted after successful sync to ALL destinations.`;
    
    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: "Move to All Panes",
      message,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        // Show progress dialog
        setProgressDialog({
          isOpen: true,
          title: "Moving to All Panes",
          total: sources.length * destinations.length,
          completed: 0,
          currentFile: "",
          errors: [],
          isComplete: false,
        });
        
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "sync-all",
              sources,
              destinations,
              move: true,
              compareMethod: "size-mtime",
              verify: false,
              ...displaySpecPayload(focusIndex),
            }),
          });
          
          const result = await response.json();
          
          // Update progress dialog with result
          setProgressDialog({
            isOpen: true,
            title: "Move Complete",
            total: sources.length * destinations.length,
            completed: result.itemsCompleted,
            currentFile: "",
            errors: result.errors,
            isComplete: true,
            result,
          });
          
          // Refresh all panes
          await Promise.all(panes.map((pane, idx) => handleNavigate(idx, pane.path)));
          
          // Clear marks in source pane
          handleClearMarks(focusIndex);
        } catch (error) {
          console.error("MoveAll failed:", error);
          alert(`MoveAll failed: ${String(error)}`);
          setProgressDialog({ ...progressDialog, isOpen: false });
        }
      },
    });
  }, [panes, focusIndex, getOperationFiles, getOtherPaneDirs, confirmDialog, progressDialog, handleNavigate, handleClearMarks, displaySpecPayload]);

  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS]: how: build dest path with path.join(dirname, newName); POST operation rename; on success handleNavigate(paneIndex, dir)
  const handleRenameConfirm = useCallback(
    (filePath: string, paneIndex: number, newName: string) => {
      const dir = path.dirname(filePath);
      const newPath = path.join(dir, newName);
      setRenameDialog((prev) => ({ ...prev, isOpen: false }));
      fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "rename",
          src: filePath,
          dest: newPath,
          ...displaySpecPayload(paneIndex),
        }),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((j: { error?: string }) => { throw new Error(j.error || res.statusText); });
          return res;
        })
        .then(() => handleNavigate(paneIndex, dir))
        .catch((e) => {
          console.error("Rename failed:", e);
          alert(`Rename failed: ${String(e)}`);
        });
    },
    [handleNavigate, displaySpecPayload]
  );

  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
  // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV]
  // Helper: Navigate to parent directory with cursor positioning
  const navigateToParent = useCallback(async (paneIndex: number) => {
    const pane = panes[paneIndex];
    if (!pane) return;
    
    const currentPath = pane.path;
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    
    if (parentPath === currentPath) return; // Already at root
    
    // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Save parent cursor position on subdirectory name
    // This ensures when handleNavigate restores cursor, it finds the subdirectory
    const subdirName = currentPath.split("/").filter(Boolean).pop() || "";
    if (subdirName) {
      globalDirectoryHistory.saveCursorPosition(
        paneIndex,
        parentPath,
        subdirName,
        0, // Will be recalculated by findIndex in restoreCursorPosition
        0
      );
    }
    
    // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Use handleNavigate to trigger linked sync
    await handleNavigate(paneIndex, parentPath);
  }, [panes, handleNavigate]);

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] UPDATE_EXISTING_WORKSPACE
  const handleUpdateWorkspaceMesh = useCallback(
    async (name: string, note?: string) => {
      if (!meshId) {
        throw new Error("No workspace loaded to update");
      }
      const snapshot = captureCurrentSnapshot();
      const res = await fetch(`/api/mesh/${meshId}/workspace`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, note, snapshot }),
      });
      const data = (await res.json()) as {
        mesh?: {
          name?: string;
          description?: string;
          tags?: string[];
          depots?: { id?: string; name?: string; kind?: string; root?: string }[];
        };
        error?: { message?: string };
      };
      if (!res.ok || !data.mesh) {
        throw new Error(data.error?.message ?? "Failed to update workspace");
      }
      if (data.mesh.name) {
        setLoadedMeshName(data.mesh.name);
      }
      // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] save_update_clears_diff_baseline
      // how: setSavedSnapshot to exact capture (not re-parsed mesh) so diff badge clears immediately
      skipPropBaselineSyncRef.current = true;
      setSavedSnapshot(snapshot);
      router.replace(`/files?meshId=${meshId}`);
    },
    [meshId, captureCurrentSnapshot, router],
  );

  // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] STORE_FROM_WORKSPACE_UI
  const handleSaveWorkspaceAsMesh = useCallback(
    async (name: string, note?: string, mode: WorkspaceMeshSaveMode = "create") => {
      if (mode === "update" && meshId) {
        await handleUpdateWorkspaceMesh(name, note);
        return;
      }
      const snapshot = captureCurrentSnapshot();
      const payload = buildMeshCreatePayload({ name, note, snapshot });
      const res = await fetch("/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        mesh?: { id: string };
        error?: { message?: string };
      };
      if (!res.ok || !data.mesh?.id) {
        throw new Error(data.error?.message ?? "Failed to create mesh");
      }
      router.push(`/mesh/${data.mesh.id}`);
    },
    [captureCurrentSnapshot, meshId, handleUpdateWorkspaceMesh, router],
  );

  // [REQ-TOOLBAR_SYSTEM] Workspace-scoped actions (no focused pane required)
  // [IMPL-WORKSPACE_VIEW] [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-KEYBOARD_NAVIGATION]: how: useMemo builds workspaceActionHandlers and paneActionHandlers maps; merged into actionHandlers; window keydown and handleExecuteAction dispatch through merged map
  const workspaceActionHandlers = useMemo(() => {
    const handlers = new Map<string, () => void>();
    handlers.set("mesh.saveWorkspace", () => setSaveMeshDialogOpen(true));
    // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] DIFF_SAVED_VS_CURRENT
    handlers.set("mesh.diffWorkspace", () => setDiffDialogOpen(true));
    handlers.set("help.show", () => setShowHelp((prev) => !prev));
    handlers.set("command.palette", () => setShowCommandPalette((prev) => !prev));
    handlers.set("search.finder", () => setShowFinderDialog(true));
    handlers.set("search.content", () => setShowSearchDialog(true));
    // [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: pane.refresh-all uses Promise.all over every pane index calling handleNavigate(idx, p.path)
    handlers.set("pane.refresh-all", () => {
      void Promise.all(panes.map((p, idx) => handleNavigate(idx, p.path)));
    });

    // [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_UI] CYCLE_TRI_STATE + THRESHOLD_DIALOG
    handlers.set("view.compareFilter.thresholds", () => {
      setCompareFilterThresholdOpen(true);
    });
    for (const criterionId of COMPARE_FILTER_CRITERION_IDS) {
      handlers.set(compareFilterActionId(criterionId), () => {
        const thresholdCriteria: CompareFilterCriterionId[] = [
          "sizeGtThreshold",
          "sizeLtThreshold",
          "timeGtThreshold",
          "timeLtThreshold",
        ];
        if (thresholdCriteria.includes(criterionId)) {
          const needsSize =
            (criterionId === "sizeGtThreshold" || criterionId === "sizeLtThreshold") &&
            focusedVisibilityState.sizeThreshold === null;
          const needsTime =
            (criterionId === "timeGtThreshold" || criterionId === "timeLtThreshold") &&
            focusedVisibilityState.timeThreshold === null;
          if (needsSize || needsTime) {
            setCompareFilterThresholdOpen(true);
            return;
          }
        }
        updateFocusedPaneCrossPaneDraft((prev) => {
          const current = prev.toggles[criterionId] ?? "inactive";
          return {
            ...prev,
            toggles: {
              ...prev.toggles,
              [criterionId]: cycleTriState(current),
            },
          };
        });
      });
    }

    return handlers;
  }, [panes, handleNavigate, focusedVisibilityState, updateFocusedPaneCrossPaneDraft]);

  const paneActionHandlers = useMemo(() => {
    const handlers = new Map<string, () => void>();
    const pane = panes[focusIndex];
    if (!pane) return handlers;
    const visibleFiles =
      crossPaneVisibilityResult.displayFilesByPane[focusIndex] ?? pane.files;

    // Navigation
    handlers.set("navigate.up", () => {
      if (pane.cursor > 0) {
        handleCursorMove(focusIndex, pane.cursor - 1);
      }
    });
    
    handlers.set("navigate.down", () => {
      if (pane.cursor < visibleFiles.length - 1) {
        handleCursorMove(focusIndex, pane.cursor + 1);
      }
    });
    
    handlers.set("navigate.enter", () => {
      const file = visibleFiles[pane.cursor];
      if (file && file.isDirectory) {
        handleNavigate(focusIndex, file.path);
      }
    });
    
    handlers.set("navigate.parent", () => {
      void navigateToParent(focusIndex);
    });
    
    handlers.set("navigate.tab", () => {
      setFocusIndex((prev) => (prev + 1) % panes.length);
    });
    
    handlers.set("navigate.first", () => {
      if (visibleFiles.length > 0) {
        handleCursorMove(focusIndex, 0);
      }
    });
    
    handlers.set("navigate.last", () => {
      if (visibleFiles.length > 0) {
        handleCursorMove(focusIndex, visibleFiles.length - 1);
      }
    });
    
    handlers.set("navigate.home", () => {
      const homeDir = process.env.HOME || process.env.USERPROFILE || "/";
      handleNavigate(focusIndex, homeDir);
    });
    
    // File Operations
    handlers.set("file.copy", () => {
      handleBulkCopy();
    });
    
    // [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: how: keybinding v maps to file.move calling handleBulkMove; M reserved for mark.toggle
    handlers.set("file.move", () => {
      handleBulkMove();
    });

    // [IMPL-NSYNC_ENGINE] [REQ-NSYNC_MULTI_TARGET] Multi-destination operations
    handlers.set("file.copyAll", () => {
      handleCopyAll();
    });
    
    handlers.set("file.moveAll", () => {
      handleMoveAll();
    });
    
    handlers.set("file.delete", () => {
      handleBulkDelete();
    });
    
    // [IMPL-RENAME_DIALOG] [ARCH-KEYBIND_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: file.rename handler reads visibleFiles[pane.cursor]; opens renameDialog with path, name, focusIndex
    handlers.set("file.rename", () => {
      const file = visibleFiles[pane.cursor];
      if (file) {
        setRenameDialog({
          isOpen: true,
          filePath: file.path,
          fileName: file.name,
          paneIndex: focusIndex,
        });
      }
    });
    
    // Marking
    // [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: Space keybinding mark.toggle toggles visible cursor file then advances cursor if not last
    handlers.set("mark.toggle", () => {
      const file = visibleFiles[pane.cursor];
      if (file) {
        handleToggleMark(focusIndex, file.name);
        if (pane.cursor < visibleFiles.length - 1) {
          handleCursorMove(focusIndex, pane.cursor + 1);
        }
      }
    });
    
    // [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: m key and checkbox call handleToggleMark without cursor move
    handlers.set("mark.toggle-cursor", () => {
      const file = visibleFiles[pane.cursor];
      if (file) {
        handleToggleMark(focusIndex, file.name);
      }
    });
    
    handlers.set("mark.all", () => {
      handleMarkAll(focusIndex);
    });
    
    handlers.set("mark.invert", () => {
      handleInvertMarks(focusIndex);
    });
    
    handlers.set("mark.clear", () => {
      handleClearMarks(focusIndex);
    });
    
    handlers.set("view.layout", () => {
      setLayoutPickerOpen(true);
    });

    handlers.set("view.sort", () => {
      setSortDialog({ isOpen: true });
    });

    // [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER] view.columns — column order dialog (no shortcut)
    handlers.set("view.columns", () => {
      setColumnOrderDialogOpen(true);
    });
    
    handlers.set("view.comparison", () => {
      if (panes.length < 2) {
        // Comparison requires at least 2 panes
        return;
      }
      setComparisonMode((prev) => {
        switch (prev) {
          case "off": return "name";
          case "name": return "size";
          case "size": return "time";
          case "time": return "off";
          default: return "off";
        }
      });
    });
    
    // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV] Link toggle handler
    handlers.set("link.toggle", () => {
      if (panes.length < 2) {
        // Linking requires at least 2 panes
        return;
      }
      setLinkedMode((prev) => !prev);
    });
    
    // [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-TOOLBAR_SYSTEM] [REQ-PANE_DISPLAY_FILTER]: how: view.displaySpec opens manager dialog; view.displaySpec.none clears active spec on focused pane
    handlers.set("view.displaySpec", () => {
      setDisplaySpecManagerOpen(true);
    });

    handlers.set("view.displaySpec.none", () => {
      void handleSetActiveDisplaySpec(focusIndex, null);
    });
    
    handlers.set("view.hidden", () => {
      // TODO: Implement hidden files toggle
      console.info("[IMPL-KEYBINDS] Hidden files toggle not yet implemented");
    });
    
    // Preview
    handlers.set("preview.info", () => {
      const file = visibleFiles[pane.cursor];
      if (file) {
        setPreviewPanel((prev) => {
          if (prev.type === "info" && prev.filePath === file.path) {
            // Close if same file
            return { type: null, filePath: null };
          }
          // Open info panel
          return { type: "info", filePath: file.path };
        });
      }
    });
    
    handlers.set("preview.content", () => {
      const file = visibleFiles[pane.cursor];
      if (file && !file.isDirectory) {
        setPreviewPanel((prev) => {
          if (prev.type === "preview" && prev.filePath === file.path) {
            // Close if same file
            return { type: null, filePath: null };
          }
          // Open preview panel
          return { type: "preview", filePath: file.path };
        });
      }
    });
    
    // Advanced
    handlers.set("bookmark.goto", () => {
      setGotoDialog({
        isOpen: true,
        path: pane.path,
      });
    });
    
    handlers.set("bookmark.add", () => {
      const label = prompt(`Bookmark ${pane.path} as:`, pane.path.split("/").pop() || "Root");
      if (label) {
        globalBookmarkManager.addBookmark(pane.path, label);
        alert(`Bookmarked: ${label}`);
      }
    });
    
    handlers.set("bookmark.list", () => {
      setBookmarkDialog({
        isOpen: true,
        mode: "list",
        currentPath: pane.path,
      });
    });
    
    handlers.set("history.back", () => {
      const prevPath = globalDirectoryHistory.navigateBack(focusIndex, pane.path);
      if (prevPath) {
        handleNavigate(focusIndex, prevPath);
      }
    });
    
    handlers.set("history.forward", () => {
      const nextPath = globalDirectoryHistory.navigateForward(focusIndex, pane.path);
      if (nextPath) {
        handleNavigate(focusIndex, nextPath);
      }
    });
    
    // [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [ARCH-KEYBIND_SYSTEM] [REQ-MULTI_PANE_LAYOUT] Pane management and reorder
    handlers.set("pane.add", () => {
      void handleAddPane();
    });
    
    handlers.set("pane.remove", () => {
      handleRemovePane(focusIndex);
    });

    handlers.set("pane.swap", () => {
      handleSwapFocusedNext();
    });

    handlers.set("pane.swapPrev", () => {
      handleSwapFocusedPrev();
    });

    handlers.set("pane.cycle", () => {
      handleCyclePanes("forward");
    });

    handlers.set("pane.cyclePrev", () => {
      handleCyclePanes("backward");
    });

    // [IMPL-PANE_MANAGEMENT] [REQ-TOOLBAR_SYSTEM] [REQ-MULTI_PANE_LAYOUT]: how: pane.order keybind sets paneOrderDialogOpen true without reordering panes
    handlers.set("pane.order", () => {
      setPaneOrderDialogOpen(true);
    });
    
    // [IMPL-PANE_REFRESH] [ARCH-PANE_REFRESH] [ARCH-KEYBIND_SYSTEM] [REQ-PANE_REFRESH] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: pane.refresh action calls handleNavigate(focusIndex, pane.path) for focused pane only
    handlers.set("pane.refresh", () => {
      void handleNavigate(focusIndex, pane.path);
    });
    
    return handlers;
  }, [panes, focusIndex, crossPaneVisibilityResult, navigateToParent, handleNavigate, handleBulkCopy, handleBulkMove, handleBulkDelete, handleAddPane, handleRemovePane, handleSwapFocusedNext, handleSwapFocusedPrev, handleCyclePanes, handleClearMarks, handleCursorMove, handleToggleMark, handleMarkAll, handleInvertMarks, handleCopyAll, handleMoveAll, handleSetActiveDisplaySpec]);

  const actionHandlers = useMemo(() => {
    const merged = new Map(workspaceActionHandlers);
    for (const [key, fn] of paneActionHandlers) {
      merged.set(key, fn);
    }
    return merged;
  }, [workspaceActionHandlers, paneActionHandlers]);
  
  // [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: window keydown listener skips inputs and open modals; preventDefault when handler exists
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Skip if modal overlays are open (they handle their own keybindings)
      if (showHelp || showCommandPalette || showFinderDialog || showSearchDialog) {
        return;
      }
      
      // Match keybinding to action
      const action = matchKeybinding(e);
      if (action) {
        const handler = actionHandlers.get(action);
        if (handler) {
          e.preventDefault();
          handler();
        } else {
          console.warn(
            `[IMPL-KEYBINDS] No handler registered for action: ${action}`
          );
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionHandlers, showHelp, showCommandPalette, showFinderDialog, showSearchDialog]);
  
  // [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS]
  // Execute action from command palette
  const handleExecuteAction = (action: string) => {
    const handler = actionHandlers.get(action);
    if (handler) {
      handler();
    } else {
      console.warn(
        `[IMPL-KEYBINDS] Command palette: no handler for action: ${action}`
      );
    }
  };
  
  // [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS]
  // Track active/disabled actions for toolbar buttons
  const activeActions = useMemo(() => {
    const active = new Set<string>();
    if (linkedMode) active.add('link.toggle');
    // showHidden not yet implemented - TODO: add when view.hidden is implemented
    if (comparisonMode !== "off") active.add('view.comparison');
    if (layoutPickerOpen) active.add('view.layout');
    for (const id of COMPARE_FILTER_CRITERION_IDS) {
      const state = focusedVisibilityState.toggles[id];
      if (state === "include" || state === "exclude") {
        active.add(compareFilterActionId(id));
      }
    }
    return active;
  }, [linkedMode, comparisonMode, layoutPickerOpen, focusedVisibilityState]);
  
  const disabledActions = useMemo(() => {
    const disabled = new Set<string>();
    const focusedPane = panes[focusIndex];
    const focusedVisibleCount =
      crossPaneVisibilityResult.displayFilesByPane[focusIndex]?.length ??
      focusedPane?.files.length ??
      0;

    if (!focusedPane || focusedVisibleCount === 0) {
      // Disable file operations when no files
      disabled.add('file.copy');
      disabled.add('file.move');
      disabled.add('file.delete');
      disabled.add('file.rename');
      disabled.add('preview.info');
      disabled.add('preview.content');
    }
    
    // Disable marking actions when no marks
    if (!focusedPane || focusedPane.marks.size === 0) {
      disabled.add('mark.clear');
      disabled.add('mark.invert');
    }
    
    // Disable navigation at boundaries
    if (focusedPane && focusedPane.cursor === 0) {
      disabled.add('navigate.up');
      disabled.add('navigate.first');
    }
    if (focusedPane && focusedPane.cursor === focusedVisibleCount - 1) {
      disabled.add('navigate.down');
      disabled.add('navigate.last');
    }
    
    // Disable pane management at limits (maxPanes 0 = no limit)
    const maxPanes = layoutConfig.maxPanes ?? 0;
    if (maxPanes > 0 && panes.length >= maxPanes) {
      disabled.add('pane.add');
    }
    if (panes.length <= 1) {
      disabled.add('pane.remove');
      disabled.add('pane.swap');
      disabled.add('pane.swapPrev');
      disabled.add('pane.cycle');
      disabled.add('pane.cyclePrev');
      disabled.add('pane.order');
    }
    // [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: disable pane.swap, cycle, order when allowPaneManagement false or fewer than two panes
    if (!layoutConfig.allowPaneManagement) {
      disabled.add('pane.swap');
      disabled.add('pane.swapPrev');
      disabled.add('pane.cycle');
      disabled.add('pane.cyclePrev');
      disabled.add('pane.order');
    }

    // [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] DIFF_SAVED_VS_CURRENT
    // how: disable mesh.diffWorkspace until meshId and saved baseline exist
    if (!meshId || !savedSnapshot) {
      disabled.add('mesh.diffWorkspace');
    }
    
    return disabled;
  }, [panes, focusIndex, layoutConfig, meshId, savedSnapshot, crossPaneVisibilityResult]);

  const triStateActions = useMemo(() => {
    const map = new Map<string, TriState>();
    for (const id of COMPARE_FILTER_CRITERION_IDS) {
      map.set(compareFilterActionId(id), focusedVisibilityState.toggles[id] ?? "inactive");
    }
    return map;
  }, [focusedVisibilityState]);

  const mergedToolbarConfig = useMemo(
    () => (toolbars ? mergeTopToolbarConfigs(toolbars) : null),
    [toolbars],
  );

  const toolbarCompactToggle = (
    <ToolbarCompactToggle
      expanded={toolbarExpanded}
      onToggle={() => setToolbarExpanded((v) => !v)}
    />
  );

  const showWorkspaceTop =
    Boolean(toolbars?.workspace.enabled && toolbars.workspace.position === "top");
  const showPaneTop =
    Boolean(toolbars?.pane.enabled && toolbars.pane.position === "top");
  const showSystemTop =
    Boolean(toolbars?.system.enabled && toolbars.system.position === "top");
  
  return (
    <div className="h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950">
      {/* [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_STATUS — compact banner */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              File Manager
            </h1>
            {(loadedMeshName ||
              effectiveRestoreWarning ||
              meshRehydrating ||
              (restoredFromMesh && !effectiveRestoreWarning && !loadedMeshName)) && (
              <div
                className="mt-0.5 space-y-0.5"
                data-testid="workspace-header-status"
              >
                {/* [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] SHOW_LOADED_WORKSPACE_NAME */}
                {loadedMeshName && (
                  <p
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    data-testid="workspace-loaded-name"
                  >
                    {workspaceMeshCopy?.loadedLabel ?? "Workspace"}: {loadedMeshName}
                  </p>
                )}
                {meshRehydrating && (
                  <p
                    className="text-sm text-zinc-600 dark:text-zinc-400"
                    data-testid="workspace-restore-pending"
                  >
                    Restoring workspace…
                  </p>
                )}
                {/* [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_STATUS — how: amber warning when partial or client restore succeeded */}
                {effectiveRestoreWarning && (restoredFromMesh || clientRestoredFromMesh) && (
                  <p
                    className="text-sm text-amber-700 dark:text-amber-300"
                    data-testid="workspace-restore-warning"
                  >
                    {clientRestoredFromMesh && !restoredFromMesh
                      ? `Workspace restored via API (server bootstrap missed mesh data). ${effectiveRestoreWarning}`
                      : effectiveRestoreWarning}
                  </p>
                )}
                {/* [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_STATUS — how: red error when server bootstrap failed and client rehydrate has not recovered */}
                {effectiveRestoreWarning &&
                  !restoredFromMesh &&
                  !clientRestoredFromMesh &&
                  !meshRehydrating && (
                  <p
                    className="text-sm text-red-700 dark:text-red-400"
                    data-testid="workspace-restore-error"
                  >
                    {effectiveRestoreWarning}
                  </p>
                )}
                {/* [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_STATUS — how: green fallback when restoredFromMesh with no name or warning */}
                {restoredFromMesh && !effectiveRestoreWarning && !loadedMeshName && (
                  <p
                    className="text-sm text-emerald-700 dark:text-emerald-400"
                    data-testid="workspace-restored-from-mesh"
                  >
                    Workspace restored from mesh
                  </p>
                )}
              </div>
            )}
            {specDeletedNotice && (
              <p
                className="mt-1 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2"
                data-testid="display-spec-deleted-notice"
              >
                {specDeletedNotice}
                <button
                  type="button"
                  className="underline text-xs"
                  onClick={() => setSpecDeletedNotice(null)}
                >
                  Dismiss
                </button>
              </p>
            )}
            {compareFilterPresetDeletedNotice && (
              <p
                className="mt-1 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2"
                data-testid="compare-filter-preset-deleted-notice"
              >
                {compareFilterPresetDeletedNotice}
                <button
                  type="button"
                  className="underline text-xs"
                  onClick={() => setCompareFilterPresetDeletedNotice(null)}
                >
                  Dismiss
                </button>
              </p>
            )}
          </div>

          {/* [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] DIFF_SAVED_VS_CURRENT — header Diff control */}
          {meshId && savedSnapshot && (
            <button
              type="button"
              onClick={() => setDiffDialogOpen(true)}
              className="shrink-0 rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              data-testid="workspace-diff-header-button"
              title={workspaceMeshCopy?.diffButton ?? "Compare to saved workspace"}
            >
              {workspaceMeshCopy?.diffButton ?? "Diff"}
              {workspaceDiffChanges.length > 0 && (
                <span
                  className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-amber-500 px-1 text-xs text-white"
                  data-testid="workspace-diff-change-count"
                >
                  {workspaceDiffChanges.length}
                </span>
              )}
            </button>
          )}

          {/* [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_HEADER_MESH_LINK — cross-surface nav to Mesh */}
          <nav
            className="flex flex-wrap gap-3 text-sm"
            data-testid="workspace-cross-surface-nav"
            aria-label="Cross-surface navigation"
          >
            <NewTabLink
              href={meshId ? `/mesh/${meshId}` : "/mesh"}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              data-testid="open-mesh-from-workspace"
            >
              Mesh Sync
            </NewTabLink>
          </nav>

        </div>
      </header>
      
      {/* [REQ-TOOLBAR_SYSTEM] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] WORKSPACE_TOOLBAR_DISPLAY_MODE */}
      {toolbars && toolbars.enabled && (
        <>
          {toolbarExpanded ? (
            <>
              {showWorkspaceTop && (
                <WorkspaceToolbar
                  config={toolbars.workspace}
                  onAction={handleExecuteAction}
                  activeActions={activeActions}
                  disabledActions={disabledActions}
                  leadingContent={toolbarCompactToggle}
                  actionsMeta={toolbars.actions}
                  triStateActions={triStateActions}
                />
              )}

              {showPaneTop && (
                <PaneToolbar
                  config={toolbars.pane}
                  onAction={handleExecuteAction}
                  activeActions={activeActions}
                  disabledActions={disabledActions}
                  leadingContent={!showWorkspaceTop ? toolbarCompactToggle : undefined}
                  actionsMeta={toolbars.actions}
                />
              )}

              {showSystemTop && (
                <SystemToolbar
                  config={toolbars.system}
                  onAction={handleExecuteAction}
                  activeActions={activeActions}
                  disabledActions={disabledActions}
                  leadingContent={
                    !showWorkspaceTop && !showPaneTop ? toolbarCompactToggle : undefined
                  }
                  actionsMeta={toolbars.actions}
                />
              )}
            </>
          ) : (
            mergedToolbarConfig && (
              <Toolbar
                config={mergedToolbarConfig}
                onAction={handleExecuteAction}
                activeActions={activeActions}
                disabledActions={disabledActions}
                leadingContent={toolbarCompactToggle}
                showKeystroke={false}
                singleRow
                actionsMeta={toolbars.actions}
                triStateActions={triStateActions}
                className="toolbar-compact"
              />
            )
          )}
        </>
      )}
      
      {/* Workspace area — measured via useElementSize for pane bounds [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM] */}
      <div
        ref={workspaceAreaRef}
        data-testid="workspace-area"
        className="flex-1 min-h-0 relative overflow-hidden"
      >
        {meshRehydrating && panes.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center text-sm text-zinc-600 dark:text-zinc-400"
            data-testid="workspace-mesh-restore-loading"
          >
            Restoring workspace…
          </div>
        )}
        {panes.map((pane, index) => {
          const displayFiles =
            crossPaneVisibilityResult.displayFilesByPane[index] ?? pane.files;
          const crossPaneHidden =
            crossPaneVisibilityResult.crossPaneHiddenByPane[index] ?? 0;
          return (
          <FilePane
            key={`pane-${index}`}
            data-testid={`pane-${index}`}
            path={pane.path}
            files={displayFiles}
            cursor={pane.cursor}
            marks={pane.marks}
            bounds={bounds[index] || { x: 0, y: 0, width: 0, height: 0 }}
            focused={index === focusIndex}
            onNavigate={(newPath) => handleNavigate(index, newPath)}
            onCursorMove={(newCursor) => handleCursorMove(index, newCursor)}
            onToggleMark={(filename) => handleToggleMark(index, filename)}
            comparisonMode={comparisonMode}
            comparisonIndex={enhancedComparisonIndex}
            paneIndex={index}
            sortBy={pane.sortBy}
            sortDirection={pane.sortDirection}
            sortDirsFirst={pane.sortDirsFirst}
            linked={linkedMode && panes.length > 1} // [REQ-LINKED_PANES] [IMPL-LINKED_NAV]
            scrollTrigger={scrollTriggers.get(index)} // [REQ-LINKED_PANES] [IMPL-LINKED_NAV] Scroll sync
            // [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION]: how — switch focusIndex when user clicks pane via FilePane onFocusRequest onMouseDown; file row clicks bubble to pane container.
            onFocusRequest={() => setFocusIndex(index)}
            onNavigateParent={() => navigateToParent(index)} // [REQ-LINKED_PANES] [IMPL-LINKED_NAV]
            columns={fileColumns} // [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
            metadataColumnWidths={sharedMetadataColumnWidths}
            onRename={(file) => setRenameDialog({ isOpen: true, filePath: file.path, fileName: file.name, paneIndex: index })}
            onCopy={() => void handleBulkCopy(index)}
            onMove={() => void handleBulkMove(index)}
            onDelete={() => void handleBulkDelete(index)}
            onSetBaseDirectory={(path) =>
              setSetBaseDirectoryDialog({ isOpen: true, path, paneIndex: index })
            }
            setBaseDirectoryMenuLabel={copy.paneManagement?.setBaseDirectoryMenu}
            displaySpecs={catalogSpecs}
            activeDisplaySpecId={pane.activeDisplaySpecId}
            activeDisplaySpecName={
              catalogSpecs.find((s) => s.id === pane.activeDisplaySpecId)?.name ?? null
            }
            hiddenCount={pane.hiddenCount + crossPaneHidden}
            rawFileCount={pane.rawFileCount}
            recentSpecIds={recentSpecIds}
            onDisplaySpecSelect={(specId) => void handleSetActiveDisplaySpec(index, specId)}
            onManageDisplaySpecs={() => setDisplaySpecManagerOpen(true)}
            crossPaneVisibilityPresets={visibilityPresets}
            activeCrossPaneVisibilityId={pane.activeCrossPaneVisibilityId}
            activeCrossPaneVisibilityName={
              visibilityPresets.find((p) => p.id === pane.activeCrossPaneVisibilityId)?.name ??
              null
            }
            crossPaneVisibilityDraftDirty={isCrossPaneVisibilityDraftDirty(
              pane,
              crossPaneVisibilityStore,
            )}
            recentCrossPanePresetIds={recentCrossPanePresetIds}
            onCrossPaneVisibilitySelect={(presetId) =>
              void handleSetActiveCrossPaneVisibility(index, presetId)
            }
            onManageCrossPaneVisibility={() => setCrossPaneVisibilityManagerOpen(true)}
            filterEmptyMessage={
              copy.displayFilter?.filterEmpty ??
              "No visible items — the active filter may be hiding files in this folder."
            }
            // PANE_FILES_LIST_TO_FILEPANE — [IMPL-WORKSPACE_VIEW] [IMPL-FILE_PANE] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]
            // how: pass workspace pane listings for cross-pane path clipboard resolution
            paneFilesList={panes.map((p) => p.files)}
          />
          );
        })}
      </div>
      
      {/* [IMPL-BULK_OPS] [IMPL-OVERWRITE_PROMPT] [REQ-BULK_FILE_OPS] Dialogs */}
      <ConfirmDialog
        title={confirmDialog.title}
        message={confirmDialog.message}
        isOpen={confirmDialog.isOpen}
        destructive={confirmDialog.title.includes("Delete")}
        conflicts={confirmDialog.conflicts}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
      
      <ProgressDialog
        title={progressDialog.title}
        total={progressDialog.total}
        completed={progressDialog.completed}
        currentFile={progressDialog.currentFile}
        errors={progressDialog.errors}
        isComplete={progressDialog.isComplete}
        result={progressDialog.result}
        isOpen={progressDialog.isOpen}
        onClose={() => setProgressDialog({ ...progressDialog, isOpen: false })}
      />
      
      {/* [IMPL-DIR_HISTORY] [REQ-ADVANCED_NAV] Navigation dialogs */}
      <GotoDialog
        isOpen={gotoDialog.isOpen}
        initialPath={gotoDialog.path}
        onClose={() => setGotoDialog({ ...gotoDialog, isOpen: false })}
        onNavigate={(path) => handleNavigate(focusIndex, path)}
      />

      {/* [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [IMPL-MOUSE_SUPPORT] Rename dialog */}
      <RenameDialog
        isOpen={renameDialog.isOpen}
        initialName={renameDialog.fileName}
        onConfirm={(newName) => handleRenameConfirm(renameDialog.filePath, renameDialog.paneIndex, newName)}
        onClose={() => setRenameDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <SaveWorkspaceMeshDialog
        isOpen={saveMeshDialogOpen}
        meshId={meshId}
        defaultName={
          loadedMeshName ??
          `Workspace ${new Date().toISOString().slice(0, 16).replace("T", " ")}`
        }
        saveDialogTitle={workspaceMeshCopy?.saveDialogTitle}
        updateDialogTitle={workspaceMeshCopy?.updateDialogTitle}
        createModeLabel={workspaceMeshCopy?.createModeLabel}
        updateModeLabel={workspaceMeshCopy?.updateModeLabel}
        updateSubmitLabel={workspaceMeshCopy?.updateSubmitLabel}
        createSubmitLabel={workspaceMeshCopy?.createSubmitLabel}
        onClose={() => setSaveMeshDialogOpen(false)}
        onSave={handleSaveWorkspaceAsMesh}
      />

      <DisplaySpecManagerDialog
        isOpen={displaySpecManagerOpen}
        onClose={() => setDisplaySpecManagerOpen(false)}
        store={displaySpecStore}
        panesUsingSpec={countPanesUsingSpec}
        onSaved={(spec) => {
          pushRecentSpec(spec.id);
          setCatalogSpecs(displaySpecStore.list());
        }}
        onDeleted={() => setCatalogSpecs(displaySpecStore.list())}
      />

      <CrossPaneVisibilityManagerDialog
        isOpen={crossPaneVisibilityManagerOpen}
        onClose={() => setCrossPaneVisibilityManagerOpen(false)}
        store={crossPaneVisibilityStore}
        panesUsingPreset={countPanesUsingCrossPanePreset}
        focusedDraft={focusedVisibilityState}
        onSaved={(preset: CrossPaneVisibilityPreset) => {
          pushRecentCrossPanePreset(preset.id);
          setVisibilityPresets(crossPaneVisibilityStore.list());
          void handleSetActiveCrossPaneVisibility(focusIndex, preset.id);
        }}
        onDeleted={() => setVisibilityPresets(crossPaneVisibilityStore.list())}
      />

      <CompareFilterThresholdDialog
        isOpen={compareFilterThresholdOpen}
        sizeThreshold={focusedVisibilityState.sizeThreshold}
        timeThreshold={focusedVisibilityState.timeThreshold}
        onClose={() => setCompareFilterThresholdOpen(false)}
        onApply={(sizeThreshold, timeThreshold) => {
          updateFocusedPaneCrossPaneDraft((prev) => ({
            ...prev,
            sizeThreshold,
            timeThreshold,
          }));
        }}
      />

      <WorkspaceDiffDialog
        isOpen={diffDialogOpen}
        title={workspaceMeshCopy?.diffDialogTitle}
        noChangesMessage={workspaceMeshCopy?.diffNoChanges}
        changes={workspaceDiffChanges}
        onClose={() => setDiffDialogOpen(false)}
      />
      
      <BookmarkDialog
        isOpen={bookmarkDialog.isOpen}
        onClose={() => setBookmarkDialog({ ...bookmarkDialog, isOpen: false })}
        onNavigate={(path) => handleNavigate(focusIndex, path)}
      />
      
      {/* [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] Sort dialog */}
      <LayoutPickerPopover
        isOpen={layoutPickerOpen}
        currentLayout={layout}
        labels={copy.layouts}
        onSelect={setLayout}
        onClose={() => setLayoutPickerOpen(false)}
      />

      <ColumnOrderDialog
        isOpen={columnOrderDialogOpen}
        columns={fileColumns}
        labels={copy.columns}
        onApply={setFileColumns}
        onClose={() => setColumnOrderDialogOpen(false)}
      />

      <PaneOrderDialog
        isOpen={paneOrderDialogOpen}
        panes={panes}
        focusIndex={focusIndex}
        labels={copy.paneManagement}
        onApply={handleApplyPaneOrder}
        onClose={() => setPaneOrderDialogOpen(false)}
      />

      <SetBaseDirectoryDialog
        isOpen={setBaseDirectoryDialog.isOpen}
        directoryPath={setBaseDirectoryDialog.path}
        initiatingPaneIndex={setBaseDirectoryDialog.paneIndex}
        paneCount={panes.length}
        allowPaneManagement={layoutConfig.allowPaneManagement ?? true}
        labels={copy.paneManagement}
        onApply={(target) => void handleApplySetBaseDirectory(target)}
        onClose={() =>
          setSetBaseDirectoryDialog((prev) => ({ ...prev, isOpen: false }))
        }
      />

      <SortDialog
        isOpen={sortDialog.isOpen}
        currentCriterion={panes[focusIndex]?.sortBy || "name"}
        currentDirection={panes[focusIndex]?.sortDirection || "asc"}
        currentDirsFirst={panes[focusIndex]?.sortDirsFirst ?? true}
        paneSort={{
          sortBy: panes[focusIndex]?.sortBy ?? "name",
          sortDirection: panes[focusIndex]?.sortDirection ?? "asc",
          sortDirsFirst: panes[focusIndex]?.sortDirsFirst ?? true,
        }}
        sharedSort={sharedSort}
        sharedButtonLabel={copy.sort?.sharedButton}
        shareButtonLabel={copy.sort?.shareButton}
        onApply={handleSortChange}
        onApplyShared={() =>
          handleSortChange(
            sharedSort.sortBy,
            sharedSort.sortDirection,
            sharedSort.sortDirsFirst,
            { singlePaneOnly: true },
          )
        }
        onShareToWorkspace={(settings) => setSharedSort(settings)}
        onClose={() => setSortDialog({ isOpen: false })}
      />
      
      {/* [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW] Preview panels */}
      {previewPanel.type === "info" && (
        <InfoPanel
          filePath={previewPanel.filePath}
          onClose={() => setPreviewPanel({ type: null, filePath: null })}
        />
      )}
      
      {previewPanel.type === "preview" && (
        <PreviewPanel
          filePath={previewPanel.filePath}
          onClose={() => setPreviewPanel({ type: null, filePath: null })}
        />
      )}
      
      {/* [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [ARCH-KEYBIND_SYSTEM] [IMPL-KEYBINDS] Help and command palette */}
      <HelpOverlay 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onExecute={handleExecuteAction}
      />
      
      {/* [REQ-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [IMPL-FILE_SEARCH] Search dialogs */}
      {/* [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-REACT_SSR_STABILITY] [REQ-FILE_SEARCH]: how: FinderDialog and SearchDialog use distinct open/closed React keys to force remount when toggling visibility and avoid duplicate key warnings */}
      <FinderDialog
        key={showFinderDialog ? "finder-open" : "finder-closed"}
        isOpen={showFinderDialog}
        onClose={() => setShowFinderDialog(false)}
        onSelect={handleFinderSelect}
        files={panes[focusIndex]?.files || []}
        copy={copy?.search}
      />
      
      <SearchDialog
        key={showSearchDialog ? "search-open" : "search-closed"}
        isOpen={showSearchDialog}
        onClose={() => setShowSearchDialog(false)}
        onSelectResult={handleSearchResultSelect}
        basePath={panes[focusIndex]?.path || "/"}
        copy={copy?.search}
      />
    </div>
  );
}
