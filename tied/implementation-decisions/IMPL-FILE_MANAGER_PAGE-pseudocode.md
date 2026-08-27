# IMPL-FILE_MANAGER_PAGE essence pseudocode

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: Server page loads config and directory data, optional mesh restore, renders WorkspaceView

## Summary contract

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-FILE_MANAGER_PAGE_Summary():
  INPUT: searchParams.meshId?; getFilesConfig(); listDirectory; mesh runtime when meshId set
  OUTPUT: WorkspaceView props — initialPanes, keybindings, copy, layout, columns, toolbars, restore* fields
  DATA: PaneInitialState { path, files }; WorkspaceSnapshot; RestoreUiState; LayoutType
  CONTROL: export dynamic = "force-dynamic" — per-request meshId restore
  PRE: FilesPage server component invoked with searchParams
  POST: WorkspaceView receives config props and hydrated initialPanes or restore state
  EFFECTS: IO, State
  TERMINATION: total
```

## FilesPageServerComponent

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: how: src/app/files/page.tsx default async FilesPage server component

```
IMPL-FILE_MANAGER_PAGE_FilesPageServerComponent(context):
  INPUT: searchParams, server filesystem access
  OUTPUT: initialized page state for mesh/default startup branches
  DATA: config from getFilesConfig(); empty initialPanes and restore fields
  PRE: page.tsx server entry active
  POST: config extracted; initialPanes and restore fields initialized
  EFFECTS: IO
  TERMINATION: total
  AWAIT searchParams
  LOAD config := getFilesConfig()
  EXTRACT keybindings, copy, layout, startup, columns, toolbars from config
  INITIALIZE initialPanes := []
  INITIALIZE restoreUi, restoreLayout, restorePaneMeta, restoredFromMesh, restoreWarning, loadedMeshName, loadedSnapshot
```

## MeshRestoreBranch

// [IMPL-FILE_MANAGER_PAGE] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: how: meshId query restores snapshot before default startup panes

```
IMPL-FILE_MANAGER_PAGE_MeshRestoreBranch(context):
  INPUT: meshId search param, mesh runtime, layout.maxPanes
  OUTPUT: restored panes and restore metadata or restoreWarning
  DATA: WorkspaceSnapshot, buildWorkspaceRestoreBundle result
  PRE: meshId present in searchParams when branch runs
  POST: snapshot restored into initialPanes when valid; restoreWarning set on failure
  EFFECTS: IO, State
  DATA_TRANSITION: mesh snapshot hydrates initialPanes and restore* props when valid
  FAILURE_MODES: MESH_NOT_FOUND; SNAPSHOT_UNREADABLE; MAX_PANES_TRUNCATED
  TERMINATION: total
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
IMPL-FILE_MANAGER_PAGE_DefaultStartupPanes(context):
  INPUT: layout.defaultPaneCount, startup.mode, startup.paths, home directory
  OUTPUT: initialPanes populated from configured or home paths
  DATA: sorted file listings per pane path
  PRE: initialPanes empty and mesh restore not pending
  POST: one pane per defaultPaneCount with sorted listings
  EFFECTS: IO
  TERMINATION: total
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
IMPL-FILE_MANAGER_PAGE_SinglePaneWorkspaceUrl(context):
  INPUT: searchParams.panes, searchParams.pane0
  OUTPUT: single initial pane at decoded pane0 path
  DATA: sorted listing for pane0 path
  PRE: panes=1 and pane0 present; no meshId; initialPanes still empty
  POST: initialPanes contains exactly one pane at pane0 path
  EFFECTS: IO
  TERMINATION: total
  IF meshId OR initialPanes.length > 0 OR meshRestorePending THEN RETURN
  IF searchParams.panes equals "1" AND searchParams.pane0
    SET panePath := decode pane0
    LOAD files := await listDirectory(panePath)
    SORT sortedFiles := sortFilesData(files, "Name", true)
    SET initialPanes := [{ path: panePath, files: sortedFiles }]
    RETURN skip default multi-pane startup
```

## MultiPaneDeepLinkUrl

// [IMPL-FILE_MANAGER_PAGE] [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT] [REQ-README_DEMO_AUTOMATION]: how — parsePaneDeepLinkPaths reads consecutive pane0..paneN; server hydrates one pane per path before default startup (independent of layout.defaultPaneCount)

```
IMPL-FILE_MANAGER_PAGE_MultiPaneDeepLinkUrl(context):
  INPUT: consecutive pane0..paneN search params
  OUTPUT: initialPanes with one entry per deep-link path
  DATA: parsePaneDeepLinkPaths result, sorted listings
  PRE: deep-link paths present; no mesh restore or prior initialPanes
  POST: initialPanes hydrated for each deep-link path; default startup skipped
  EFFECTS: IO
  TERMINATION: total
  IF meshId OR initialPanes.length > 0 OR meshRestorePending THEN RETURN
  SET paths := parsePaneDeepLinkPaths(searchParams)
  IF paths.length equals 0 THEN RETURN
  FOR EACH panePath IN paths
    LOAD files := await listDirectory(panePath)
    SORT sortedFiles := sortFilesData(files, "Name", true)
    PUSH { path: panePath, files: sortedFiles } into initialPanes
  RETURN skip default startup
```

## PassPropsToWorkspaceView

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: how: render client WorkspaceView with config and restore props

```
IMPL-FILE_MANAGER_PAGE_PassPropsToWorkspaceView(context):
  INPUT: hydrated initialPanes, config sections, restore props
  OUTPUT: rendered WorkspaceView client tree
  DATA: keybindings, copy, layout, columns, toolbars, restore* fields
  PRE: page bootstrap branches complete
  POST: WorkspaceView receives all config and restore props
  EFFECTS: pure
  TERMINATION: total
  RENDER WorkspaceView
    key := meshId OR "files-workspace"
    meshId, initialPanes, keybindings, copy, layout, columns, toolbars
    restoreUi, restoreLayout, restorePaneMeta, restoredFromMesh, restoreWarning
    loadedMeshName, loadedSnapshot, meshRestorePending
```

## RootRedirect

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: how: src/app/page.tsx redirects / to /files

```
IMPL-FILE_MANAGER_PAGE_RootRedirect(context):
  INPUT: GET /
  OUTPUT: redirect to /files
  PRE: root route invoked
  POST: navigation targets file manager entry
  EFFECTS: Control
  TERMINATION: total
  ON GET / REDIRECT to /files (file manager entry)
```

## CodeLocations

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/page.tsx — FilesPage server component
// FILE: src/app/page.tsx — root redirect to file manager
// FILE: src/app/files/page.single-pane-url.test.tsx — SinglePaneWorkspaceUrl bootstrap
// FILE: src/app/files/page.mesh-restore.test.tsx — mesh restore branch
// FILE: src/test/integration/app.test.tsx — root redirect test [IMPL-FILE_MANAGER_PAGE]

## ErrorHandling

// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: how: mesh/snapshot failures degrade with restoreWarning; default panes still load when mesh absent

```
IMPL-FILE_MANAGER_PAGE_on_error(context, error):
  INPUT: mesh restore or listDirectory failure
  OUTPUT: restoreWarning or propagated page error
  PRE: error during mesh restore or directory listing
  POST: mesh failures emit restoreWarning without throw; listDirectory failures propagate
  EFFECTS: IO
  FAILURE_MODES: MESH_RESTORE_FAILED; LIST_DIRECTORY_FAILED
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ON mesh restore failure THEN EMIT restoreWarning; DO NOT throw from page render
  ON listDirectory failure THEN propagate to Next error boundary
```
