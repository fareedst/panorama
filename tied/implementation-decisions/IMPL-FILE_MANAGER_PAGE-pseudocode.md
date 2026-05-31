# IMPL-FILE_MANAGER_PAGE essence pseudocode

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: Server page loads config and directory data, optional mesh restore, renders WorkspaceView

## Summary contract

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: bound module inputs, outputs, and shared data for all runtime blocks below

```
CONTRACT Summary
  INPUT: searchParams.meshId?; getFilesConfig(); listDirectory; mesh runtime when meshId set
  OUTPUT: WorkspaceView props — initialPanes, keybindings, copy, layout, columns, toolbars, restore* fields
  DATA: PaneInitialState { path, files }; WorkspaceSnapshot; RestoreUiState; LayoutType
  CONTROL: export dynamic = "force-dynamic" — per-request meshId restore
```

## FilesPageServerComponent

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: how: src/app/files/page.tsx default async FilesPage server component

```
PROCEDURE FilesPageServerComponent(context)
  AWAIT searchParams
  LOAD config := getFilesConfig()
  EXTRACT keybindings, copy, layout, startup, columns, toolbars from config
  INITIALIZE initialPanes := []
  INITIALIZE restoreUi, restoreLayout, restorePaneMeta, restoredFromMesh, restoreWarning, loadedMeshName, loadedSnapshot
```

## MeshRestoreBranch

// [IMPL-FILE_MANAGER_PAGE] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: how: meshId query restores snapshot before default startup panes

```
PROCEDURE MeshRestoreBranch(context)
  IF meshId absent THEN SKIP mesh branch
  LOAD record := getRuntime().meshService.getMesh(meshId)
  IF record missing THEN SET restoreWarning mesh not found; LEAVE initialPanes empty
  IF record present THEN
    SET loadedMeshName := record.mesh.name
    PARSE snapshot := parseWorkspaceSnapshotFromMesh(record.mesh)
    IF snapshot invalid THEN SET restoreWarning snapshot unreadable
    IF snapshot valid THEN
      APPLY applyMaxPanesLimit(snapshot, layout.maxPanes)
      IF truncated THEN APPEND restoreWarning maxPanes limit message
      MERGE restoreWarning := appendSnapshotLayoutWarnings(limited, description, restoreWarning)
      BUILD bundle := await buildWorkspaceRestoreBundle(limited, listDirectory)
      PUSH bundle.initialPanes into initialPanes
      SET restoreLayout, restoreUi, restorePaneMeta, loadedSnapshot from bundle
      SET restoredFromMesh := true
  SET meshRestorePending := meshId present AND NOT restoredFromMesh
```

## DefaultStartupPanes

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE] [REQ-MULTI_PANE_LAYOUT]: how: home or configured paths per pane when no mesh hydration

```
PROCEDURE DefaultStartupPanes(context)
  IF initialPanes.length > 0 OR meshRestorePending THEN SKIP default startup
  SET homeDir := getUserHomeDirectory()
  SET paneCount := layout.defaultPaneCount OR 1
  FOR i IN 0 .. paneCount-1
    SET panePath := homeDir
    IF startup.mode = "configured" AND startup.paths.pane{i+1} THEN
      RESOLVE panePath from ~ prefix against homeDir OR use absolute path
    LOAD files := await listDirectory(panePath)
    SORT sortedFiles := sortFilesData(files, "Name", true)
    PUSH { path: panePath, files: sortedFiles } into initialPanes
```

## SinglePaneWorkspaceUrl

// [IMPL-FILE_MANAGER_PAGE] [ARCH-PANE_LIFECYCLE] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how — when searchParams.panes equals "1" and pane0 present without meshId, bootstrap exactly one pane at pane0 path instead of defaultPaneCount loop

```
PROCEDURE SinglePaneWorkspaceUrl(context)
  IF meshId OR initialPanes.length > 0 OR meshRestorePending THEN RETURN
  IF searchParams.panes equals "1" AND searchParams.pane0
    SET panePath := decode pane0
    LOAD files := await listDirectory(panePath)
    SORT sortedFiles := sortFilesData(files, "Name", true)
    SET initialPanes := [{ path: panePath, files: sortedFiles }]
    RETURN skip default multi-pane startup
```

## PassPropsToWorkspaceView

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: how: render client WorkspaceView with config and restore props

```
PROCEDURE PassPropsToWorkspaceView(context)
  RENDER WorkspaceView
    key := meshId OR "files-workspace"
    meshId, initialPanes, keybindings, copy, layout, columns, toolbars
    restoreUi, restoreLayout, restorePaneMeta, restoredFromMesh, restoreWarning
    loadedMeshName, loadedSnapshot, meshRestorePending
```

## RootRedirect

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: how: src/app/page.tsx redirects / to /files

```
PROCEDURE RootRedirect(context)
  ON GET / REDIRECT to /files (file manager entry)
```

## CodeLocations

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: map implementing and verifying source files for this IMPL

```
// FILE: src/app/files/page.tsx — FilesPage server component
// FILE: src/app/page.tsx — root redirect to file manager
// FILE: src/test/integration/app.test.tsx — root redirect test [IMPL-FILE_MANAGER_PAGE]
```

## ErrorHandling

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: how: mesh/snapshot failures degrade with restoreWarning; default panes still load when mesh absent

```
PROCEDURE IMPL-FILE_MANAGER_PAGE_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ON mesh restore failure THEN EMIT restoreWarning; DO NOT throw from page render
  ON listDirectory failure THEN propagate to Next error boundary
```
