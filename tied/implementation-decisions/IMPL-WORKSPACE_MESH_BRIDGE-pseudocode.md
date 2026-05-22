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
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MULTI_PANE_LAYOUT]
# how: Copy layout, focus, linked, comparison, and per-pane path/sort/cursor into WorkspaceSnapshot v1; layout via NORMALIZE_LAYOUT.

```
CAPTURE_SNAPSHOT(workspaceState):
  RETURN { version: 1, layout: NORMALIZE_LAYOUT(layout) ?? Tile, focusIndex, linkedMode, comparisonMode, panes[] }
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
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_DOMAIN_MODEL]
# how: Parse description JSON (after optional note prefix); else depot-only fallback from mesh.depots roots; null when tag present but invalid JSON and no depots.

```
PARSE_SNAPSHOT_FROM_MESH(mesh):
  IF valid JSON in description THEN RETURN snapshot with NORMALIZE_LAYOUT(layout)
  IF mesh.depots non-empty THEN RETURN depot-only defaults
  RETURN null
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

## RESTORE_ON_FILES_PAGE
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-FILE_MANAGER_PAGE]
# how: export dynamic force-dynamic; searchParams.meshId → getMesh → APPLY_MAX_PANES_LIMIT → listDirectory per path → restoreLayout via NORMALIZE_LAYOUT; layout restoreWarning when JSON lacks layout or is unreadable; pass meshId + key remount to WorkspaceView; restoredFromMesh skips paneN URL hydration.

```
RESTORE_ON_FILES_PAGE(meshId):
  EXPORT dynamic = force-dynamic
  IF meshId missing THEN skip restore
  record = getMesh(meshId)
  IF record missing THEN
    restoreWarning = Mesh not found on server; MESH_DATA_DIR shared across processes
    PASS meshId to WorkspaceView (restoredFromMesh false)
  snapshot = PARSE_SNAPSHOT_FROM_MESH(mesh)
  IF snapshot missing THEN
    restoreWarning = snapshot unreadable; pane layout may use defaults
    PASS meshId
  { snapshot, truncated } = APPLY_MAX_PANES_LIMIT(snapshot, layout.maxPanes)
  IF truncated THEN append restoreWarning maxPanes message
  IF snapshot.layout is Tile AND description lacks layout field THEN append layout not stored warning
  IF snapshot.layout is Tile AND description JSON invalid THEN append snapshot unreadable layout warning
  initialPanes = listDirectory for each snapshot.panes[].path
  restoreLayout = NORMALIZE_LAYOUT(snapshot.layout) ?? Tile
  restoreUi.layout = restoreLayout
  PASS meshId, key={meshId ?? files-workspace}, restoreUi, restoreLayout, restorePaneMeta, restoredFromMesh, restoreWarning to WorkspaceView
```

## RESTORE_LAYOUT_IN_WORKSPACE_VIEW
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MULTI_PANE_LAYOUT]
# how: resolveInitialWorkspaceLayout for useState init; useEffect sync restoreLayout prop; client fetch /api/mesh/:meshId once (layoutRehydratedRef) when meshId set; DEBUG traces on rehydrate path.

```
resolveInitialWorkspaceLayout(restoredFromMesh, restoreLayout, restoreUi, layoutConfig):
  fromRestore = NORMALIZE_LAYOUT(restoreLayout) ?? NORMALIZE_LAYOUT(restoreUi.layout)
  IF fromRestore THEN RETURN fromRestore
  IF restoredFromMesh THEN RETURN Tile
  RETURN NORMALIZE_LAYOUT(layoutConfig.default) ?? Tile

RESTORE_LAYOUT_IN_WORKSPACE_VIEW(meshId, restoreLayout, restoreUi, restoredFromMesh, layoutConfig):
  layoutState = resolveInitialWorkspaceLayout(...)
  useState layout = layoutState
  useEffect WHEN restoreLayout prop changes THEN setLayout(NORMALIZE_LAYOUT(restoreLayout))
  IF meshId present AND NOT layoutRehydratedRef THEN
    layoutRehydratedRef = true
    FETCH /api/mesh/{meshId}
    parsed = PARSE_SNAPSHOT_FROM_MESH(response.mesh)
    IF parsed.layout THEN setLayout(NORMALIZE_LAYOUT(parsed.layout)) with DEBUG log
  calculateLayout uses layout for pane bounds (Tile, OneRow, OneColumn, Fullscreen)
  workspace-layout-select data-testid reflects layoutState
```

## WORKSPACE_SNAPSHOT_SUMMARY
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI]
# how: Derive layout/focus/linked/comparison/panePaths from parsed snapshot for mesh detail UI.

```
WORKSPACE_SNAPSHOT_SUMMARY(snapshot):
  RETURN { layout, focusIndex, linkedMode, comparisonMode, panePaths[] }
```

## MESH_DETAIL_RESTORE_LINK
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI] [IMPL-EXTERNAL_LINKS] [REQ-NAVIGATION_LINKS]
# how: When mesh has depots, render Open in File Manager NewTabLink to /files?meshId= (target=_blank, rel, a11y); workspace-snapshot tag shows summary section.

```
MESH_DETAIL_RESTORE_LINK(meshId, mesh):
  IF mesh.depots.length > 0 THEN
    RENDER NewTabLink href=/files?meshId={meshId} testid=open-workspace-from-mesh target=_blank rel=noopener noreferrer aria-label disclosure
  IF tag workspace-snapshot AND parsed snapshot THEN
    RENDER summary testid=workspace-snapshot-summary from WORKSPACE_SNAPSHOT_SUMMARY
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
# how: mesh.saveWorkspace opens dialog; POST /api/mesh BUILD_MESH_PAYLOAD; router.push /mesh/:id.

```
STORE_FROM_WORKSPACE_UI():
  snapshot = CAPTURE_SNAPSHOT(current)
  POST /api/mesh BUILD_MESH_PAYLOAD(name, snapshot, note)
  NAVIGATE /mesh/:id
```
