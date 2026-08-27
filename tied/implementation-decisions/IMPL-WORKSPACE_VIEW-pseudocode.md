# IMPL-WORKSPACE_VIEW essence pseudocode

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-REACT_SSR_STABILITY] [REQ-FILE_SEARCH]: WorkspaceView composition root — panes, navigation, keybindings, dialogs, mesh bridge

## DIALOG_KEYS

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-REACT_SSR_STABILITY] [REQ-FILE_SEARCH]: how: FinderDialog and SearchDialog use distinct open/closed React keys to force remount when toggling visibility and avoid duplicate key warnings

```
IMPL-WORKSPACE_VIEW_DialogKeys(showFinderDialog, showSearchDialog):
  INPUT: showFinderDialog, showSearchDialog boolean state
  OUTPUT: stable remount on dialog open/close
  DATA: key prop on FinderDialog and SearchDialog
  PRE: dialog visibility state available
  POST: FinderDialog and SearchDialog keys alternate open/closed for remount
  EFFECTS: pure
  TERMINATION: total
  FinderDialog key := showFinderDialog ? "finder-open" : "finder-closed"
  SearchDialog key := showSearchDialog ? "search-open" : "search-closed"
  OTHER modals use isOpen without alternating keys (ColumnOrderDialog, HelpOverlay, etc.)
```

## PANE_URL_DEEP_LINK_INIT

// [IMPL-WORKSPACE_VIEW] [ARCH-PANE_LIFECYCLE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-MULTI_PANE_LAYOUT] [REQ-README_DEMO_AUTOMATION]: how: on mount read pane0..paneN from URLSearchParams and call handleNavigate per index unless mesh restore skipped

```
IMPL-WORKSPACE_VIEW_PaneUrlDeepLinkInit():
  INPUT: window.location.search, panes.length, restoredFromMesh, clientRestoredFromMesh, meshRehydrating
  OUTPUT: panes navigated to URL-specified directory paths
  DATA: query keys pane0, pane1, pane2, ...; staggered setTimeout index * 100ms per navigate
  PRE: mount with URL search params; mesh restore not active
  POST: panes navigated to URL paths with staggered handleNavigate calls
  EFFECTS: IO, State
  TERMINATION: total
  IF restoredFromMesh OR clientRestoredFromMesh OR meshRehydrating THEN RETURN
  COLLECT panePathsFromUrl := searchParams.get(`pane${i}`) for i in 0..panes.length-1
  IF panePathsFromUrl.length > 0
    FOR EACH (panePath, index) IN panePathsFromUrl
      SCHEDULE handleNavigate(index, panePath) after index * 100ms delay
  RUN once on mount (deps: mesh restore flags only)
```

## KEYBINDING_INIT

// [IMPL-WORKSPACE_VIEW] [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-KEYBOARD_NAVIGATION]: how: useMemo builds workspaceActionHandlers and paneActionHandlers maps; merged into actionHandlers

```
IMPL-WORKSPACE_VIEW_KeybindingInit():
  INPUT: panes, focusIndex, linkedMode, crossPaneVisibilityResult, handler callbacks
  OUTPUT: actionHandlers Map<string, () => void>
  DATA: workspaceActionHandlers (mesh, help, compare-filter tri-state), paneActionHandlers (nav, file ops, view, marking)
  PRE: workspace state and handler callbacks available
  POST: merged actionHandlers map; window keydown and handleExecuteAction dispatch through it
  EFFECTS: State, IO
  TERMINATION: partial
  workspaceActionHandlers := useMemo WITH deps [panes, handleNavigate, focusedVisibilityState, ...]
    REGISTER mesh.saveWorkspace, mesh.diffWorkspace, help.show, command.palette, search.*, pane.refresh-all, view.compareFilter.*
  paneActionHandlers := useMemo WITH deps [panes, focusIndex, crossPaneVisibilityResult, navigate handlers, ...]
    IF no focused pane THEN RETURN empty map
    REGISTER navigate.*, file.*, mark.*, view.layout/sort/columns/comparison, link.toggle, preview.*, pane.*
  actionHandlers := useMemo MERGE workspace then pane maps
  useEffect window keydown: matchKeybinding → actionHandlers.get → preventDefault + handler
  handleExecuteAction(action) := actionHandlers.get(action)() for toolbar and command palette
  SKIP keydown WHEN input focused OR help/command/finder/search modal open
```

## FILE_COLUMNS_STATE

// [IMPL-WORKSPACE_VIEW] [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-WORKSPACE_MESH_BRIDGE]: how: workspace fileColumns state initialized from YAML or loadedSnapshot; included in captureWorkspaceSnapshot for mesh v4

```
IMPL-WORKSPACE_VIEW_FileColumnsState():
  INPUT: loadedSnapshotProp, columns config, mesh restore bundle
  OUTPUT: fileColumns state passed to FilePane
  PRE: columns config and optional snapshot available
  POST: fileColumns normalized from YAML, snapshot, or mesh restore
  EFFECTS: State
  TERMINATION: total
  fileColumns := useState(() => normalizeFileColumns(loadedSnapshotProp?.fileColumns, columns))
  ON mesh restore setFileColumns(normalizeFileColumns(bundle.snapshot.fileColumns, columns))
  ON limited client rehydrate WHEN limited.fileColumns setFileColumns(normalizeFileColumns(...))
  PASS fileColumns to each FilePane as columns prop
```

## COLUMN_ORDER_DIALOG_HANDLER

// [IMPL-WORKSPACE_VIEW] [IMPL-FILE_COLUMN_CONFIG] [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: view.columns handler opens ColumnOrderDialog; Apply updates fileColumns

```
IMPL-WORKSPACE_VIEW_ColumnOrderDialogHandler():
  INPUT: view.columns action, fileColumns, copy.columns labels
  OUTPUT: ColumnOrderDialog open/apply updates fileColumns
  PRE: toolbar view.columns action available
  POST: dialog opens on action; Apply updates fileColumns state
  EFFECTS: State, IO
  TERMINATION: total
  handlers.set("view.columns", () => setColumnOrderDialogOpen(true))
  RENDER ColumnOrderDialog isOpen=columnOrderDialogOpen columns=fileColumns labels=copy.columns onApply=setFileColumns
  PASS toolbars.actions as actionsMeta to Toolbar tiers for view.columns button metadata
```

## SHARED_METADATA_WIDTHS_ONECOLUMN

// [IMPL-WORKSPACE_VIEW] [IMPL-FILE_COLUMN_CONFIG] [REQ-MULTI_PANE_LAYOUT] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: useMemo when layout is OneColumn computes measureFileMetadataColumnWidthsForPanes across all pane files

```
IMPL-WORKSPACE_VIEW_SharedMetadataWidthsOneColumn(layout, panes, fileColumns):
  INPUT: layout LayoutType, panes[], fileColumns
  OUTPUT: metadataColumnWidths OR undefined
  PRE: layout and pane file listings available
  POST: shared metadata widths computed for OneColumn else undefined
  EFFECTS: pure
  TERMINATION: total
  IF layout !== OneColumn THEN metadataColumnWidths := undefined
  ELSE metadataColumnWidths := measureFileMetadataColumnWidthsForPanes(panes.map(p => p.files), getVisibleFileColumns(fileColumns))
  PASS metadataColumnWidths to each FilePane
```

## PANE_FILES_LIST_TO_FILEPANE

// [IMPL-WORKSPACE_VIEW] [IMPL-FILE_PANE] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how: pass workspace pane listings into each FilePane for cross-pane path clipboard resolution

```
IMPL-WORKSPACE_VIEW_PaneFilesListToFilePane(panes):
  INPUT: panes[] with files listings
  OUTPUT: paneFilesList prop per FilePane
  PRE: panes array available
  POST: each FilePane receives full paneFilesList for cross-pane resolution
  EFFECTS: pure
  TERMINATION: total
  FOR each FilePane in panes map
    PASS paneFilesList={panes.map(p => p.files)} prop
```

## HANDLE_NAVIGATE

// [IMPL-WORKSPACE_VIEW] [IMPL-DIRECTORY_TREE] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [IMPL-LINKED_NAV] [ARCH-DIRECTORY_TREE] [ARCH-CROSS_PANE_VISIBILITY] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-DIRECTORY_TREE] [REQ-CROSS_PANE_VISIBILITY] [REQ-LINKED_PANES]: how: fetch listing, re-root tree, merge visibility; linked sync only on initiating navigate

```
IMPL-WORKSPACE_VIEW_HandleNavigate(paneIndex, newPath):
  INPUT: paneIndex, newPath
  OUTPUT: updated pane with listing, tree, cross-pane fields; linked sync when initiating
  PRE: paneIndex valid; newPath provided
  POST: pane navigated with tree reset and cross-pane merge; linked propagation when initiating
  EFFECTS: State, IO
  TERMINATION: total
  IF panes[paneIndex] missing THEN RETURN
  listing := fetchDirectoryListing(newPath, pane.activeDisplaySpecId)
  built := buildPaneFromRawListing(listing.files, { ...pane, path: newPath }, ...)
  withTree := createPaneTreeFromRootListing(built, built.files)
  updated[paneIndex] := mergePaneState(withTree, crossPaneFieldsFromPane, restoredCursor?)
  APPLY restored cursor from directory history
  IF linkedMode AND isInitiatingNavigation THEN sync linked panes downward or upward
```

## MERGE_PANE_TREE_STATE

// [IMPL-WORKSPACE_VIEW] [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE]: how: combine listing+treeState with cross-pane visibility fields without dropping treeState

```
IMPL-WORKSPACE_VIEW_MergePaneTreeState(listing, crossPane, cursorOverride):
  INPUT: listing, crossPane fields, optional cursor override
  OUTPUT: merged pane state
  PRE: listing with treeState and cross-pane fields available
  POST: merged pane retains treeState and optional cursor override
  EFFECTS: pure
  TERMINATION: total
  RETURN { ...mergePaneListingWithCrossPaneFields(listing, crossPane), treeState: listing.treeState, optional cursor override }
```

## REFRESH_PANE_TREE

// [IMPL-WORKSPACE_VIEW] [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE] [REQ-PANE_REFRESH]: how: reload base and expandedPaths listings; preserve expandedPaths; re-flatten via syncPaneFromTree

```
IMPL-WORKSPACE_VIEW_RefreshPaneTree(paneIndex):
  INPUT: paneIndex
  OUTPUT: pane refreshed with preserved expandedPaths
  PRE: pane with treeState.expandedPaths available
  POST: listings reloaded; expandedPaths preserved; pane synced from tree
  EFFECTS: State, IO
  TERMINATION: total
  expandedPaths := copy pane.treeState.expandedPaths
  rootListing := fetchDirectoryListing(pane.path, activeDisplaySpecId)
  treeState := createInitialTreeState(pane.path, processed root children)
  FOR EACH path IN expandedPaths
    listing := fetchDirectoryListing(path, activeDisplaySpecId)
    treeState := setChildren(treeState, path, processed children)
  treeState.expandedPaths := expandedPaths
  pane := mergePaneState(syncPaneFromTree({ ...pane, treeState }), existing crossPane fields)
  USE after bulk copy/move/delete on source pane instead of handleNavigate(same path)
```

## HANDLE_TOGGLE_EXPAND

// [IMPL-WORKSPACE_VIEW] [IMPL-DIRECTORY_TREE] [IMPL-LINKED_NAV] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE] [REQ-LINKED_PANES]: how: lazy fetch on first expand; toggle expandedPaths; NO linked pane propagation

```
IMPL-WORKSPACE_VIEW_HandleToggleExpand(paneIndex, dirPath):
  INPUT: paneIndex, dirPath
  OUTPUT: updated pane treeState on initiating pane only
  PRE: directory path on initiating pane
  POST: expandedPaths toggled; children loaded on first expand; no linked sync
  EFFECTS: State, IO
  TERMINATION: total
  IF dir expanded THEN toggleExpanded collapse
  ELSE IF children not loaded THEN fetchDirectoryListing(dirPath) AND setChildren THEN toggleExpanded
  ELSE toggleExpanded
  updated[paneIndex] := mergePaneState(syncPaneFromTree({ ...pane, treeState }), crossPane fields)
  navigate.enter keybinding calls this NOT handleNavigate
```

## LAYOUT_TOOLBAR_PICKER

// [IMPL-WORKSPACE_VIEW] [IMPL-LAYOUT_CALCULATOR] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM] [REQ-KEYBOARD_NAVIGATION] [REQ-WORKSPACE_MESH_BRIDGE]: how: view.layout handler opens LayoutPickerPopover; option selects layout and closes

```
IMPL-WORKSPACE_VIEW_LayoutToolbarPicker():
  INPUT: view.layout action, layoutPickerOpen, copy.layouts labels, current LayoutType
  OUTPUT: setLayout(LayoutType); LayoutPickerPopover rendered when layoutPickerOpen
  DATA: test ids workspace-layout-picker, workspace-layout-option-{LayoutType}, workspace-layout-picker-overlay
  PRE: view.layout action and layout state available
  POST: layout selected and popover closed OR closed without change on Escape/overlay
  EFFECTS: State, IO
  TERMINATION: total
  layoutPickerOpen := useState(false)
  handlers.set("view.layout", () => setLayoutPickerOpen(true))
  RENDER LayoutPickerPopover isOpen=layoutPickerOpen currentLayout=layout labels=copy.layouts
  ON option click setLayout(selected) AND setLayoutPickerOpen(false)
  ON Escape OR overlay click setLayoutPickerOpen(false) without layout change
  HIGHLIGHT current layout option; toolbar view.layout button active while pop-over open
  calculateLayout uses layout state for pane bounds (Tile, OneRow, OneColumn, Fullscreen)
```

## SetBaseDirectoryDialog

// [IMPL-WORKSPACE_VIEW] [ARCH-PANE_LIFECYCLE] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION] [REQ-MULTI_PANE_LAYOUT]: how — secondary dialog with nine pane-target buttons plus Cancel

```
IMPL-WORKSPACE_VIEW_SetBaseDirectoryDialog(isOpen, directoryPath, initiatingPaneIndex, paneCount, allowPaneManagement, atMaxPanes):
  INPUT: isOpen, directoryPath, initiatingPaneIndex, paneCount, allowPaneManagement, atMaxPanes, labels from copy.paneManagement
  OUTPUT: onApply(SetBaseDirectoryTarget) then onClose
  DATA: data-testid set-base-directory-dialog, per-target button test ids, SetBaseDirectoryTargetIcon per target
  PRE: dialog open with directory path and pane context
  POST: target selected and dialog closed OR cancelled
  EFFECTS: IO
  TERMINATION: total
  IF NOT isOpen THEN RETURN null
  RENDER overlay dialog role=dialog aria-label=setBaseDirectoryTitle
  SHOW directoryPath truncated monospace
  RENDER nine action buttons matching target labels WITH SetBaseDirectoryTargetIcon
  DISABLE other/next/prior/swap targets WHEN paneCount less than 2
  DISABLE swap targets WHEN NOT allowPaneManagement
  DISABLE newPane WHEN NOT allowPaneManagement OR atMaxPanes
  ON target click → onApply(target) AND onClose
  ON Escape OR overlay → onClose
```

## SetBaseDirectoryTargetIcon

// [IMPL-WORKSPACE_VIEW] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]: how — 36px SVG per SetBaseDirectoryTarget with semantic color roles

```
IMPL-WORKSPACE_VIEW_SetBaseDirectoryTargetIcon(target):
  INPUT: target SetBaseDirectoryTarget
  OUTPUT: aria-hidden SVG (SET_BASE_ICON_SIZE 36, strokeWidth 1.5)
  DATA: INITIATING (blue), TARGET (emerald), INACTIVE (zinc), DIRECTION (amber), SWAP (violet), NEW_WORKSPACE (sky)
  PRE: target enum value provided
  POST: SVG glyph rendered with semantic color role
  EFFECTS: pure
  TERMINATION: total
  SWITCH target → render pane-rect glyphs with role classes
```

## SetBaseDirectoryTargetResolution

// [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how — pure helpers; newPane and newWorkspace return empty pane-target list

```
IMPL-WORKSPACE_VIEW_SetBaseDirectoryTargetResolution(target, initiatingPaneIndex, paneCount):
  INPUT: target SetBaseDirectoryTarget, initiatingPaneIndex, paneCount
  OUTPUT: pane index list or empty; swap pair or null; pane-management requirement flag
  DATA: neighborIndexNext, neighborIndexPrev from pane-order
  PRE: target and pane indices available
  POST: pane targets, swap pair, or management flag resolved
  EFFECTS: pure
  TERMINATION: total
  isSetBaseDirectoryTargetRequiresPaneManagement(target) RETURN isSetBaseDirectorySwapTarget(target) OR target equals newPane
  resolveSetBaseDirectoryPaneTargets(target, initiatingPaneIndex, paneCount)
  IF target equals newWorkspace OR target equals newPane OR paneCount less than 1 THEN RETURN []
  ELSE map target to pane index list per switch
```

## SetBaseDirectoryApply

// [IMPL-WORKSPACE_VIEW] [IMPL-PANE_MANAGEMENT] [IMPL-LINKED_NAV] [ARCH-PANE_LIFECYCLE] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how — resolve pane targets; navigate; swap or append pane; newWorkspace opens window

```
IMPL-WORKSPACE_VIEW_SetBaseDirectoryApply(target, path, initiatingPaneIndex):
  INPUT: target SetBaseDirectoryTarget, path, initiatingPaneIndex, panes.length
  OUTPUT: pane paths updated; optional pane swap; optional appended pane; optional new tab
  DATA: resolveSetBaseDirectoryPaneTargets, resolveSetBaseDirectorySwapPair, appendPaneAtPath
  PRE: target, path, and initiating pane available
  POST: panes updated per target; swap or new pane when applicable
  EFFECTS: State, IO
  TERMINATION: total
  IF target equals newPane
    newIndex := await appendPaneAtPath(path, initiatingPaneIndex)
    IF newIndex NOT null THEN setFocusIndex(newIndex)
    RETURN
  paneTargets := resolveSetBaseDirectoryPaneTargets(target, initiatingPaneIndex, paneCount)
  swapPair := resolveSetBaseDirectorySwapPair(target, initiatingPaneIndex, paneCount)
  IF target equals newWorkspace
    window.open(`/files?panes=1&pane0=${encodeURIComponent(path)}`, "_blank", "noopener,noreferrer")
    RETURN
  FOR EACH idx IN paneTargets
    IF target equals thisPane
      await handleNavigate(idx, path)
    ELSE
      syncingRef.add(idx)
      TRY await handleNavigate(idx, path)
      FINALLY syncingRef.delete(idx)
  IF swapPair THEN handleSwapPanes(swapPair[0], swapPair[1])
```

## NavigateAbsoluteBase

// [IMPL-WORKSPACE_VIEW] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES]: how — multi-target base directory assignment uses syncingRef to suppress linked relative sync

```
IMPL-WORKSPACE_VIEW_NavigateAbsoluteBase(paneIndex, path, allowLinkedPropagation):
  INPUT: paneIndex, path, allowLinkedPropagation
  OUTPUT: pane navigated with optional linked propagation suppressed
  PRE: paneIndex and path available
  POST: handleNavigate invoked with or without syncingRef guard
  EFFECTS: State, IO
  TERMINATION: total
  IF allowLinkedPropagation
    await handleNavigate(paneIndex, path)
  ELSE
    syncingRef.add(paneIndex)
    TRY await handleNavigate(paneIndex, path)
    FINALLY syncingRef.delete(paneIndex)
```

## TouchApply

// [IMPL-WORKSPACE_VIEW] [IMPL-TOUCH_DIALOG] [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — dialog state, buildTouchEntries, POST bulk-touch, refresh panes

```
IMPL-WORKSPACE_VIEW_TouchApply(dialogState, selection):
  INPUT: touchFileDialog state (paneIndex, file, marksAtOpen), TouchApplySelection from TouchFileDialog
  OUTPUT: POST bulk-touch; close dialog; refresh affected pane listings
  DATA: buildTouchEntries from touch-file.ts; displaySpecPayload for initiating pane
  PRE: touch dialog state and user selection available
  POST: bulk-touch posted; dialog closed; affected panes refreshed
  EFFECTS: IO, State
  FAILURE_MODES: EMPTY_ENTRIES; HTTP_ERROR
  TERMINATION: total
  entries := buildTouchEntries(selection.paneTarget, selection.mtimeMode, selection.specifiedDate, dialogState.paneIndex, paneFilesList, dialogState.marksAtOpen, dialogState.file)
  IF entries.length == 0: alert; RETURN
  close touchFileDialog
  POST /api/files { operation: "bulk-touch", entries: ISO mtimes, ...displaySpecPayload }
  ON success:
    paneIndicesToRefresh := { i | panes[i].files contains any entry.path }
    FOR EACH i IN paneIndicesToRefresh: refreshPaneTree(i) OR handleNavigate(i, panes[i].path) when tree reset required
  ON error: alert
```

## ExecuteApply

// [IMPL-WORKSPACE_VIEW] [IMPL-EXECUTE_DIALOG] [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — dialog state, buildExecuteEntries, POST execute-command, refresh affected pane listings

```
IMPL-WORKSPACE_VIEW_ExecuteApply(dialogState, selection):
  INPUT: executeFileDialog state (paneIndex, file, marksAtOpen), ExecuteApplySelection from ExecuteFileDialog
  OUTPUT: POST execute-command; close dialog; refresh affected pane listings via handleNavigate
  DATA: buildExecuteEntries from execute-command.ts
  PRE: execute dialog state and user selection available
  POST: execute-command posted; dialog closed; affected panes navigated/refreshed
  EFFECTS: IO, State
  FAILURE_MODES: EMPTY_ENTRIES; PARTIAL_FAILURE; HTTP_ERROR
  TERMINATION: total
  entries := buildExecuteEntries(selection.paneTarget, selection.command, dialogState.paneIndex, panes, dialogState.marksAtOpen, dialogState.file)
  IF entries.length == 0: alert; RETURN
  close executeFileDialog
  POST /api/files { operation: "execute-command", entries }
  ON success:
    FOR EACH entry.paneIndex: handleNavigate(entry.paneIndex, panes[entry.paneIndex].path)
  ON partial failure (errorCount > 0): alert summary with per-pane exit codes
  ON HTTP error: alert with error message
```

## CodeLocations

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT] [REQ-REACT_SSR_STABILITY]: map implementing and verifying source files for this IMPL

// src/app/files/WorkspaceView.tsx — DIALOG_KEYS, KEYBINDING_INIT, FILE_COLUMNS_STATE, COLUMN_ORDER_DIALOG_HANDLER, SHARED_METADATA_WIDTHS_ONECOLUMN, PANE_FILES_LIST_TO_FILEPANE, HANDLE_NAVIGATE, MERGE_PANE_TREE_STATE, REFRESH_PANE_TREE, HANDLE_TOGGLE_EXPAND, LAYOUT_TOOLBAR_PICKER, appendPaneAtPath, SetBaseDirectoryApply, TouchApply/handleApplyTouch, ExecuteApply/handleApplyExecute, NavigateAbsoluteBase; src/lib/file-tree.ts; src/lib/pane-file-tree.ts; src/lib/set-base-directory.ts; src/lib/touch-file.ts; src/lib/execute-command.ts; src/app/files/components/SetBaseDirectoryDialog.tsx; src/app/files/components/SetBaseDirectoryTargetIcon.tsx; src/app/files/components/TouchFileDialog.tsx; src/app/files/components/ExecuteFileDialog.tsx; src/app/files/components/LayoutPickerPopover.tsx; src/app/files/page.tsx SinglePaneWorkspaceUrl; tests WorkspaceView.file-columns.test.tsx, WorkspaceView.file-column-clipboard.test.tsx, WorkspaceView.cross-pane-visibility.test.tsx, WorkspaceView.directory-tree.test.tsx, WorkspaceView.set-base-directory.test.tsx, WorkspaceView.touch.test.tsx, WorkspaceView.execute.test.tsx, LayoutPickerPopover.test.tsx, set-base-directory.test.ts, SetBaseDirectoryDialog.test.tsx, SetBaseDirectoryTargetIcon.test.tsx, TouchFileDialog.test.tsx, ExecuteFileDialog.test.tsx, touch-file.test.ts, execute-command.test.ts, file-tree.test.ts, pane-file-tree.test.ts
