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

## CodeLocations

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT] [REQ-REACT_SSR_STABILITY]: map implementing and verifying source files for this IMPL

// src/app/files/WorkspaceView.tsx — DIALOG_KEYS, KEYBINDING_INIT, FILE_COLUMNS_STATE, COLUMN_ORDER_DIALOG_HANDLER, SHARED_METADATA_WIDTHS_ONECOLUMN, PANE_FILES_LIST_TO_FILEPANE, HANDLE_NAVIGATE, LAYOUT_TOOLBAR_PICKER; src/app/files/components/LayoutPickerPopover.tsx; tests WorkspaceView.file-columns.test.tsx, WorkspaceView.file-column-clipboard.test.tsx, WorkspaceView.cross-pane-visibility.test.tsx, LayoutPickerPopover.test.tsx
