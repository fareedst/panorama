# IMPL-SORT_FILTER essence pseudocode

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: Client-side sort pipeline in files.utils and workspace Shared/Share sort in SortDialog and WorkspaceView

## SortFilesComparatorPipeline

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: sortFiles copies input, applies dirsFirst directory layer then criterion comparator with asc/desc flip without mutating source array

```
IMPL-SORT_FILTER_SortFilesComparatorPipeline(files, sortBy, direction, dirsFirst):
  INPUT: files FileStat[], sortBy SortCriterion, direction SortDirection, dirsFirst boolean
  OUTPUT: new sorted FileStat[] (input unchanged)
  DATA: compareName, compareSize, compareMtime, compareExtension
  PRE: files array defined; sortBy and direction valid
  POST: returned array sorted per criterion; source files array unchanged
  EFFECTS: pure
  TERMINATION: total
  sorted := COPY files
  ascending := (direction = "asc")
  FOR EACH pair (a, b) IN sorted.sort comparator
    IF dirsFirst AND a.isDirectory ≠ b.isDirectory
      RETURN directory before file (-1 if a is directory)
    SWITCH sortBy
      CASE "name" result := compareName(a, b)  // localeCompare base sensitivity, numeric true
      CASE "size" result := a.size - b.size
      CASE "mtime" result := compareMtime(a, b)  // coerce ISO strings to epoch ms
      CASE "extension" result := compareExtension(a, b)  // empty ext first; tiebreak by name
    RETURN ascending ? result : -result
  RETURN sorted
```

## PaneSortSettingsEquality

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED]: paneSortSettingsEqual returns true when sortBy sortDirection sortDirsFirst all match for Share/Shared disable logic

```
IMPL-SORT_FILTER_PaneSortSettingsEquality(a, b):
  INPUT: a PaneSortSettings, b PaneSortSettings
  OUTPUT: boolean equal
  DATA: DEFAULT_PANE_SORT constant for workspace default triple
  PRE: both settings objects defined
  POST: true iff sortBy, sortDirection, sortDirsFirst all match
  EFFECTS: pure
  TERMINATION: total
  RETURN (a.sortBy = b.sortBy) AND (a.sortDirection = b.sortDirection) AND (a.sortDirsFirst = b.sortDirsFirst)
```

## LinkedSortApply

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-LINKED_PANES]: handleSortChange updates one or all panes, re-sorts listing, preserves cursor by matching filename after sort

```
IMPL-SORT_FILTER_LinkedSortApply(context):
  INPUT: criterion, direction, dirsFirst, options.singlePaneOnly, linkedMode, panes[], focusIndex
  OUTPUT: updated panes with files reordered and cursor on same filename when found
  DATA: sortFiles, pane.files, pane.cursor
  PRE: panes state and focusIndex valid
  POST: target panes re-sorted; cursor on same filename when present else 0
  EFFECTS: State
  TERMINATION: total
  IF options.singlePaneOnly OR NOT (linkedMode AND panes.length > 1)
    THEN panesToUpdate := [focusIndex]
    ELSE panesToUpdate := ALL pane indices
  FOR EACH paneIdx IN panesToUpdate
    currentFilename := panes[paneIdx].files[cursor].name
    sortedFiles := sortFiles(pane.files, criterion, direction, dirsFirst)
    newCursor := INDEX OF file WHERE name = currentFilename IN sortedFiles ELSE 0
    IF newCursor < 0 THEN newCursor := 0
    UPDATE pane sortBy sortDirection sortDirsFirst files cursor
```

## SharedSortWorkspace

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-LINKED_PANES]: workspace sharedSort; SortDialog Share copies draft; Shared applies sharedSort to focused pane only; new panes inherit sharedSort

```
IMPL-SORT_FILTER_SharedSortWorkspace(context):
  INPUT: paneSort, sharedSort, dialog draft criterion/direction/dirsFirst, linkedMode, focusIndex
  OUTPUT: updated sharedSort and/or pane listing order; dialog buttons enabled/disabled
  DATA: paneSortSettingsEqual, DEFAULT_PANE_SORT, mesh snapshot v3 sharedSort restore
  PRE: SortDialog open with draft settings; workspace panes available
  POST: Share/Shared/Apply actions update sharedSort or pane sorts per button semantics
  EFFECTS: State
  TERMINATION: total
  paneMatchesShared := paneSortSettingsEqual(paneSort, sharedSort)
  IF paneMatchesShared THEN disable Share and Shared buttons ELSE enable both
  IF Share clicked THEN onShareToWorkspace({ sortBy: draft, sortDirection, sortDirsFirst })  // no immediate resort
  IF Shared clicked THEN handleSortChange(sharedSort fields, { singlePaneOnly: true }); close dialog
  IF Apply clicked THEN handleSortChange(draft fields); close dialog  // linked-all unless singlePaneOnly path above
  WHEN addPane THEN newPane.sort := sharedSort (not focused pane sort)
  WHEN restoreUi.sharedSort present THEN initialize sharedSort from snapshot
```

## SortDisplayHelpers

// [IMPL-SORT_FILTER] [REQ-FILE_SORTING_ADVANCED]: getSortLabel and getSortDirectionSymbol map criterion and direction to footer/menu display strings

```
IMPL-SORT_FILTER_SortDisplayHelpers(context):
  INPUT: sortBy SortCriterion OR direction SortDirection
  OUTPUT: display label or arrow symbol
  DATA: name→Name, size→Size, mtime→Time, extension→Extension; asc→↑ desc→↓
  PRE: sortBy or direction defined
  POST: mapped label or direction symbol returned
  EFFECTS: pure
  TERMINATION: total
  SWITCH sortBy RETURN mapped label
  RETURN "↑" IF direction = "asc" ELSE "↓"
```

## CodeLocations

// [IMPL-SORT_FILTER] [ARCH-SORT_PIPELINE] [REQ-FILE_SORTING_ADVANCED] [REQ-WORKSPACE_MESH_BRIDGE]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.utils.ts — sortFiles, PaneSortSettings, paneSortSettingsEqual, getSortLabel, getSortDirectionSymbol
// FILE: src/lib/files.utils.test.ts — sortFiles comparator and edge-case tests
// FILE: src/app/files/components/SortDialog.tsx — Share/Shared draft and disable logic
// FILE: src/app/files/components/SortDialog.test.tsx — Share/Shared button behavior
// FILE: src/app/files/WorkspaceView.tsx — sharedSort state, handleSortChange, handleAddPane sort default
// FILE: src/app/files/WorkspaceView.shared-sort.test.tsx — Shared single-pane vs linked; Share then new pane inherits sharedSort
