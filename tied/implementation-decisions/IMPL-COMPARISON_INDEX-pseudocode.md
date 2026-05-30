# IMPL-COMPARISON_INDEX essence pseudocode

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: how: buildComparisonIndex aggregates per-filename CompareState across panes and exposes get plus getSharedFilenames query interface

## BUILD_COMPARISON_INDEX

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: how: single pass over pane file lists building Map filename to parallel panes/sizes/mtimes arrays

```
CONTRACT BUILD_COMPARISON_INDEX
  INPUT: panes FileStat[][]
  OUTPUT: ComparisonIndex { get, getSharedFilenames }
  DATA: internal Map filename -> CompareState

PROCEDURE IMPL-COMPARISON_INDEX_BuildComparisonIndex(panes)
  index := empty Map
  FOR paneIndex FROM 0 TO panes.length-1
    FOR EACH file IN panes[paneIndex]
      IF filename already IN index THEN
        APPEND paneIndex to state.panes
        APPEND file.size to state.sizes
        APPEND file.mtime to state.mtimes
      ELSE
        SET index[filename] := { panes:[paneIndex], sizes:[file.size], mtimes:[file.mtime] }
  RETURN ComparisonIndex wrapper over index
```

## GET_QUERY

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: how: return CompareState only when filename exists in 2+ panes AND requested paneIndex is among them

```
CONTRACT GET_QUERY
  INPUT: paneIndex number, filename string
  OUTPUT: CompareState or null

PROCEDURE IMPL-COMPARISON_INDEX_GetQuery(paneIndex, filename)
  state := index.get(filename)
  IF state missing OR state.panes.length < 2 THEN RETURN null
  IF paneIndex NOT IN state.panes THEN RETURN null
  RETURN state
```

## GET_SHARED_FILENAMES

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: how: sorted list of filenames appearing in two or more panes

```
CONTRACT GET_SHARED_FILENAMES
  INPUT: internal comparison index Map
  OUTPUT: string[] sorted ascending

PROCEDURE IMPL-COMPARISON_INDEX_GetSharedFilenames()
  shared := []
  FOR EACH filename, state IN index
    IF state.panes.length >= 2 THEN APPEND filename
  RETURN SORT shared ascending
```

## CodeLocations

// [IMPL-COMPARISON_INDEX] [ARCH-COMPARISON_INDEX] [REQ-CROSS_PANE_COMPARISON]: how: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.data.ts — buildComparisonIndex implementation
// FILE: src/lib/files.types.ts — CompareState and ComparisonIndex interfaces
// FILE: src/lib/files.data.test.ts — buildComparisonIndex get and getSharedFilenames tests
// FILE: src/app/files/WorkspaceView.tsx — enhanced index built when panes.length >= 2 for filters
