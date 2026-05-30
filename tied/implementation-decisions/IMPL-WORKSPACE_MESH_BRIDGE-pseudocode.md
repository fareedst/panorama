# IMPL-WORKSPACE_MESH_BRIDGE essence pseudocode

## NORMALIZE_LAYOUT
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MULTI_PANE_LAYOUT]
# how: Map config aliases (tile, oneRow, oneColumn, fullscreen) to canonical LayoutType at capture, parse, and WorkspaceView init.

```
NORMALIZE_LAYOUT(value):
  IF value is canonical LayoutType THEN RETURN value
  IF value matches config alias (case-insensitive) THEN RETURN canonical LayoutType
  RETURN null
```

## CAPTURE_SNAPSHOT
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MULTI_PANE_LAYOUT] [REQ-PANE_DISPLAY_FILTER] [REQ-FILE_SORTING_ADVANCED] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-CROSS_PANE_VISIBILITY] [IMPL-FILE_COLUMN_CONFIG] [IMPL-CROSS_PANE_VISIBILITY_CATALOG]
# how: **Workspace snapshot** capture (canonical v1–v5 schema in docs/mesh-platform-vocabulary.md) — copy layout, focus, linked, comparison, sharedSort, fileColumns, and per-pane path/sort/cursor/displaySpecId/crossPaneVisibility into v5; layout via NORMALIZE_LAYOUT.

```
CAPTURE_SNAPSHOT(workspaceState):
  INPUT: workspace panes with activeDisplaySpecId and cross-pane visibility fields per pane; workspace fileColumns
  OUTPUT: WorkspaceSnapshot { version, layout, focusIndex, linkedMode, comparisonMode, sharedSort, fileColumns, panes[] }
  version := 5 (always on capture)
  sharedSort := workspace.sharedSort ?? DEFAULT_PANE_SORT
  fileColumns := deep copy workspace.fileColumns
  FOR each pane IN workspace.panes:
    visFields := INLINE_SNAPSHOT_WHEN_DIRTY(pane cross-pane fields, crossPaneVisibilityStore)
    paneEntry := { path, sortBy, sortDirection, sortDirsFirst, cursor, displaySpecId: pane.activeDisplaySpecId ?? null, ...visFields }
  RETURN { version, layout: NORMALIZE_LAYOUT(layout) ?? Tile, focusIndex, linkedMode, comparisonMode, sharedSort, fileColumns, panes: paneEntries }
```

## PARSE_DISPLAY_SPEC_ID_FROM_SNAPSHOT_PANE
# [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-PANE_DISPLAY_FILTER] [REQ-WORKSPACE_MESH_BRIDGE]
# how: v2+ snapshots persist displaySpecId per pane; v1 omits field (undefined on restore).

```
PARSE_DISPLAY_SPEC_ID_FROM_SNAPSHOT_PANE(snapshotVersion, paneJson):
  INPUT: snapshot version number, pane object from JSON
  OUTPUT: displaySpecId string|null|undefined
  IF snapshotVersion >= 2 AND typeof pane.displaySpecId = "string" THEN RETURN pane.displaySpecId
  IF snapshotVersion >= 2 AND pane.displaySpecId IS null THEN RETURN null
  RETURN undefined
```

## BUILD_MESH_PAYLOAD
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_CRUD]
# how: Map each pane path to local depot; embed snapshot JSON in description (optional human note prefix); tag workspace-snapshot; links empty.

```
BUILD_MESH_PAYLOAD(name, snapshot, note?):
  IF note trimmed THEN description = note + newline + JSON({ workspaceSnapshot: snapshot })
  ELSE description = JSON({ workspaceSnapshot: snapshot })
  RETURN { name, tags: ["workspace-snapshot"], description, depots[], links: [] }
```

## PARSE_SNAPSHOT_FROM_MESH
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_DOMAIN_MODEL] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-CROSS_PANE_VISIBILITY] [IMPL-FILE_COLUMN_CONFIG] [IMPL-CROSS_PANE_VISIBILITY_CATALOG]
# how: Parse description JSON (after optional note prefix); v5 crossPaneVisibility per pane; v4 fileColumns; v1–v3 omit newer fields; migrate legacy workspace-level crossPaneVisibility to all panes; else depot-only fallback.

```
PARSE_SNAPSHOT_FROM_MESH(mesh):
  IF valid JSON in description THEN
    version := snapshot.version
    sharedSort := PARSE_SHARED_SORT(version, raw.sharedSort)
    fileColumns := IF version >= 4 AND raw.fileColumns THEN normalizeFileColumns(raw.fileColumns, DEFAULT_FILE_COLUMNS) ELSE undefined
  FOR each pane WHEN version >= 5:
    crossPaneVisibilityId := pane.crossPaneVisibilityId when present
    crossPaneVisibility := normalizeCrossPaneVisibility(pane.crossPaneVisibility) when present
  IF version >= 5 AND legacy raw.crossPaneVisibility THEN migrate to each pane
    RETURN snapshot with NORMALIZE_LAYOUT(layout), sharedSort, optional fileColumns, per-pane visibility fields
  IF mesh.depots non-empty THEN RETURN depot-only defaults
  RETURN null
```

## SNAPSHOT_V5_CROSS_PANE_VISIBILITY
# [IMPL-WORKSPACE_MESH_BRIDGE] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-WORKSPACE_MESH_BRIDGE] [ARCH-CROSS_PANE_VISIBILITY] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-CROSS_PANE_VISIBILITY]
# how: captureWorkspaceSnapshot v5 includes per-pane crossPaneVisibilityId and inline crossPaneVisibility when draft dirty; parse accepts v1–v5; WORKSPACE_SNAPSHOT_SUMMARY shows crossPaneVisibilityLabel

```
SNAPSHOT_V5_CROSS_PANE_VISIBILITY:
  WORKSPACE_SNAPSHOT_VERSION := 5
  ON capture FOR each pane APPLY INLINE_SNAPSHOT_WHEN_DIRTY
  ON parse WHEN version >= 5 READ crossPaneVisibilityId and crossPaneVisibility per pane
  ON parse legacy workspace crossPaneVisibility MIGRATE to all panes
  ON summary formatPaneCrossPaneVisibilitySummary -> crossPaneVisibilityLabel
```

## SNAPSHOT_V4_FILE_COLUMNS
# [IMPL-WORKSPACE_MESH_BRIDGE] [IMPL-FILE_COLUMN_CONFIG] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]
# how: validateWorkspaceSnapshot accepts v1–v4; diffWorkspaceSnapshots compares formatFileColumnsLabel for fileColumns field

```
SNAPSHOT_V4_FILE_COLUMNS:
  WORKSPACE_SNAPSHOT_VERSION := 4
  ON diff saved vs current WHEN fileColumns labels differ EMIT change field fileColumns
  ON buildWorkspaceRestoreBundle INCLUDE fileColumns in restoreUi when present on parsed snapshot
```

## APPLY_MAX_PANES_LIMIT
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MULTI_PANE_LAYOUT]
# how: Slice snapshot.panes to layout.maxPanes; clamp focusIndex; surface restoreWarning when truncated.

```
APPLY_MAX_PANES_LIMIT(snapshot, maxPanes):
  IF maxPanes > 0 AND panes.length > maxPanes THEN
    truncated = true
    snapshot = slice panes, clamp focusIndex
  RETURN { snapshot, truncated }
```

## APPEND_SNAPSHOT_LAYOUT_WARNINGS
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MULTI_PANE_LAYOUT]
# how: Detect Tile layout fallbacks from mesh description; append layout-specific restoreWarning without duplicating maxPanes text.

```
APPEND_SNAPSHOT_LAYOUT_WARNINGS(limited, description, existingWarning):
  INPUT: limited WorkspaceSnapshot, description string, existingWarning string|null
  OUTPUT: restoreWarning string|null
  restoreWarning = existingWarning
  IF limited.layout is Tile AND description non-empty AND description lacks "layout": field THEN
    append Layout was not stored in this mesh snapshot; using Tile. Save the workspace again to preserve layout.
  ELSE IF limited.layout is Tile AND description contains "{" AND lacks workspaceSnapshot THEN
    append Workspace snapshot JSON could not be read; using Tile layout. Save the workspace again.
  RETURN restoreWarning
```

## PARSE_SHARED_SORT
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-FILE_SORTING_ADVANCED]
# how: v3 snapshots persist sharedSort; v1/v2 omit field and default to DEFAULT_PANE_SORT on validate.

```
PARSE_SHARED_SORT(snapshotVersion, rawSharedSort):
  INPUT: snapshot version number, sharedSort object from JSON or undefined
  OUTPUT: PaneSortSettings normalized to valid criterion/direction/dirsFirst
  IF snapshotVersion >= 3 AND rawSharedSort present THEN RETURN parseSharedSort(rawSharedSort)
  RETURN copy of DEFAULT_PANE_SORT
```

## BUILD_WORKSPACE_RESTORE_BUNDLE
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-FILE_MANAGER_PAGE]
# how: **Workspace restore bundle** — hydrate initialPanes by listing each **Workspace snapshot** pane path; build restoreLayout, restoreUi, restorePaneMeta from limited snapshot (docs/mesh-platform-vocabulary.md, docs/workspace-pane-vocabulary.md).

```
BUILD_WORKSPACE_RESTORE_BUNDLE(limited, listDir):
  INPUT: limited WorkspaceSnapshot, listDir(path) -> FileStat[]
  OUTPUT: WorkspaceRestoreBundle { initialPanes, restoreLayout, restoreUi, restorePaneMeta, snapshot }
  FOR each pane IN limited.panes:
    files = listDir(pane.path)
    sortedFiles = sortFiles(files, pane.sortBy, pane.sortDirection, pane.sortDirsFirst)
    initialPanes.push({ path: pane.path, files: sortedFiles })
  restoreLayout = NORMALIZE_LAYOUT(limited.layout) ?? Tile
  restoreUi = { layout: restoreLayout, focusIndex, linkedMode, comparisonMode, sharedSort: limited.sharedSort }
  restorePaneMeta = map pane sort/cursor fields
  RETURN bundle with snapshot = limited
```

## LIST_DIRECTORY_VIA_FILES_API
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-FILE_MANAGER_PAGE]
# how: Client-only listDir for RESTORE_LAYOUT_IN_WORKSPACE_VIEW when meshRestorePending; GET /api/files?path= encoded path.

```
LIST_DIRECTORY_VIA_FILES_API(path):
  INPUT: path string
  OUTPUT: FileStat[]
  response = FETCH GET /api/files?path={encodeURIComponent(path)}
  IF NOT response.ok THEN THROW Failed to list directory
  RETURN JSON array of FileStat
```

## RESTORE_ON_FILES_PAGE
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-FILE_MANAGER_PAGE]
# how: export dynamic force-dynamic; searchParams.meshId → getMesh → APPLY_MAX_PANES_LIMIT → listDirectory per path → restoreLayout via NORMALIZE_LAYOUT; layout restoreWarning when JSON lacks layout or is unreadable; pass meshId + key remount to WorkspaceView; restoredFromMesh skips paneN URL hydration.

```
RESTORE_ON_FILES_PAGE(meshId):
  EXPORT dynamic = force-dynamic
  restoredFromMesh = false
  IF meshId missing THEN skip restore
  record = getMesh(meshId)
  IF record missing THEN
    restoreWarning = Mesh not found on server; MESH_DATA_DIR shared across processes
    restoredFromMesh = false
  ELSE
    loadedMeshName = record.mesh.name
    parsed = PARSE_SNAPSHOT_FROM_MESH(record.mesh)
    IF parsed missing THEN
      restoreWarning = snapshot unreadable; pane layout may use defaults
    ELSE
      { snapshot: limited, truncated } = APPLY_MAX_PANES_LIMIT(parsed, layout.maxPanes)
      IF truncated THEN append restoreWarning maxPanes message
      restoreWarning = APPEND_SNAPSHOT_LAYOUT_WARNINGS(limited, record.mesh.description, restoreWarning)
      bundle = BUILD_WORKSPACE_RESTORE_BUNDLE(limited, listDirectory)
      initialPanes = bundle.initialPanes
      restoreLayout, restoreUi, restorePaneMeta, loadedSnapshot from bundle
      restoredFromMesh = true
  meshRestorePending = meshId present AND NOT restoredFromMesh
  IF initialPanes empty AND NOT meshRestorePending THEN default startup panes from config
  PASS meshId, key={meshId ?? files-workspace}, meshRestorePending, restoreUi, restoreLayout, restorePaneMeta, restoredFromMesh, restoreWarning to WorkspaceView
```

## RESTORE_LAYOUT_IN_WORKSPACE_VIEW
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MULTI_PANE_LAYOUT]
# how: resolveInitialWorkspaceLayout for useState init; useEffect sync restoreLayout and restoreUi; client fetch /api/mesh/:meshId once (meshRehydratedRef); full snapshot apply when meshRestorePending; layout-only when server restored; DEBUG traces on rehydrate path.

```
resolveInitialWorkspaceLayout(restoredFromMesh, restoreLayout, restoreUi, layoutConfig):
  fromRestore = NORMALIZE_LAYOUT(restoreLayout) ?? NORMALIZE_LAYOUT(restoreUi.layout)
  IF fromRestore THEN RETURN fromRestore
  IF restoredFromMesh THEN RETURN Tile
  RETURN NORMALIZE_LAYOUT(layoutConfig.default) ?? Tile

RESTORE_LAYOUT_IN_WORKSPACE_VIEW(meshId, meshRestorePending, restoreLayout, restoreUi, restoredFromMesh, layoutConfig):
  layoutState = resolveInitialWorkspaceLayout(...)
  useState layout = layoutState
  meshRehydrating = meshRestorePending initially
  clientRestoredFromMesh = false
  useEffect WHEN restoreLayout prop changes THEN setLayout(NORMALIZE_LAYOUT(restoreLayout))
  useEffect WHEN restoredFromMesh AND restoreUi THEN sync focusIndex, linkedMode, comparisonMode, sharedSort
  IF meshId present AND NOT meshRehydratedRef THEN
    meshRehydratedRef = true
    FETCH /api/mesh/{meshId}
    parsed = PARSE_SNAPSHOT_FROM_MESH(response.mesh)
    { snapshot: limited, truncated } = APPLY_MAX_PANES_LIMIT(parsed, maxPanes)
    clientRestoreWarning = APPEND_SNAPSHOT_LAYOUT_WARNINGS(limited, mesh.description, restoreWarning prop)
    IF meshRestorePending THEN
      bundle = BUILD_WORKSPACE_RESTORE_BUNDLE(limited, listDirectoryViaFilesApi)
      setPanes, setLayout, setFocusIndex, setLinkedMode, setComparisonMode, setSavedSnapshot from bundle
      setEffectiveRestoreWarning(clientRestoreWarning)
      clientRestoredFromMesh = true
      meshRehydrating = false
    ELSE
      setSavedSnapshot(limited)
      IF NOT restoreLayout AND NOT restoreUi.layout THEN setLayout from limited
      meshRehydrating = false
    ON fetch failure AND meshRestorePending THEN bootstrap default panes via GET /api/files; meshRehydrating = false
  WORKSPACE_HEADER_STATUS: red error only when restoreWarning AND NOT restoredFromMesh AND NOT clientRestoredFromMesh AND NOT meshRehydrating; amber when restoredFromMesh OR clientRestoredFromMesh
  workspace-restore-pending while meshRehydrating
  calculateLayout uses layout for pane bounds (Tile, OneRow, OneColumn, Fullscreen)
  layout toolbar picker (view.layout) reflects layoutState; header layout select removed
```

## FORMAT_PANE_SORT_SETTINGS
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-FILE_SORTING_ADVANCED]
# how: Human-readable pane or shared sort label for mesh detail summary and DIFF_SAVED_VS_CURRENT sharedSort rows.

```
FORMAT_PANE_SORT_SETTINGS(settings):
  RETURN "{sortBy} {sortDirection}" plus " dirs-first" when sortDirsFirst
```

## FORMAT_DISPLAY_SPEC_LABEL
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-PANE_DISPLAY_FILTER]
# how: Label snapshot displaySpecId for mesh detail; optional resolver maps catalog id to name, else id, else "(none)".

```
FORMAT_DISPLAY_SPEC_LABEL(displaySpecId, resolve):
  IF no id THEN "(none)" ELSE resolve(id) OR id
```

## WORKSPACE_SNAPSHOT_SUMMARY
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI] [REQ-FILE_SORTING_ADVANCED] [REQ-PANE_DISPLAY_FILTER] [REQ-CROSS_PANE_VISIBILITY] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [IMPL-FILE_COLUMN_CONFIG]
# how: Derive layout/focus/linked/comparison/panePaths plus note, save time, shared sort, file columns label, and per-pane sort/display filter/compare filter labels for mesh detail UI.

```
WORKSPACE_SNAPSHOT_SUMMARY(snapshot, options):
  note = extractNotePrefixFromDescription(options.description)
  mostRecentSaveTime = options.updatedAt
  sharedSortLabel = FORMAT_PANE_SORT_SETTINGS(snapshot.sharedSort)
  fileColumnsLabel = IF snapshot.fileColumns?.length THEN formatFileColumnsLabel(snapshot.fileColumns) ELSE undefined
  FOR each pane IN snapshot.panes:
    pane.sortLabel = FORMAT_PANE_SORT_SETTINGS(pane sort fields)
    pane.displayFilterLabel = FORMAT_DISPLAY_SPEC_LABEL(pane.displaySpecId, options.resolveDisplaySpecName)
    pane.crossPaneVisibilityLabel = formatPaneCrossPaneVisibilitySummary(pane)
  RETURN { layout, focusIndex, linkedMode, comparisonMode, panePaths[], note, mostRecentSaveTime, sharedSortLabel, fileColumnsLabel, panes[] }
```

## WORKSPACE_SNAPSHOT_SUMMARY_LIST
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI] [REQ-CROSS_PANE_VISIBILITY]
# how: Render workspace-snapshot-summary list; per-pane nested items include Sort, Display filter, and Compare filter (crossPaneVisibilityLabel); omit workspace-level Compare filters aggregate line.

```
WORKSPACE_SNAPSHOT_SUMMARY_LIST(summary):
  RENDER note, save time, layout, focus, linked, comparison, shared sort, file columns
  FOR each pane: RENDER path, sortLabel, displayFilterLabel, Compare filter: crossPaneVisibilityLabel
```

## MESH_DETAIL_RESTORE_LINK
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI] [IMPL-EXTERNAL_LINKS] [REQ-NAVIGATION_LINKS]
# how: When mesh has depots, render Open in File Manager NewTabLink to /files?meshId= (target=_blank, rel, a11y); workspace-snapshot tag shows summary via WorkspaceSnapshotSummaryList.

```
MESH_DETAIL_RESTORE_LINK(meshId, mesh):
  IF mesh.depots.length > 0 THEN
    RENDER NewTabLink href=/files?meshId={meshId} testid=open-workspace-from-mesh target=_blank rel=noopener noreferrer aria-label disclosure
  IF tag workspace-snapshot AND parsed snapshot THEN
    summary = WORKSPACE_SNAPSHOT_SUMMARY(parsed, { description: mesh.description, updatedAt: mesh.updatedAt, resolveDisplaySpecName from getDisplaySpecStore })
    RENDER WorkspaceSnapshotSummaryList inside section testid=workspace-snapshot-summary
```

## WORKSPACE_HEADER_MESH_LINK
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-EXTERNAL_LINKS] [REQ-NAVIGATION_LINKS]
# how: Workspace header nav renders Mesh Sync NewTabLink — /mesh when no meshId, /mesh/{meshId} when meshId prop set.

```
WORKSPACE_HEADER_MESH_LINK(meshId):
  href = meshId ? /mesh/{meshId} : /mesh
  RENDER nav testid=workspace-cross-surface-nav
  RENDER NewTabLink href testid=open-mesh-from-workspace label=Mesh Sync target=_blank rel=noopener noreferrer aria-label disclosure
```

## STORE_FROM_WORKSPACE_UI
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI] [REQ-TOOLBAR_SYSTEM]
# how: mesh.saveWorkspace opens dialog; update mode PUT /api/mesh/:id/workspace or create POST /api/mesh.

```
STORE_FROM_WORKSPACE_UI(meshId?, loadedMeshName?):
  snapshot = CAPTURE_SNAPSHOT(current)
  # [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_CRUD]
  # how: update path — PUT workspace, set saved baseline to captured snapshot, stay on /files?meshId=
  IF dialog mode is update AND meshId THEN
    PUT /api/mesh/{meshId}/workspace { name?, note?, snapshot }
    setSavedSnapshot(snapshot)  // exact captured baseline; clears diff badge
    skipPropBaselineSyncRef = true  // router.replace may deliver stale loadedSnapshot prop
    router.replace /files?meshId=
  # [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI]
  # how: create path — POST new mesh then navigate to mesh detail
  ELSE
    POST /api/mesh BUILD_MESH_PAYLOAD(name, snapshot, note)
    NAVIGATE /mesh/:id
```

## SHOW_LOADED_WORKSPACE_NAME
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-FILE_MANAGER_PAGE]
# how: FilesPage passes loadedMeshName + loadedSnapshot; compact header status row shows Workspace: {name}; no redundant success line when name is shown.

```
SHOW_LOADED_WORKSPACE_NAME(meshId, record):
  IF meshId AND record THEN PASS loadedMeshName, loadedSnapshot to WorkspaceView
  RENDER data-testid=workspace-loaded-name with mesh name (copy.workspaceMesh.loadedLabel)
  # how: omit redundant green Loaded workspace "{name}" when loadedMeshName is already shown in status row.
  DO NOT render Loaded workspace "{name}" success when loadedMeshName is set
```

## WORKSPACE_HEADER_STATUS
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-FILE_MANAGER_PAGE]
# how: **Workspace header status row** (`workspace-header-status`) — groups **Loaded workspace name**, **Workspace restore pending/warning/error** chrome below title (docs/workspace-pane-vocabulary.md).

```
WORKSPACE_HEADER_STATUS(loadedMeshName, restoreWarning, restoredFromMesh, clientRestoredFromMesh, meshRehydrating):
  IF loadedMeshName OR restoreWarning OR meshRehydrating OR (restoredFromMesh AND NOT loadedMeshName AND NOT restoreWarning) THEN
    RENDER workspace-header-status
    IF meshRehydrating THEN workspace-restore-pending
    # how: amber when server partial restore OR client recovered after server miss.
    IF restoreWarning AND (restoredFromMesh OR clientRestoredFromMesh) THEN workspace-restore-warning (amber)
    # how: when clientRestoredFromMesh and NOT restoredFromMesh prefix Workspace restored via API (server bootstrap missed mesh data).
    # how: red only while server failed and client has not recovered and not still rehydrating.
    IF restoreWarning AND NOT restoredFromMesh AND NOT clientRestoredFromMesh AND NOT meshRehydrating THEN workspace-restore-error (red)
    IF restoredFromMesh AND NOT restoreWarning AND NOT loadedMeshName THEN workspace-restored-from-mesh (fallback only)
```

## UPDATE_EXISTING_WORKSPACE
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_CRUD]
# how: buildMeshPatchPayload + planDepotSync; PUT route applies metadata then depot ops in order.

```
UPDATE_EXISTING_WORKSPACE(meshId, snapshot, note?, name?):
  patch = buildMeshPatchPayload(snapshot, note, existingDescription)
  updateMeshMetadata(meshId, patch)
  # [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_CRUD]
  # how: planDepotSync aligns depot roots/names with snapshot pane paths (update, add, remove)
  FOR op IN planDepotSync(depots, snapshot.panes) APPLY update|add|remove
  RETURN updated mesh DTO
```

## DIFF_SAVED_VS_CURRENT
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-TOOLBAR_SYSTEM]
# how: diffWorkspaceSnapshots(savedSnapshot, current); mesh.diffWorkspace opens WorkspaceDiffDialog.

```
DIFF_SAVED_VS_CURRENT(savedSnapshot, current):
  changes = diffWorkspaceSnapshots(saved, current)  // includes layout, focus, linked, comparison, sharedSort, pane fields
  RENDER WorkspaceDiffDialog with field / saved / current rows or no-differences message
  DISABLE action WHEN NOT meshId OR NOT savedSnapshot
```
