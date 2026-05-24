# IMPL-FILE_PANE essence pseudocode

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: Top-level File Pane Component: Client component renders file list with cursor, marks, comparison colors, and proper date conversion

## Summary contract

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-FILE_PANE
  DATA: state and configuration per implementation_approach

## RenderFileRows

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: virtualized list of files with cursor mark and comparison classes

CONTRACT RenderFileRows
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_PANE_RenderFileRows(context)
  FOR EACH file IN pane.files
  IF index equals cursor THEN apply focus row class
  IF name IN marks THEN apply marked checkbox state
  // APPLY comparison color classes from enhanced index
  CALL APPLY comparison color classes from enhanced index

## TABULAR_FILE_ROW_GRID

// [IMPL-FILE_PANE] [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: how: file rows render as CSS grid with aligned metadata columns; no file-row-grid-header

```
PROCEDURE TABULAR_FILE_ROW_GRID(context)
  visibleColumns := getVisibleFileColumns(columns)
  measuredWidths := metadataColumnWidths OR measureFileMetadataColumnWidths(files, visibleColumns)
  metadataGridTemplate := buildFileRowGridTemplate(visibleColumnIds, measuredWidths)
  rowGridTemplate := "auto auto " + metadataGridTemplate
  FOR each file RENDER grid row data-testid=file-row-grid with renderColumn cells data-testid=file-column-{id}
```

## METADATA_COLUMN_WIDTHS_PROP

// [IMPL-FILE_PANE] [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: optional metadataColumnWidths from workspace skips per-pane measure for OneColumn shared alignment

```
PROCEDURE METADATA_COLUMN_WIDTHS_PROP(context)
  INPUT: metadataColumnWidths?: MeasuredFileColumnWidths from WorkspaceView
  IF provided THEN use for buildFileRowGridTemplate
  ELSE measureFileMetadataColumnWidths(files, visibleColumns) in useMemo per pane
```

## PANE_FILES_LIST_PROP

// [IMPL-FILE_PANE] [IMPL-WORKSPACE_VIEW] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how: optional paneFilesList prop defaults to []; forwarded to FileColumnContextMenu for cross-pane path resolution

```
PROCEDURE PANE_FILES_LIST_PROP(context)
  INPUT: paneFilesList?: readonly FileStat[][] from WorkspaceView panes[].files
  DEFAULT paneFilesList := []
  PASS paneFilesList to FileColumnContextMenu
```

## FILE_COLUMN_CONTEXT_MENU_WIRING

// [IMPL-FILE_PANE] [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how: column cell right-click opens clipboard menu; mutually exclusive with row ContextMenu; moves cursor to clicked row

```
PROCEDURE FILE_COLUMN_CONTEXT_MENU_WIRING(context)
  STATE columnContextMenu { x, y, file } separate from contextMenu (row file operations)
  ON column cell contextMenu → preventDefault; stopPropagation; clear contextMenu
  IF row index !== cursor THEN onCursorMove(index)
  SET columnContextMenu at clientX/clientY
  ON row contextMenu → clear columnContextMenu (mutual exclusion)
  ATTACH onContextMenu to each renderColumn cell (name, size, mtime) via columnContextProps
  RENDER FileColumnContextMenu WHEN columnContextMenu set with paneFilesList
```

## ScrollToCursor

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: scrollIntoView when scrollTrigger prop changes from linked sync

CONTRACT ScrollToCursor
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_PANE_ScrollToCursor(context)
  ON scrollTrigger change FIND row ref for cursor index
  CALL scrollIntoView block center behavior smooth

## CodeLocations

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/components/FilePane.tsx — File pane component; FILE_COLUMN_CONTEXT_MENU_WIRING
// FILE: src/app/files/components/FilePane.test.tsx — File pane tests including column context menu
// FUNCTION: FilePane in src/app/files/components/FilePane.tsx
// FUNCTION: handleColumnContextMenu, renderColumn in FilePane.tsx

## ErrorHandling

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-FILE_PANE_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
