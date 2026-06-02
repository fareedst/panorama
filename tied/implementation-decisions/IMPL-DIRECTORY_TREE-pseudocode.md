# IMPL-DIRECTORY_TREE essence pseudocode

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: Lazy hierarchical tree under pane.path; flatten for cursor/marks; expand toggle separate from linked re-root

## Summary contract

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how: pure module inputs/outputs for tree state and visible row derivation

```
CONTRACT Summary
  INPUT: basePath, rootChildren[], expandedPaths Set, childrenByPath Map, sortOptions
  OUTPUT: FileTreeRow[] visible rows with depth, isExpanded, hasLoadedChildren
  DATA: pane.files derived from flattenVisibleRows after each tree mutation
  CONTROL: handleToggleExpand in WorkspaceView; handleNavigate resets tree on re-root
```

## CREATE_INITIAL_TREE_STATE

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how: seed childrenByPath with basePath -> rootChildren; expandedPaths empty

```
PROCEDURE CREATE_INITIAL_TREE_STATE(basePath, rootChildren)
  RETURN FileTreeState { basePath, expandedPaths: empty Set, childrenByPath: Map(basePath -> rootChildren) }
```

## TOGGLE_EXPANDED

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how: add or remove dirPath from expandedPaths; no linked pane sync

```
PROCEDURE TOGGLE_EXPANDED(state, dirPath)
  IF dirPath IN state.expandedPaths THEN DELETE FROM expandedPaths
  ELSE ADD dirPath TO expandedPaths
  RETURN updated state
```

## SET_CHILDREN

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how: cache sorted children after lazy fetch on first expand

```
PROCEDURE SET_CHILDREN(state, dirPath, children)
  state.childrenByPath.set(dirPath, sortFiles(children, sortOptions))
  RETURN state
```

## FLATTEN_VISIBLE_ROWS

// [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-FILE_LISTING] [REQ-DIRECTORY_TREE]: how: pre-order walk from base; emit row per entry with depth; recurse into expanded dirs only

```
PROCEDURE FLATTEN_VISIBLE_ROWS(state, sortOptions)
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
PROCEDURE RECONCILE_TREE_SELECTION(visibleRows, marks Set, cursor)
  visiblePaths := Set of visibleRows.map(r => r.path)
  marks := marks INTERSECT visiblePaths
  cursor := clamp cursor to [0, visibleRows.length - 1] or 0 when empty
  RETURN { marks, cursor }
```

## REFRESH_PANE_TREE

// [IMPL-DIRECTORY_TREE] [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_TREE] [REQ-PANE_REFRESH]: how: reload base + every expandedPaths; re-flatten; preserve expandedPaths set

```
PROCEDURE REFRESH_PANE_TREE(paneIndex)
  FETCH listing for pane.path -> root children
  FOR EACH path IN pane.treeState.expandedPaths
    FETCH listing for path -> setChildren
  pane.files := flattenVisibleRows(pane.treeState)
  RECONCILE_TREE_SELECTION on pane
```

## HANDLE_NAVIGATE_TREE_RESET

// [IMPL-DIRECTORY_TREE] [IMPL-LINKED_NAV] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES]: how: re-root clears expandedPaths; linked sync applies here not on toggleExpand

```
PROCEDURE HANDLE_NAVIGATE_TREE_RESET(newBasePath, rootChildren)
  treeState := CREATE_INITIAL_TREE_STATE(newBasePath, rootChildren)
  pane.path := newBasePath
  pane.files := flattenVisibleRows(treeState)
  CLEAR or reconcile marks per preserveMarks flag
  // Linked downward/upward navigation runs in handleNavigate only
```

## TREE_EXPAND_NO_LINKED_SYNC

// [IMPL-DIRECTORY_TREE] [IMPL-LINKED_NAV] [REQ-LINKED_PANES]: how: document boundary — toggleExpand does not call linked DownwardNavigation

```
PROCEDURE TREE_EXPAND_NO_LINKED_SYNC
  handleToggleExpand updates expandedPaths and pane.files ONLY for initiating pane
  linkedMode does NOT propagate expand/collapse to other panes
  Cursor filename sync still runs via handleCursorMove on visible flattened rows
```
