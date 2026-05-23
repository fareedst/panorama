# IMPL-SORT_FILTER essence pseudocode

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: Top-level Client-Side Sort and Filter Functions: Sort functions in files.utils.ts with comparator dispatch

## Summary contract

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-SORT_FILTER
  DATA: state and configuration per implementation_approach

## SortFiles

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: sortFiles applies criterion direction dirsFirst client or server

CONTRACT SortFiles
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-SORT_FILTER_SortFiles(context)
  // INPUT files sortBy sortDirection sortDirsFirst
  // PARTITION directories and files if dirsFirst
  CALL PARTITION directories and files if dirsFirst
  // SORT each partition per criterion
  CALL SORT each partition per criterion
  // CONCATENATE and RETURN ordered list
  CALL CONCATENATE and RETURN ordered list

## LinkedSortApply

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: when linked apply same sort fields to every pane

CONTRACT LinkedSortApply
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-SORT_FILTER_LinkedSortApply(context)
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-LINKED_PANES]: linked-all unless singlePaneOnly (Shared action)
  IF options.singlePaneOnly THEN panesToUpdate := [focusIndex]
  ELSE IF linkedMode AND panes.length > 1 THEN panesToUpdate := ALL pane indices
  ELSE panesToUpdate := [focusIndex]
  FOR EACH paneIdx IN panesToUpdate CALL internal sort update
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: preserve cursor by matching filename after sort
  CALL PRESERVE cursor by matching filename after sort

## SharedSortWorkspace

// [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED] [REQ-WORKSPACE_MESH_BRIDGE]: workspace sharedSort; Sort menu Share and Shared (focused pane only)

CONTRACT SharedSortWorkspace
  INPUT: focused pane sort, workspace sharedSort, sort dialog draft
  OUTPUT: updated sharedSort and/or focused pane listing order
  DATA: PaneSortSettings, paneSortSettingsEqual

PROCEDURE IMPL-SORT_FILTER_SharedSortWorkspace(context)
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: Share copies dialog draft into workspace sharedSort without resorting panes
  IF Share clicked THEN sharedSort := draft sort settings; CALL onShareToWorkspace(draft)
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-LINKED_PANES]: Shared applies sharedSort to focused pane only via singlePaneOnly
  IF Shared clicked THEN CALL handleSortChange(sharedSort, singlePaneOnly=true); close dialog
  // [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: disable Share/Shared when focused pane sort equals sharedSort
  IF paneSortSettingsEqual(focusedPane.sort, sharedSort) THEN disable Share and Shared buttons
  // [IMPL-SORT_FILTER] [REQ-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE]: new panes inherit sharedSort not focused pane sort
  WHEN addPane THEN newPane.sort := sharedSort

## CodeLocations

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-WORKSPACE_MESH_BRIDGE]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.utils.ts — sortFiles, PaneSortSettings, DEFAULT_PANE_SORT, paneSortSettingsEqual
// FILE: src/app/files/components/SortDialog.tsx — Share/Shared buttons, disable when pane matches shared
// FILE: src/app/files/WorkspaceView.tsx — sharedSort state, handleSortChange(singlePaneOnly), handleAddPane default sort

## ErrorHandling

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-SORT_FILTER_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
