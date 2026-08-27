# IMPL-DIRECTORY_TREE essence pseudocode

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: Lazy hierarchical tree under pane.path; flatten for cursor/marks; expand toggle separate from linked re-root

## Summary contract

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how: pure module inputs/outputs for tree state and visible row derivation

```
IMPL-DIRECTORY_TREE_Summary():
  INPUT: basePath, rootChildren[], expandedPaths Set, childrenByPath Map, sortOptions
  OUTPUT: FileTreeRow[] visible rows with depth, isExpanded, hasLoadedChildren
  DATA: pane.files derived from flattenVisibleRows after each tree mutation
  CONTROL: handleToggleExpand in WorkspaceView; handleNavigate resets tree on re-root
  PRE: basePath and rootChildren available for tree initialization
  POST: visible rows reflect expanded tree state flattened for pane.files
  EFFECTS: State
  TERMINATION: total
```

## CREATE_INITIAL_TREE_STATE

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how: seed childrenByPath with basePath -> rootChildren; expandedPaths empty

```
IMPL-DIRECTORY_TREE_CreateInitialTreeState(basePath, rootChildren):
  INPUT: basePath, rootChildren[]
  OUTPUT: FileTreeState with empty expandedPaths
  DATA: childrenByPath Map(basePath -> rootChildren)
  PRE: basePath is non-empty string; rootChildren is array
  POST: expandedPaths empty; childrenByPath seeded at basePath
  EFFECTS: pure
  TERMINATION: total
  RETURN FileTreeState { basePath, expandedPaths: empty Set, childrenByPath: Map(basePath -> rootChildren) }
```

## TOGGLE_EXPANDED

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how: add or remove dirPath from expandedPaths; no linked pane sync

```
IMPL-DIRECTORY_TREE_ToggleExpanded(state, dirPath):
  INPUT: FileTreeState, dirPath
  OUTPUT: updated FileTreeState
  PRE: dirPath is absolute directory path in tree
  POST: dirPath toggled in expandedPaths; no linked pane propagation
  EFFECTS: State
  TERMINATION: total
  IF dirPath IN state.expandedPaths THEN DELETE FROM expandedPaths
  ELSE ADD dirPath TO expandedPaths
  RETURN updated state
```

## SET_CHILDREN

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how: cache sorted children after lazy fetch on first expand

```
IMPL-DIRECTORY_TREE_SetChildren(state, dirPath, children):
  INPUT: FileTreeState, dirPath, children[]
  OUTPUT: updated FileTreeState with cached sorted children
  PRE: dirPath valid; children listing fetched
  POST: childrenByPath updated with sorted children at dirPath
  EFFECTS: State
  TERMINATION: total
  state.childrenByPath.set(dirPath, sortFiles(children, sortOptions))
  RETURN state
```

## FLATTEN_VISIBLE_ROWS

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-FILE_LISTING] [REQ-DIRECTORY_TREE]: how: pre-order walk from base; emit row per entry with depth; recurse into expanded dirs only

```
IMPL-DIRECTORY_TREE_FlattenVisibleRows(state, sortOptions):
  INPUT: FileTreeState, sortOptions
  OUTPUT: FileTreeRow[] visible rows
  PRE: state.basePath and childrenByPath populated
  POST: pre-order flattened rows with depth and expand metadata
  EFFECTS: pure
  TERMINATION: total
  rows := []
  WALK directoryPath starting at state.basePath depth 0
    FOR EACH child IN sorted children at directoryPath
      APPEND FileTreeRow { ...child, depth, isExpanded, hasLoadedChildren }
      IF child.isDirectory AND child.path IN expandedPaths AND children loaded
        RECURSE into child.path depth+1
  RETURN rows
```

## RECONCILE_TREE_SELECTION

// [IMPL-DIRECTORY_TREE] [ARCH-MARKING_STATE] [REQ-FILE_MARKING_WEB] [REQ-DIRECTORY_TREE]: how: marks are absolute paths; drop marks not in visible row paths; clamp cursor

```
IMPL-DIRECTORY_TREE_ReconcileTreeSelection(visibleRows, marks, cursor):
  INPUT: visibleRows[], marks Set, cursor index
  OUTPUT: reconciled marks and cursor
  PRE: visibleRows reflects current flattened tree
  POST: marks intersect visible paths; cursor clamped to valid range
  EFFECTS: State
  DATA_TRANSITION: marks pruned when paths no longer visible
  TERMINATION: total
  visiblePaths := Set of visibleRows.map(r => r.path)
  marks := marks INTERSECT visiblePaths
  cursor := clamp cursor to [0, visibleRows.length - 1] or 0 when empty
  RETURN { marks, cursor }
```

## REFRESH_PANE_TREE

// [IMPL-DIRECTORY_TREE] [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_TREE] [REQ-PANE_REFRESH]: how: reload base + every expandedPaths; re-flatten; preserve expandedPaths set

```
IMPL-DIRECTORY_TREE_RefreshPaneTree(paneIndex):
  INPUT: pane with treeState and expandedPaths
  OUTPUT: refreshed pane.files and reconciled selection
  PRE: pane.path and treeState.expandedPaths available
  POST: base and expanded listings reloaded; pane.files re-flattened
  EFFECTS: IO, State
  TERMINATION: total
  FETCH listing for pane.path -> root children
  FOR EACH path IN pane.treeState.expandedPaths
    FETCH listing for path -> setChildren
  pane.files := flattenVisibleRows(pane.treeState)
  RECONCILE_TREE_SELECTION on pane
```

## HANDLE_NAVIGATE_TREE_RESET

// [IMPL-DIRECTORY_TREE] [IMPL-LINKED_NAV] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES]: how: re-root clears expandedPaths; linked sync applies here not on toggleExpand

```
IMPL-DIRECTORY_TREE_HandleNavigateTreeReset(newBasePath, rootChildren):
  INPUT: newBasePath, rootChildren[]
  OUTPUT: reset treeState and pane.files
  PRE: navigation re-roots pane to newBasePath
  POST: expandedPaths cleared; pane.files flattened from new root; marks reconciled
  EFFECTS: IO, State
  DATA_TRANSITION: tree re-rooted; expanded subtree cleared
  TERMINATION: total
  treeState := CREATE_INITIAL_TREE_STATE(newBasePath, rootChildren)
  pane.path := newBasePath
  pane.files := flattenVisibleRows(treeState)
  CLEAR or reconcile marks per preserveMarks flag
  // Linked downward/upward navigation runs in handleNavigate only
```

## TREE_EXPAND_NO_LINKED_SYNC

// [IMPL-DIRECTORY_TREE] [IMPL-LINKED_NAV] [REQ-LINKED_PANES]: how: document boundary — toggleExpand does not call linked DownwardNavigation

```
IMPL-DIRECTORY_TREE_TreeExpandNoLinkedSync():
  INPUT: toggle expand on initiating pane
  OUTPUT: expandedPaths updated for initiating pane only
  PRE: handleToggleExpand invoked
  POST: only initiating pane tree mutated; linked panes unchanged
  EFFECTS: State
  TERMINATION: total
  handleToggleExpand updates expandedPaths and pane.files ONLY for initiating pane
  linkedMode does NOT propagate expand/collapse to other panes
  Cursor filename sync still runs via handleCursorMove on visible flattened rows
```

## CodeLocations

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: map implementing and verifying source files for this IMPL

// FILE: src/lib/file-tree.ts — pure tree state module
// FILE: src/lib/file-tree.test.ts — unit tests
// FILE: src/lib/pane-file-tree.ts — pane tree integration
// FILE: src/lib/pane-file-tree.test.ts — pane tree tests
// FILE: src/app/files/WorkspaceView.tsx — handleToggleExpand, refreshPaneTree
// FILE: src/app/files/WorkspaceView.directory-tree.test.tsx — composition tests
