# IMPL-PANE_DISPLAY_FILTER_UI essence pseudocode

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: Pane display filter UI — per-pane spec selector, manager dialog CRUD, WorkspaceView integration, catalog delete fallback

## Summary contract

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-PANE_DISPLAY_FILTER_UI_Summary():
  INPUT: displaySpecStore catalog, panes[].activeDisplaySpecId, pane paths
  OUTPUT: filtered visible file listings per pane; manager dialog for spec CRUD
  DATA: fetchDirectoryListing, buildPaneFromRawListing, catalogSpecs, specDeletedNotice
  PRE: display spec store and pane state available
  POST: per-pane filtered listings and manager CRUD applied
  EFFECTS: State, IO
  CONTROL: server may pre-filter when displaySpecId query param set
  TERMINATION: total
```

## SET_ACTIVE_SPEC

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: user selects no filter or catalog spec; sync spec to server; refetch listing and buildPaneFromRawListing with preserveMarks false

```
IMPL-PANE_DISPLAY_FILTER_UI_SetActiveSpec(paneIndex, specId):
  INPUT: paneIndex, specId uuid or null
  OUTPUT: updated pane with activeDisplaySpecId, files, hiddenCount, loadedSpecVersion
  DATA: handleSetActiveDisplaySpec in WorkspaceView
  PRE: paneIndex valid; specId may reference catalog entry
  POST: pane refetched with active spec; marks cleared unless preserveMarks path
  EFFECTS: State, IO
  TERMINATION: total
  IF specId AND store.get(specId) missing THEN set specDeletedNotice AND specId := null
  CALL pushRecentSpec(specId)
  SET panes[paneIndex].activeDisplaySpecId := specId
  IF specId THEN ensureDisplaySpecOnServer(store.get(specId))
  FETCH listing := fetchDirectoryListing(pane.path, specId)
  SET panes[paneIndex] := buildPaneFromRawListing(listing.files, pane, store, { preserveMarks: false, serverPreFiltered, hiddenCount, totalCount })
  MERGE cross-pane visibility fields unchanged
```

## REFRESH_PANES_USING_SPEC

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]: how: on spec version change while manager open, re-list every pane with matching activeDisplaySpecId preserving marks

```
IMPL-PANE_DISPLAY_FILTER_UI_RefreshPanesUsingSpec(specId):
  INPUT: specId, displaySpecStore, panes[]
  OUTPUT: panes updated for all indices where activeDisplaySpecId equals specId
  DATA: refreshPanesUsingSpec; store subscribe while displaySpecManagerOpen
  PRE: specId identifies active catalog spec
  POST: all panes using spec refreshed with preserveMarks true
  EFFECTS: State, IO
  TERMINATION: total
  FOR each paneIndex WHERE panes[paneIndex].activeDisplaySpecId equals specId
    ensureDisplaySpecOnServer(store.get(specId))
    FETCH listing for pane.path with specId
    BUILD pane via buildPaneFromRawListing with preserveMarks true, serverPreFiltered, hiddenCount
    RESTORE cursor from globalDirectoryHistory.restoreCursorPosition
```

## BUILD_PANE_FROM_RAW_LISTING

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]: how: client-side filter when server did not pre-filter; sort visible files; reconcile or clear marks per preserveMarks flag

```
IMPL-PANE_DISPLAY_FILTER_UI_BuildPaneFromRawListing(rawFiles, pane, store, options):
  INPUT: rawFiles, pane with activeDisplaySpecId, store, options { preserveMarks?, serverPreFiltered?, hiddenCount?, totalCount? }
  OUTPUT: pane with files, hiddenCount, rawFileCount, loadedSpecVersion
  DATA: filterFileStats, sortFiles, reconcilePaneSelection
  PRE: raw listing and pane state available
  POST: filtered sorted files; marks reconciled or cleared per preserveMarks
  EFFECTS: pure
  TERMINATION: total
  IF NOT options.serverPreFiltered THEN APPLY filterFileStats(rawFiles, getActiveSpec(store, pane.activeDisplaySpecId))
  SORT visible files per pane sortBy sortDirection sortDirsFirst
  IF preserveMarks THEN reconcilePaneSelection ELSE clear marks Set
  SET loadedSpecVersion := active spec.version or null
  RETURN updated pane
```

## MANAGER_DIALOG_CRUD

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: DisplaySpecManagerDialog create/save/rename/duplicate/delete; validation errors inline; confirm when spec used by multiple panes

```
IMPL-PANE_DISPLAY_FILTER_UI_ManagerDialogCrud():
  INPUT: draft spec fields, selected catalog id, panesUsingSpec(specId)
  OUTPUT: store mutations; onSaved triggers refresh; onDeleted triggers fallback
  DATA: DisplaySpecRuleEditor for rules array
  PRE: manager dialog open with draft or selected spec
  POST: store mutated; affected panes refreshed or fallback on delete
  EFFECTS: State, IO
  TERMINATION: total
  ON save new CALL store.create; ON validation fail SET errors AND RETURN
  ON save existing IF panesUsingSpec greater than 1 THEN confirm before store.update
  ON duplicate CALL store.duplicate(id, name + " (copy)")
  ON delete confirm THEN store.delete(id) AND onDeleted(specId)
  WHILE manager open subscribe store updated events -> RefreshPanesUsingSpec(spec.id)
```

## SPEC_DELETED_FALLBACK

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: catalog delete event clears activeDisplaySpecId on affected panes and shows notice banner

```
IMPL-PANE_DISPLAY_FILTER_UI_SpecDeletedFallback(event):
  INPUT: store subscribe event { type: deleted, specId }
  OUTPUT: panes with matching activeDisplaySpecId reset; user notice string
  DATA: specDeletedNotice banner in WorkspaceView
  PRE: catalog delete event received
  POST: affected panes reset to No filter; notice banner shown
  EFFECTS: State
  TERMINATION: total
  FOR each pane WHERE activeDisplaySpecId equals event.specId
    SET activeDisplaySpecId := null
    SET hiddenCount := 0
    SET loadedSpecVersion := null
  SET specDeletedNotice := "A display spec was deleted; affected panes now use No filter."
```

## KEYBIND_VIEW_DISPLAY_SPEC

// [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-TOOLBAR_SYSTEM] [REQ-PANE_DISPLAY_FILTER]: how: view.displaySpec opens manager dialog; view.displaySpec.none clears active spec on focused pane

```
IMPL-PANE_DISPLAY_FILTER_UI_KeybindViewDisplaySpec(action, focusIndex):
  INPUT: action view.displaySpec or view.displaySpec.none, focusIndex
  OUTPUT: displaySpecManagerOpen true OR handleSetActiveDisplaySpec(focusIndex, null)
  DATA: paneActionHandlers entries
  PRE: action and focusIndex available
  POST: manager opened OR active spec cleared on focused pane
  EFFECTS: State
  TERMINATION: total
  IF action equals view.displaySpec THEN setDisplaySpecManagerOpen(true)
  IF action equals view.displaySpec.none THEN handleSetActiveDisplaySpec(focusIndex, null)
```

## PANE_HEADER_SELECTOR

// [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]: how: FilePane shows DisplaySpecSelector dropdown; when active spec show Filter label and optional Hidden count from hiddenCount

```
IMPL-PANE_DISPLAY_FILTER_UI_PaneHeaderSelector():
  INPUT: pane activeDisplaySpecId, catalog specs, hiddenCount, onSelect, onManage
  OUTPUT: header dropdown UI with No filter, recent specs, Manage specs option
  DATA: DisplaySpecSelector testid pane-display-spec-selector
  PRE: pane header render with catalog and callbacks
  POST: selector UI with active spec label and optional hidden count
  EFFECTS: IO
  TERMINATION: total
  RENDER DisplaySpecSelector with activeSpecId, specs, recentSpecIds, onSelect, onManage
  IF active spec name provided THEN show "Filter: {name}" and optional "Hidden: N" when hiddenCount greater than zero
```

## CodeLocations

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — handleSetActiveDisplaySpec, refreshPanesUsingSpec, spec delete subscribe, keybind handlers
// FILE: src/lib/pane-display-filter.ts — fetchDirectoryListing, buildPaneFromRawListing
// FILE: src/app/files/components/DisplaySpecSelector.tsx — PANE_HEADER_SELECTOR
// FILE: src/app/files/components/DisplaySpecManagerDialog.tsx — MANAGER_DIALOG_CRUD
// FILE: src/app/files/components/FilePane.tsx — header selector wiring
// TEST: src/lib/pane-display-filter.test.ts
// TEST: src/app/files/components/DisplaySpecSelector.test.tsx
// TEST: src/app/files/components/FilePane.test.tsx — PANE_HEADER_SELECTOR hidden count

## ErrorHandling

// [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]: how: missing spec id on select falls back to No filter with notice; refreshPanesUsingSpec logs fetch errors per pane without corrupting other panes

```
IMPL-PANE_DISPLAY_FILTER_UI_on_error(context, error):
  INPUT: context, error
  OUTPUT: logged diagnostic; pane skipped or spec cleared
  PRE: fetch failure or missing spec
  POST: other panes unchanged; user notified when spec missing
  EFFECTS: pure
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF listing fetch fails for one pane THEN log AND skip that pane index
  IF spec missing from store THEN clear activeDisplaySpecId AND notify user
```
