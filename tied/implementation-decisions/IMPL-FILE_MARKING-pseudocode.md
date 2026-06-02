# IMPL-FILE_MARKING essence pseudocode

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: Per-pane Set<string> marks keyed by absolute file.path in WorkspaceView; keyboard via keybindings; checkbox in FilePane; RECONCILE_TREE_SELECTION prunes invisible paths

## Summary contract

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: bound module inputs, outputs, and shared data for all runtime blocks below

```
CONTRACT Summary
  INPUT: paneIndex; filePath; visibleFiles from crossPaneVisibilityResult.displayFilesByPane OR pane.files
  OUTPUT: updated pane.marks Set; footer [N marked] when marks.size > 0
  DATA: PaneState.marks Set<string> keyed by absolute file.path; marks independent per pane index
  CONTROL: keybindings mark.toggle (Space), mark.toggle-cursor (m), mark.all, mark.invert, mark.clear
```

## PaneMarkState

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: each pane initializes marks as empty Set; persists across re-sort and tree refresh when path still visible

```
PROCEDURE PaneMarkState(context)
  DATA pane.marks AS Set<string> of absolute paths
  ON directory reload OR tree refresh RETAIN marks for paths still in visible pane.files
  SKIP parent directory entry (..) for mark targets
```

## MarkToggleCursor

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: m key and checkbox call handleToggleMark(filePath) without cursor move

```
PROCEDURE MarkToggleCursor(context)
  INPUT: paneIndex, filePath
  IF filePath IN pane.marks THEN DELETE ELSE ADD
  IMMUTABLE update pane via setPanes copy with new Set
  CURSOR unchanged
```

## MarkToggleAdvance

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: Space keybinding mark.toggle toggles visible cursor file path then advances cursor if not last

```
PROCEDURE MarkToggleAdvance(context)
  INPUT: focusIndex, visibleFiles[pane.cursor]
  IF no file at cursor THEN RETURN
  CALL handleToggleMark(focusIndex, file.path)
  IF cursor < visibleFiles.length - 1 THEN handleCursorMove(focusIndex, cursor + 1)
```

## MarkAllVisible

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-PANE_DISPLAY_FILTER] [REQ-DIRECTORY_TREE]: how: Shift+M mark.all sets marks to all paths in displayFilesByPane when filter active

```
PROCEDURE MarkAllVisible(context)
  visible := crossPaneVisibilityResult.displayFilesByPane[paneIndex] ?? pane.files
  SET pane.marks := new Set(visible.map(f => f.path))
```

## InvertMarksVisible

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-PANE_DISPLAY_FILTER] [REQ-DIRECTORY_TREE]: how: Ctrl+M mark.invert symmetric difference over visible file paths only

```
PROCEDURE InvertMarksVisible(context)
  visible := displayFilesByPane[paneIndex] ?? pane.files
  newMarks := empty Set
  FOR EACH file IN visible
    IF file.path NOT IN pane.marks THEN ADD file.path TO newMarks
  SET pane.marks := newMarks
```

## ClearMarks

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: mark.clear replaces marks with empty Set

```
PROCEDURE ClearMarks(context)
  SET pane.marks := new Set()
  IF already empty THEN no error
```

## MarkPersistence

// [IMPL-FILE_MARKING] [IMPL-DIRECTORY_TREE] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: marks keyed by absolute path survive sort/filter/tree refresh; pruned when path absent from visible rows via RECONCILE_TREE_SELECTION

```
PROCEDURE MarkPersistence(context)
  ON sort OR filter OR reload OR tree expand/collapse MATCH marks by file.path not row index
  DROP marks for paths no longer in pane.files when listing changes
  DELEGATE reconcile to IMPL-DIRECTORY_TREE RECONCILE_TREE_SELECTION when tree mutates
```

## MarkVisualFeedback

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: FilePane checkbox checked when file.path in marks; row bg-yellow when marked and not comparison-colored

```
PROCEDURE MarkVisualFeedback(context)
  RENDER checkbox per row; checked IF file.path IN marks
  APPLY marked background class when isMarked AND no comparison override
  FOOTER show [{marks.size} marked] when marks.size > 0 AND footer visible
```

## PerPaneIndependence

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: each pane index has isolated marks Set; bulk ops use source pane marks only

```
PROCEDURE PerPaneIndependence(context)
  ON focus change DO NOT merge marks across panes
  BULK drag uses marks from active pane when marks.size > 0
```

## EmptyDirectoryEdgeCases

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: mark keybindings on empty visible list do not throw; footer omits marked segment when no files

```
PROCEDURE EmptyDirectoryEdgeCases(context)
  IF visibleFiles length zero THEN mark handlers no-op
  FOOTER hidden when files.length zero AND marks.size zero AND hiddenCount zero
```

## MarkWithNavigation

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: navigate.up/down does not clear marks

```
PROCEDURE MarkWithNavigation(context)
  ON cursor move DO NOT mutate pane.marks
  MARK count unchanged until explicit mark action
```

## CodeLocations

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: map implementing and verifying source files for this IMPL

```
// FILE: src/app/files/WorkspaceView.tsx — handleToggleMark, handleMarkAll, handleInvertMarks, handleClearMarks, keybinding handlers
// FILE: src/app/files/components/FilePane.tsx — checkbox and footer marked count
// FILE: src/lib/file-tree.ts — reconcileTreeSelection
// FILE: src/app/files/WorkspaceView.test.tsx — TEST-FILE_MARKING / mark behavior tests
```

## ErrorHandling

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: mark operations never throw on missing cursor file

```
PROCEDURE IMPL-FILE_MARKING_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF no file at cursor THEN RETURN without state mutation
```
