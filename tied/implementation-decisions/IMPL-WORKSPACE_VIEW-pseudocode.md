# IMPL-WORKSPACE_VIEW essence pseudocode

## DIALOG_KEYS

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-REACT_SSR_STABILITY] [REQ-FILE_SEARCH]: how: FinderDialog and SearchDialog use distinct open/closed React keys (finder-open/finder-closed, search-open/search-closed) to force remount when toggling visibility and avoid duplicate key warnings

```
CONTRACT DialogKeys
  INPUT: showFinderDialog, showSearchDialog boolean state
  OUTPUT: stable remount on dialog open/close
  DATA: key prop on FinderDialog and SearchDialog

PROCEDURE DIALOG_KEYS
  FinderDialog key := showFinderDialog ? "finder-open" : "finder-closed"
  SearchDialog key := showSearchDialog ? "search-open" : "search-closed"
  OTHER modals use isOpen without alternating keys (ColumnOrderDialog, HelpOverlay, etc.)
```

## PANE_URL_DEEP_LINK_INIT

// [IMPL-WORKSPACE_VIEW] [ARCH-PANE_LIFECYCLE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-MULTI_PANE_LAYOUT] [REQ-README_DEMO_AUTOMATION]: how: on mount read pane0..paneN from URLSearchParams and call handleNavigate per index unless mesh restore skipped; enables E2E and bookmarkable multi-pane paths (Pane URL deep link)

```
CONTRACT PaneUrlDeepLinkInit
  INPUT: window.location.search, panes.length, restoredFromMesh, clientRestoredFromMesh, meshRehydrating
  OUTPUT: panes navigated to URL-specified directory paths
  DATA: query keys pane0, pane1, pane2, ...; staggered setTimeout index * 100ms per navigate

PROCEDURE PANE_URL_DEEP_LINK_INIT
  IF restoredFromMesh OR clientRestoredFromMesh OR meshRehydrating THEN RETURN
  COLLECT panePathsFromUrl := searchParams.get(`pane${i}`) for i in 0..panes.length-1
  IF panePathsFromUrl.length > 0
    FOR EACH (panePath, index) IN panePathsFromUrl
      SCHEDULE handleNavigate(index, panePath) after index * 100ms delay
  RUN once on mount (deps: mesh restore flags only)
```

## KEYBINDING_INIT

// [IMPL-WORKSPACE_VIEW] [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-KEYBOARD_NAVIGATION]: how: useMemo builds workspaceActionHandlers and paneActionHandlers maps; merged into actionHandlers; window keydown and handleExecuteAction dispatch through merged map

```
CONTRACT KeybindingInit
  INPUT: panes, focusIndex, linkedMode, crossPaneVisibilityResult, handler callbacks
  OUTPUT: actionHandlers Map<string, () => void>
  DATA: workspaceActionHandlers (mesh, help, compare-filter tri-state), paneActionHandlers (nav, file ops, view, marking)

PROCEDURE KEYBINDING_INIT
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
PROCEDURE FILE_COLUMNS_STATE(context)
  fileColumns := useState(() => normalizeFileColumns(loadedSnapshotProp?.fileColumns, columns))
  ON mesh restore setFileColumns(normalizeFileColumns(bundle.snapshot.fileColumns, columns))
  ON limited client rehydrate WHEN limited.fileColumns setFileColumns(normalizeFileColumns(...))
  PASS fileColumns to each FilePane as columns prop
```

## COLUMN_ORDER_DIALOG_HANDLER

// [IMPL-WORKSPACE_VIEW] [IMPL-FILE_COLUMN_CONFIG] [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: view.columns handler opens ColumnOrderDialog; Apply updates fileColumns; no keyboard shortcut

```
PROCEDURE COLUMN_ORDER_DIALOG_HANDLER(context)
  handlers.set("view.columns", () => setColumnOrderDialogOpen(true))
  RENDER ColumnOrderDialog isOpen=columnOrderDialogOpen columns=fileColumns labels=copy.columns onApply=setFileColumns
  PASS toolbars.actions as actionsMeta to Toolbar tiers for view.columns button metadata
```

## SHARED_METADATA_WIDTHS_ONECOLUMN

// [IMPL-WORKSPACE_VIEW] [IMPL-FILE_COLUMN_CONFIG] [REQ-MULTI_PANE_LAYOUT] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: useMemo when layout is OneColumn computes measureFileMetadataColumnWidthsForPanes across all pane files

```
PROCEDURE SHARED_METADATA_WIDTHS_ONECOLUMN(context)
  IF layout !== OneColumn THEN metadataColumnWidths := undefined
  ELSE metadataColumnWidths := measureFileMetadataColumnWidthsForPanes(panes.map(p => p.files), getVisibleFileColumns(fileColumns))
  PASS metadataColumnWidths to each FilePane
```

## PANE_FILES_LIST_TO_FILEPANE

// [IMPL-WORKSPACE_VIEW] [IMPL-FILE_PANE] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how: pass workspace pane listings into each FilePane for cross-pane path clipboard resolution

```
PROCEDURE PANE_FILES_LIST_TO_FILEPANE(context)
  FOR each FilePane in panes map
    PASS paneFilesList={panes.map(p => p.files)} prop
```

## HANDLE_NAVIGATE

// [IMPL-WORKSPACE_VIEW] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-CROSS_PANE_VISIBILITY] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-CROSS_PANE_VISIBILITY]: how: fetch listing, build pane with new path, merge visibility fields via MERGE_LISTING_WITH_CROSS_PANE_FIELDS

```
PROCEDURE HandleNavigate(paneIndex, newPath)
  INPUT: paneIndex, newPath
  IF panes[paneIndex] missing THEN RETURN
  listing := fetchDirectoryListing(newPath, pane.activeDisplaySpecId)
  built := buildPaneFromRawListing(listing.files, { ...pane, path: newPath }, ...)
  updated[paneIndex] := MERGE_LISTING_WITH_CROSS_PANE_FIELDS(built, crossPaneFieldsFromPane)
  APPLY restored cursor from directory history
  IF linkedMode AND isInitiatingNavigation THEN sync linked panes downward or upward
```

## LAYOUT_TOOLBAR_PICKER

// [IMPL-WORKSPACE_VIEW] [IMPL-LAYOUT_CALCULATOR] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM] [REQ-KEYBOARD_NAVIGATION] [REQ-WORKSPACE_MESH_BRIDGE]: how: view.layout handler opens LayoutPickerPopover; option selects layout and closes; Escape or overlay closes without change; activeActions includes view.layout while open

```
CONTRACT LayoutToolbarPicker
  INPUT: view.layout action, layoutPickerOpen, copy.layouts labels, current LayoutType
  OUTPUT: setLayout(LayoutType); LayoutPickerPopover rendered when layoutPickerOpen
  DATA: test ids workspace-layout-picker, workspace-layout-option-{LayoutType}, workspace-layout-picker-overlay

PROCEDURE LAYOUT_TOOLBAR_PICKER(context)
  layoutPickerOpen := useState(false)
  handlers.set("view.layout", () => setLayoutPickerOpen(true))
  RENDER LayoutPickerPopover isOpen=layoutPickerOpen currentLayout=layout labels=copy.layouts
  ON option click setLayout(selected) AND setLayoutPickerOpen(false)
  ON Escape OR overlay click setLayoutPickerOpen(false) without layout change
  HIGHLIGHT current layout option; toolbar view.layout button active while pop-over open
  calculateLayout uses layout state for pane bounds (Tile, OneRow, OneColumn, Fullscreen)
```

## SetBaseDirectoryDialog

// [IMPL-WORKSPACE_VIEW] [ARCH-PANE_LIFECYCLE] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION] [REQ-MULTI_PANE_LAYOUT]: how — secondary dialog with nine pane-target buttons plus Cancel; each button shows SetBaseDirectoryTargetIcon with semantic multi-color roles; disabled when paneCount less than 2, swap when allowPaneManagement false, or newPane when at max panes

```
CONTRACT SetBaseDirectoryDialog
  INPUT: isOpen, directoryPath, initiatingPaneIndex, paneCount, allowPaneManagement, atMaxPanes, labels from copy.paneManagement
  OUTPUT: onApply(SetBaseDirectoryTarget) then onClose
  DATA: data-testid set-base-directory-dialog, per-target button test ids, SetBaseDirectoryTargetIcon per target

PROCEDURE SetBaseDirectoryDialog(context)
  IF NOT isOpen THEN RETURN null
  RENDER overlay dialog role=dialog aria-label=setBaseDirectoryTitle
  SHOW directoryPath truncated monospace
  RENDER nine action buttons matching target labels WITH SetBaseDirectoryTargetIcon (initiating blue, target emerald, direction amber, swap violet, new pane plus-on-emerald, new workspace sky; 36px strokeWidth 1.5)
  DISABLE other/next/prior/swap targets WHEN paneCount less than 2
  DISABLE swap targets WHEN NOT allowPaneManagement
  DISABLE newPane WHEN NOT allowPaneManagement OR atMaxPanes
  ON target click → onApply(target) AND onClose
  ON Escape OR overlay → onClose
```

## SetBaseDirectoryTargetIcon

// [IMPL-WORKSPACE_VIEW] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]: how — 36px SVG per SetBaseDirectoryTarget with semantic color roles on dialog action buttons

```
CONTRACT SetBaseDirectoryTargetIcon
  INPUT: target SetBaseDirectoryTarget
  OUTPUT: aria-hidden SVG (SET_BASE_ICON_SIZE 36, strokeWidth 1.5)
  DATA: INITIATING (blue), TARGET (emerald), INACTIVE (zinc), DIRECTION (amber), SWAP (violet), NEW_WORKSPACE (sky)

PROCEDURE SetBaseDirectoryTargetIcon(target)
  SWITCH target → render pane-rect glyphs with role classes
```

## SetBaseDirectoryTargetResolution

// [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how — pure helpers in set-base-directory lib; newPane and newWorkspace return empty pane-target list for handleNavigate loop

```
CONTRACT SetBaseDirectoryTargetResolution
  INPUT: target SetBaseDirectoryTarget, initiatingPaneIndex, paneCount
  OUTPUT: pane index list or empty; swap pair or null; pane-management requirement flag
  DATA: neighborIndexNext, neighborIndexPrev from pane-order

PROCEDURE isSetBaseDirectoryTargetRequiresPaneManagement(target)
  RETURN isSetBaseDirectorySwapTarget(target) OR target equals newPane

PROCEDURE resolveSetBaseDirectoryPaneTargets(target, initiatingPaneIndex, paneCount)
  IF target equals newWorkspace OR target equals newPane OR paneCount less than 1 THEN RETURN []
  ELSE map target to pane index list per switch
```

## SetBaseDirectoryApply

// [IMPL-WORKSPACE_VIEW] [IMPL-PANE_MANAGEMENT] [IMPL-LINKED_NAV] [ARCH-PANE_LIFECYCLE] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how — resolve pane targets; navigate via handleNavigate; swap variants call handleSwapPanes after neighbor navigate; newPane calls appendPaneAtPath; newWorkspace opens window with single-pane URL

```
CONTRACT SetBaseDirectoryApply
  INPUT: target SetBaseDirectoryTarget, path, initiatingPaneIndex, panes.length
  OUTPUT: pane paths updated; optional pane swap; optional appended pane; optional new tab
  DATA: resolveSetBaseDirectoryPaneTargets, resolveSetBaseDirectorySwapPair, appendPaneAtPath from set-base-directory lib and WorkspaceView

PROCEDURE SetBaseDirectoryApply(context)
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
      await handleNavigate(idx, path)  // initiating navigation; linked propagation applies
    ELSE
      syncingRef.add(idx)
      TRY await handleNavigate(idx, path)  // suppress linked fan-out
      FINALLY syncingRef.delete(idx)
  IF swapPair THEN handleSwapPanes(swapPair[0], swapPair[1])
```

## NavigateAbsoluteBase

// [IMPL-WORKSPACE_VIEW] [IMPL-LINKED_NAV] [ARCH-LINKED_NAV] [REQ-DIRECTORY_NAVIGATION] [REQ-LINKED_PANES]: how — multi-target base directory assignment marks target pane in syncingRef so isInitiatingNavigation is false and linked mode does not relative-sync other panes

```
PROCEDURE NavigateAbsoluteBase(paneIndex, path, allowLinkedPropagation)
  IF allowLinkedPropagation
    await handleNavigate(paneIndex, path)
  ELSE
    syncingRef.add(paneIndex)
    TRY await handleNavigate(paneIndex, path)
    FINALLY syncingRef.delete(paneIndex)
```

## TouchApply

// [IMPL-WORKSPACE_VIEW] [IMPL-TOUCH_DIALOG] [IMPL-TOUCH_MTIME] [ARCH-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — dialog state, buildTouchEntries, POST bulk-touch, refresh panes listing touched paths

```
CONTRACT TouchApply
  INPUT: touchFileDialog state (paneIndex, file, marksAtOpen), TouchApplySelection from TouchFileDialog
  OUTPUT: POST bulk-touch; close dialog; refresh affected pane listings via handleNavigate
  DATA: buildTouchEntries from touch-file.ts; displaySpecPayload for initiating pane

PROCEDURE handleApplyTouch(dialogState, selection)
  entries := buildTouchEntries(selection.paneTarget, selection.mtimeMode, selection.specifiedDate, dialogState.paneIndex, paneFilesList, dialogState.marksAtOpen, dialogState.file)
  IF entries.length == 0: alert; RETURN
  close touchFileDialog
  POST /api/files { operation: "bulk-touch", entries: ISO mtimes, ...displaySpecPayload }
  ON success:
    paneIndicesToRefresh := { i | panes[i].files contains any entry.path }
    FOR EACH i IN paneIndicesToRefresh: handleNavigate(i, panes[i].path)
  ON error: alert
```

## ExecuteApply

// [IMPL-WORKSPACE_VIEW] [IMPL-EXECUTE_DIALOG] [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — dialog state, buildExecuteEntries, POST execute-command, refresh affected pane listings

```
CONTRACT ExecuteApply
  INPUT: executeFileDialog state (paneIndex, file, marksAtOpen), ExecuteApplySelection from ExecuteFileDialog
  OUTPUT: POST execute-command; close dialog; refresh affected pane listings via handleNavigate
  DATA: buildExecuteEntries from execute-command.ts

PROCEDURE handleApplyExecute(dialogState, selection)
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

// src/app/files/WorkspaceView.tsx — DIALOG_KEYS, KEYBINDING_INIT, FILE_COLUMNS_STATE, COLUMN_ORDER_DIALOG_HANDLER, SHARED_METADATA_WIDTHS_ONECOLUMN, PANE_FILES_LIST_TO_FILEPANE, HANDLE_NAVIGATE, LAYOUT_TOOLBAR_PICKER, appendPaneAtPath, SetBaseDirectoryApply, TouchApply/handleApplyTouch, ExecuteApply/handleApplyExecute, NavigateAbsoluteBase; src/lib/set-base-directory.ts; src/lib/touch-file.ts; src/lib/execute-command.ts; src/app/files/components/SetBaseDirectoryDialog.tsx; src/app/files/components/SetBaseDirectoryTargetIcon.tsx; src/app/files/components/TouchFileDialog.tsx; src/app/files/components/ExecuteFileDialog.tsx; src/app/files/components/LayoutPickerPopover.tsx; src/app/files/page.tsx SinglePaneWorkspaceUrl; tests WorkspaceView.file-columns.test.tsx, WorkspaceView.file-column-clipboard.test.tsx, WorkspaceView.cross-pane-visibility.test.tsx, WorkspaceView.set-base-directory.test.tsx, WorkspaceView.touch.test.tsx, WorkspaceView.execute.test.tsx, LayoutPickerPopover.test.tsx, set-base-directory.test.ts, SetBaseDirectoryDialog.test.tsx, SetBaseDirectoryTargetIcon.test.tsx, TouchFileDialog.test.tsx, ExecuteFileDialog.test.tsx, touch-file.test.ts, execute-command.test.ts
