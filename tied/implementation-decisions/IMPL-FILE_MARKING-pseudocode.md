# IMPL-FILE_MARKING essence pseudocode

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: Per-pane Set<string> marks keyed by absolute file.path in WorkspaceView; keyboard via keybindings; checkbox in FilePane; RECONCILE_TREE_SELECTION prunes invisible paths

## Summary contract

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-FILE_MARKING_Summary():
  INPUT: paneIndex; filePath; visibleFiles from crossPaneVisibilityResult.displayFilesByPane OR pane.files
  OUTPUT: updated pane.marks Set; footer [N marked] when marks.size > 0
  DATA: PaneState.marks Set<string> keyed by absolute file.path; marks independent per pane index
  CONTROL: keybindings mark.toggle (Space), mark.toggle-cursor (m), mark.all, mark.invert, mark.clear
  PRE: pane state with marks Set initialized
  POST: marks updated per action; footer reflects mark count when visible
  EFFECTS: State
  TERMINATION: total
```

## PaneMarkState

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: each pane initializes marks as empty Set; persists across re-sort and tree refresh when path still visible

```
IMPL-FILE_MARKING_PaneMarkState(context):
  INPUT: pane index
  OUTPUT: pane.marks Set<string>
  PRE: pane initialized
  POST: marks keyed by absolute path; retained across reload when path still visible
  EFFECTS: State
  TERMINATION: total
  DATA pane.marks AS Set<string> of absolute paths
  ON directory reload OR tree refresh RETAIN marks for paths still in visible pane.files
  SKIP parent directory entry (..) for mark targets
```

## MarkToggleCursor

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: m key and checkbox call handleToggleMark(filePath) without cursor move

```
IMPL-FILE_MARKING_MarkToggleCursor(context):
  INPUT: paneIndex, filePath
  OUTPUT: toggled mark membership for filePath
  PRE: filePath valid absolute path
  POST: filePath added or removed from marks; cursor unchanged
  EFFECTS: State
  TERMINATION: total
  IF filePath IN pane.marks THEN DELETE ELSE ADD
  IMMUTABLE update pane via setPanes copy with new Set
  CURSOR unchanged
```

## MarkToggleAdvance

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: Space keybinding mark.toggle toggles visible cursor file path then advances cursor if not last

```
IMPL-FILE_MARKING_MarkToggleAdvance(context):
  INPUT: focusIndex, visibleFiles, cursor index
  OUTPUT: toggled mark and optional cursor advance
  PRE: file at cursor in visibleFiles
  POST: cursor file toggled; cursor advanced when not on last row
  EFFECTS: State
  TERMINATION: total
  IF no file at cursor THEN RETURN
  CALL handleToggleMark(focusIndex, file.path)
  IF cursor < visibleFiles.length - 1 THEN handleCursorMove(focusIndex, cursor + 1)
```

## MarkAllVisible

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-PANE_DISPLAY_FILTER] [REQ-DIRECTORY_TREE]: how: Shift+M mark.all sets marks to all paths in displayFilesByPane when filter active

```
IMPL-FILE_MARKING_MarkAllVisible(context):
  INPUT: paneIndex, visible file list
  OUTPUT: marks Set containing all visible paths
  PRE: visible files list available
  POST: pane.marks contains every visible file path
  EFFECTS: State
  TERMINATION: total
  visible := crossPaneVisibilityResult.displayFilesByPane[paneIndex] ?? pane.files
  SET pane.marks := new Set(visible.map(f => f.path))
```

## InvertMarksVisible

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-PANE_DISPLAY_FILTER] [REQ-DIRECTORY_TREE]: how: Ctrl+M mark.invert symmetric difference over visible file paths only

```
IMPL-FILE_MARKING_InvertMarksVisible(context):
  INPUT: paneIndex, visible files, current marks
  OUTPUT: inverted marks over visible paths only
  PRE: visible files list available
  POST: marks symmetric-differenced over visible paths
  EFFECTS: State
  TERMINATION: total
  visible := displayFilesByPane[paneIndex] ?? pane.files
  newMarks := empty Set
  FOR EACH file IN visible
    IF file.path NOT IN pane.marks THEN ADD file.path TO newMarks
  SET pane.marks := newMarks
```

## ClearMarks

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: mark.clear replaces marks with empty Set

```
IMPL-FILE_MARKING_ClearMarks(context):
  INPUT: paneIndex
  OUTPUT: empty marks Set
  PRE: pane exists
  POST: pane.marks is empty Set
  EFFECTS: State
  TERMINATION: total
  SET pane.marks := new Set()
  IF already empty THEN no error
```

## MarkPersistence

// [IMPL-FILE_MARKING] [IMPL-DIRECTORY_TREE] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: marks keyed by absolute path survive sort/filter/tree refresh; pruned when path absent from visible rows via RECONCILE_TREE_SELECTION

```
IMPL-FILE_MARKING_MarkPersistence(context):
  INPUT: listing or tree mutation
  OUTPUT: marks retained or pruned by absolute path
  PRE: pane.files or visible rows changed
  POST: marks match by path not row index; invisible paths dropped
  EFFECTS: State
  DATA_TRANSITION: marks pruned via RECONCILE_TREE_SELECTION when tree mutates
  TERMINATION: total
  ON sort OR filter OR reload OR tree expand/collapse MATCH marks by file.path not row index
  DROP marks for paths no longer in pane.files when listing changes
  DELEGATE reconcile to IMPL-DIRECTORY_TREE RECONCILE_TREE_SELECTION when tree mutates
```

## MarkVisualFeedback

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: FilePane checkbox checked when file.path in marks; row bg-yellow when marked and not comparison-colored

```
IMPL-FILE_MARKING_MarkVisualFeedback(context):
  INPUT: file.path, marks Set, comparison styling
  OUTPUT: checkbox and row styling for marked state
  PRE: file row rendered in FilePane
  POST: checkbox checked and marked background when path in marks without comparison override
  EFFECTS: pure
  TERMINATION: total
  RENDER checkbox per row; checked IF file.path IN marks
  APPLY marked background class when isMarked AND no comparison override
  FOOTER show [{marks.size} marked] when marks.size > 0 AND footer visible
```

## PerPaneIndependence

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: each pane index has isolated marks Set; bulk ops use source pane marks only

```
IMPL-FILE_MARKING_PerPaneIndependence(context):
  INPUT: pane focus change or bulk operation
  OUTPUT: marks remain isolated per pane index
  PRE: multi-pane workspace active
  POST: marks not merged across panes on focus change
  EFFECTS: State
  TERMINATION: total
  ON focus change DO NOT merge marks across panes
  BULK drag uses marks from active pane when marks.size > 0
```

## EmptyDirectoryEdgeCases

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: mark keybindings on empty visible list do not throw; footer omits marked segment when no files

```
IMPL-FILE_MARKING_EmptyDirectoryEdgeCases(context):
  INPUT: empty visible file list
  OUTPUT: no-op mark handlers; hidden footer when appropriate
  PRE: visibleFiles length zero OR no marks and no files
  POST: mark handlers no-op; footer hidden when empty
  EFFECTS: pure
  TERMINATION: total
  IF visibleFiles length zero THEN mark handlers no-op
  FOOTER hidden when files.length zero AND marks.size zero AND hiddenCount zero
```

## MarkWithNavigation

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: navigate.up/down does not clear marks

```
IMPL-FILE_MARKING_MarkWithNavigation(context):
  INPUT: cursor navigation event
  OUTPUT: marks unchanged
  PRE: navigate.up/down invoked
  POST: pane.marks unchanged after cursor move
  EFFECTS: pure
  TERMINATION: total
  ON cursor move DO NOT mutate pane.marks
  MARK count unchanged until explicit mark action
```

## CodeLocations

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — handleToggleMark, handleMarkAll, handleInvertMarks, handleClearMarks, keybinding handlers
// FILE: src/app/files/components/FilePane.tsx — checkbox and footer marked count
// FILE: src/lib/file-tree.ts — reconcileTreeSelection
// FILE: src/app/files/WorkspaceView.test.tsx — TEST-FILE_MARKING / mark behavior tests

## ErrorHandling

// [IMPL-FILE_MARKING] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB]: how: mark operations never throw on missing cursor file

```
IMPL-FILE_MARKING_on_error(context, error):
  INPUT: missing cursor file
  OUTPUT: no state mutation
  PRE: no file at cursor when mark action invoked
  POST: pane.marks unchanged; no throw
  EFFECTS: pure
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF no file at cursor THEN RETURN without state mutation
```
