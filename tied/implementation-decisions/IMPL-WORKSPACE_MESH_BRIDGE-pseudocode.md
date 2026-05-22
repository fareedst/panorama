# IMPL-WORKSPACE_MESH_BRIDGE essence pseudocode

## CAPTURE_SNAPSHOT
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MULTI_PANE_LAYOUT]
# how: Copy layout, focus, linked, comparison, and per-pane path/sort/cursor into WorkspaceSnapshot v1.

```
CAPTURE_SNAPSHOT(workspaceState):
  RETURN { version: 1, layout, focusIndex, linkedMode, comparisonMode, panes[] }
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
  IF valid JSON in description THEN RETURN snapshot
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
# how: searchParams.meshId → getMesh → APPLY_MAX_PANES_LIMIT → listDirectory per path → pass restoreUi to WorkspaceView; restoredFromMesh skips paneN URL hydration.

```
RESTORE_ON_FILES_PAGE(meshId):
  snapshot = PARSE_SNAPSHOT_FROM_MESH(mesh)
  { snapshot, truncated } = APPLY_MAX_PANES_LIMIT(snapshot, layout.maxPanes)
  IF truncated THEN restoreWarning = user message
  initialPanes = listDirectory for each snapshot.panes[].path
  PASS restoreUi, restorePaneMeta, restoredFromMesh to WorkspaceView
```

## WORKSPACE_SNAPSHOT_SUMMARY
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI]
# how: Derive layout/focus/linked/comparison/panePaths from parsed snapshot for mesh detail UI.

```
WORKSPACE_SNAPSHOT_SUMMARY(snapshot):
  RETURN { layout, focusIndex, linkedMode, comparisonMode, panePaths[] }
```

## MESH_DETAIL_RESTORE_LINK
# [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_GUI]
# how: When mesh has depots, render Open in File Manager link to /files?meshId=; workspace-snapshot tag shows summary section.

```
MESH_DETAIL_RESTORE_LINK(meshId, mesh):
  IF mesh.depots.length > 0 THEN
    RENDER link href=/files?meshId={meshId} testid=open-workspace-from-mesh
  IF tag workspace-snapshot AND parsed snapshot THEN
    RENDER summary testid=workspace-snapshot-summary from WORKSPACE_SNAPSHOT_SUMMARY
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
