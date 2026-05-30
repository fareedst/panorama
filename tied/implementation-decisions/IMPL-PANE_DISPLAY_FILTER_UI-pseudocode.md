# IMPL-PANE_DISPLAY_FILTER_UI essence pseudocode

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: Pane display filter UI — per-pane spec selector, manager dialog CRUD, WorkspaceView integration, catalog delete fallback

## Summary contract

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: displaySpecStore catalog, panes[].activeDisplaySpecId, pane paths
  OUTPUT: filtered visible file listings per pane; manager dialog for spec CRUD
  DATA: fetchDirectoryListing, buildPaneFromRawListing, catalogSpecs, specDeletedNotice
  CONTROL: server may pre-filter when displaySpecId query param set

## SET_ACTIVE_SPEC

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: user selects no filter or catalog spec; sync spec to server; refetch listing and buildPaneFromRawListing with preserveMarks false

CONTRACT SetActiveSpec
  INPUT: paneIndex, specId uuid or null
  OUTPUT: updated pane with activeDisplaySpecId, files, hiddenCount, loadedSpecVersion
  DATA: handleSetActiveDisplaySpec in WorkspaceView

PROCEDURE IMPL-PANE_DISPLAY_FILTER_UI_SetActiveSpec(paneIndex, specId)
  IF specId AND store.get(specId) missing THEN set specDeletedNotice AND specId := null
  CALL pushRecentSpec(specId)
  SET panes[paneIndex].activeDisplaySpecId := specId
  IF specId THEN ensureDisplaySpecOnServer(store.get(specId))
  FETCH listing := fetchDirectoryListing(pane.path, specId)
  SET panes[paneIndex] := buildPaneFromRawListing(listing.files, pane, store, { preserveMarks: false, serverPreFiltered, hiddenCount, totalCount })
  MERGE cross-pane visibility fields unchanged

## REFRESH_PANES_USING_SPEC

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]: how: on spec version change while manager open, re-list every pane with matching activeDisplaySpecId preserving marks

CONTRACT RefreshPanesUsingSpec
  INPUT: specId, displaySpecStore, panes[]
  OUTPUT: panes updated for all indices where activeDisplaySpecId equals specId
  DATA: refreshPanesUsingSpec; store subscribe while displaySpecManagerOpen

PROCEDURE IMPL-PANE_DISPLAY_FILTER_UI_RefreshPanesUsingSpec(specId)
  FOR each paneIndex WHERE panes[paneIndex].activeDisplaySpecId equals specId
    ensureDisplaySpecOnServer(store.get(specId))
    FETCH listing for pane.path with specId
    BUILD pane via buildPaneFromRawListing with preserveMarks true, serverPreFiltered, hiddenCount
    RESTORE cursor from globalDirectoryHistory.restoreCursorPosition

## BUILD_PANE_FROM_RAW_LISTING

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]: how: client-side filter when server did not pre-filter; sort visible files; reconcile or clear marks per preserveMarks flag

CONTRACT BuildPaneFromRawListing
  INPUT: rawFiles, pane with activeDisplaySpecId, store, options { preserveMarks?, serverPreFiltered?, hiddenCount?, totalCount? }
  OUTPUT: pane with files, hiddenCount, rawFileCount, loadedSpecVersion
  DATA: filterFileStats, sortFiles, reconcilePaneSelection

PROCEDURE IMPL-PANE_DISPLAY_FILTER_UI_BuildPaneFromRawListing(rawFiles, pane, store, options)
  IF NOT options.serverPreFiltered THEN APPLY filterFileStats(rawFiles, getActiveSpec(store, pane.activeDisplaySpecId))
  SORT visible files per pane sortBy sortDirection sortDirsFirst
  IF preserveMarks THEN reconcilePaneSelection ELSE clear marks Set
  SET loadedSpecVersion := active spec.version or null
  RETURN updated pane

## MANAGER_DIALOG_CRUD

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: DisplaySpecManagerDialog create/save/rename/duplicate/delete; validation errors inline; confirm when spec used by multiple panes

CONTRACT ManagerDialogCrud
  INPUT: draft spec fields, selected catalog id, panesUsingSpec(specId)
  OUTPUT: store mutations; onSaved triggers refresh; onDeleted triggers fallback
  DATA: DisplaySpecRuleEditor for rules array

PROCEDURE IMPL-PANE_DISPLAY_FILTER_UI_ManagerDialogCrud()
  ON save new CALL store.create; ON validation fail SET errors AND RETURN
  ON save existing IF panesUsingSpec greater than 1 THEN confirm before store.update
  ON duplicate CALL store.duplicate(id, name + " (copy)")
  ON delete confirm THEN store.delete(id) AND onDeleted(specId)
  WHILE manager open subscribe store updated events -> RefreshPanesUsingSpec(spec.id)

## SPEC_DELETED_FALLBACK

// [IMPL-PANE_DISPLAY_FILTER_UI] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]: how: catalog delete event clears activeDisplaySpecId on affected panes and shows notice banner

CONTRACT SpecDeletedFallback
  INPUT: store subscribe event { type: deleted, specId }
  OUTPUT: panes with matching activeDisplaySpecId reset; user notice string
  DATA: specDeletedNotice banner in WorkspaceView

PROCEDURE IMPL-PANE_DISPLAY_FILTER_UI_SpecDeletedFallback(event)
  FOR each pane WHERE activeDisplaySpecId equals event.specId
    SET activeDisplaySpecId := null
    SET hiddenCount := 0
    SET loadedSpecVersion := null
  SET specDeletedNotice := "A display spec was deleted; affected panes now use No filter."

## KEYBIND_VIEW_DISPLAY_SPEC

// [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-TOOLBAR_SYSTEM] [REQ-PANE_DISPLAY_FILTER]: how: view.displaySpec opens manager dialog; view.displaySpec.none clears active spec on focused pane

CONTRACT KeybindViewDisplaySpec
  INPUT: action view.displaySpec or view.displaySpec.none, focusIndex
  OUTPUT: displaySpecManagerOpen true OR handleSetActiveDisplaySpec(focusIndex, null)
  DATA: paneActionHandlers entries

PROCEDURE IMPL-PANE_DISPLAY_FILTER_UI_KeybindViewDisplaySpec(action, focusIndex)
  IF action equals view.displaySpec THEN setDisplaySpecManagerOpen(true)
  IF action equals view.displaySpec.none THEN handleSetActiveDisplaySpec(focusIndex, null)

## PANE_HEADER_SELECTOR

// [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]: how: FilePane shows DisplaySpecSelector dropdown; when active spec show Filter label and optional Hidden count from hiddenCount

CONTRACT PaneHeaderSelector
  INPUT: pane activeDisplaySpecId, catalog specs, hiddenCount, onSelect, onManage
  OUTPUT: header dropdown UI with No filter, recent specs, Manage specs option
  DATA: DisplaySpecSelector testid pane-display-spec-selector

PROCEDURE IMPL-PANE_DISPLAY_FILTER_UI_PaneHeaderSelector()
  RENDER DisplaySpecSelector with activeSpecId, specs, recentSpecIds, onSelect, onManage
  IF active spec name provided THEN show "Filter: {name}" and optional "Hidden: N" when hiddenCount greater than zero

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

PROCEDURE IMPL-PANE_DISPLAY_FILTER_UI_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF listing fetch fails for one pane THEN log AND skip that pane index
  IF spec missing from store THEN clear activeDisplaySpecId AND notify user
