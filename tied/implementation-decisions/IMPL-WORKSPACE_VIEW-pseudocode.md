# IMPL-WORKSPACE_VIEW essence pseudocode

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT] [REQ-REACT_SSR_STABILITY]: Top-level Workspace View Client Component with Stable React Keys: Client component with unique dialog keys, useMemo keybinding initialization, and API integration

## Summary contract

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT] [REQ-REACT_SSR_STABILITY]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-WORKSPACE_VIEW
  DATA: state and configuration per implementation_approach

## DialogKeys

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT] [REQ-REACT_SSR_STABILITY]: unique React keys per dialog open state for finder and search

CONTRACT DialogKeys
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-WORKSPACE_VIEW_DialogKeys(context)
  // USE finder-open finder-closed keys not shared open closed
  CALL USE finder-open finder-closed keys not shared open closed
  // FORCE remount when toggling dialog visibility
  CALL FORCE remount when toggling dialog visibility

## KeybindingInit

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT] [REQ-REACT_SSR_STABILITY]: useMemo builds handler map once per panes and focus change

CONTRACT KeybindingInit
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-WORKSPACE_VIEW_KeybindingInit(context)
  // DEPEND on panes focusIndex linkedMode
  CALL DEPEND on panes focusIndex linkedMode
  // REGISTER navigation marking bulk view handlers including view.layout
  CALL REGISTER navigation marking bulk view handlers

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

## HandleNavigate

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

## LayoutToolbarPicker

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [ARCH-TOOLBAR_LAYOUT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM] [REQ-WORKSPACE_MESH_BRIDGE]: workspace layout selection via toolbar view.layout pop-over

CONTRACT LayoutToolbarPicker
  INPUT: view.layout action, layoutPickerOpen, copy.layouts labels, current LayoutType
  OUTPUT: setLayout(LayoutType); activeActions includes view.layout when open
  DATA: LayoutPickerPopover test ids workspace-layout-picker, workspace-layout-option-{LayoutType}

PROCEDURE IMPL-WORKSPACE_VIEW_LayoutToolbarPicker(context)
  // [IMPL-WORKSPACE_VIEW] [REQ-TOOLBAR_SYSTEM] [ARCH-TOOLBAR_ACTIONS]: view.layout handler opens pop-over
  IF view.layout dispatched THEN layoutPickerOpen := true
  // [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT]: option click selects layout and closes pop-over
  IF option clicked THEN setLayout(selected); layoutPickerOpen := false
  // [IMPL-WORKSPACE_VIEW] [REQ-KEYBOARD_NAVIGATION]: Escape or overlay click closes without change
  IF Escape OR overlay click THEN layoutPickerOpen := false
  // [IMPL-WORKSPACE_VIEW] [REQ-TOOLBAR_SYSTEM]: highlight current layout option; toolbar button active while open
  RENDER LayoutPickerPopover with labels from copy.layouts

## CodeLocations

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT] [REQ-REACT_SSR_STABILITY]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — Workspace client component with fixed dialog keys
// FILE: src/app/files/components/LayoutPickerPopover.tsx — layout toolbar picker pop-over
// FUNCTION: WorkspaceView in src/app/files/WorkspaceView.tsx
// FUNCTION: handleNavigate in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-WORKSPACE_VIEW] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_NAVIGATION] [REQ-KEYBOARD_NAVIGATION] [REQ-MULTI_PANE_LAYOUT] [REQ-REACT_SSR_STABILITY]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-WORKSPACE_VIEW_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
