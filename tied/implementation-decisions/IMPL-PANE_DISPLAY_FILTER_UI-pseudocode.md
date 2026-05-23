# IMPL-PANE_DISPLAY_FILTER_UI essence pseudocode

## SET_ACTIVE_SPEC
# [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: User selects no filter or catalog spec; sync spec to server; refetch listing and buildPaneFromRawListing.

```
SET_ACTIVE_SPEC(paneIndex, specId):
  INPUT: paneIndex number, specId uuid|null
  OUTPUT: updated pane state
  pane.activeDisplaySpecId := specId
  IF specId THEN ensureDisplaySpecOnServer(store.get(specId))
  listing := FETCH_DIRECTORY_LISTING(pane.path, specId)
  pane := buildPaneFromRawListing(listing, pane, store, { preserveMarks: false on spec change })
  pushRecentSpec(specId)
  RETURN pane
```

## REFRESH_PANES_USING_SPEC
# [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]
# how: On spec version change, re-apply filter to every pane with matching activeDisplaySpecId.

```
REFRESH_PANES_USING_SPEC(specId, store):
  INPUT: specId, DisplaySpecStore
  OUTPUT: panes[] updated for all indices where activeDisplaySpecId = specId
  FOR each paneIndex WHERE panes[paneIndex].activeDisplaySpecId = specId
    ensureDisplaySpecOnServer(store.get(specId))
    listing := FETCH_DIRECTORY_LISTING(pane.path, specId)
    panes[paneIndex] := buildPaneFromRawListing(listing.files, panes[paneIndex], store, { preserveMarks: true, serverPreFiltered, hiddenCount })
    RESTORE cursor from directory history when possible
```

## BUILD_PANE_FROM_RAW_LISTING
# [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
# how: Client-side filter when server did not pre-filter; sort visible files; reconcile marks when preserveMarks.

```
BUILD_PANE_FROM_RAW_LISTING(rawFiles, pane, store, options):
  INPUT: rawFiles, pane with activeDisplaySpecId, store, { preserveMarks?, serverPreFiltered?, hiddenCount? }
  OUTPUT: pane with files, hiddenCount, loadedSpecVersion
  IF NOT serverPreFiltered THEN APPLY_PANE_LISTING(rawFiles, getActiveSpec(store, pane.activeDisplaySpecId))
  SORT visible files per pane sort settings
  IF preserveMarks THEN RECONCILE_PANE_SELECTION ELSE clear marks
  SET loadedSpecVersion := active spec.version
  RETURN pane
```

## MANAGER_DIALOG_CRUD
# [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: DisplaySpecManagerDialog create/save/rename/duplicate/delete; show validation errors; warn panesUsingSpec on delete.

```
MANAGER_DIALOG_CRUD(store, draft):
  INPUT: draft spec fields, selected catalog id
  ON save: store.update OR store.create; close on success; errors from validateSpec
  ON duplicate: store.duplicate(id, newName)
  ON delete: store.delete(id); panesUsingSpec count > 0 shows warning
  WHILE dialog open: subscribe updated -> REFRESH_PANES_USING_SPEC(spec.id)
```

## SPEC_DELETED_FALLBACK
# [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]
# how: Catalog delete event clears activeDisplaySpecId on affected panes; show notice banner.

```
SPEC_DELETED_FALLBACK(event):
  INPUT: { type: "deleted", specId }
  FOR each pane WHERE pane.activeDisplaySpecId = specId
    pane.activeDisplaySpecId := null
    pane.hiddenCount := 0
    pane.loadedSpecVersion := null
  SET specDeletedNotice user message
```

## KEYBIND_VIEW_DISPLAY_SPEC
# [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-TOOLBAR_SYSTEM] [REQ-PANE_DISPLAY_FILTER]
# how: view.displaySpec opens manager; view.displaySpec.none clears active spec on focused pane.

```
KEYBIND_VIEW_DISPLAY_SPEC(action, focusIndex):
  IF action = view.displaySpec THEN open DisplaySpecManagerDialog
  IF action = view.displaySpec.none THEN SET_ACTIVE_SPEC(focusIndex, null)
```

## PANE_HEADER_SELECTOR
# [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]
# how: FilePane shows DisplaySpecSelector dropdown and Filter: {name} indicator when active.

```
PANE_HEADER_SELECTOR(pane, catalog):
  RENDER DisplaySpecSelector with activeDisplaySpecId, catalog, onChange -> SET_ACTIVE_SPEC
  IF active spec THEN show label Filter: {spec.name} and optional Hidden: N from hiddenCount
```
