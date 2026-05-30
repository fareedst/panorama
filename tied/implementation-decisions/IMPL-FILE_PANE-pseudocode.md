# IMPL-FILE_PANE essence pseudocode

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: Client FilePane renders listing rows, marks, comparison colors, tabular columns, context menus

## Summary contract

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: bound module inputs, outputs, and shared data for all runtime blocks below

```
CONTRACT Summary
  INPUT: path, files[], cursor, marks Set, columns, optional metadataColumnWidths, paneFilesList, scrollTrigger, comparisonMode/Index
  OUTPUT: rendered file rows; onNavigate, onCursorMove, onToggleMark, onDrop callbacks
  DATA: contextMenu and columnContextMenu state; fileListRef for scrollIntoView
  CONTROL: row and column context menus mutually exclusive
```

## RenderFileRows

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: how: map files to grid rows with cursor, mark, and comparison styling

```
PROCEDURE RenderFileRows(context)
  IF files.length = 0 THEN RENDER empty OR filter-empty message when rawFileCount > 0
  FOR EACH file AT index
    isCursor := cursor >= 0 AND index = cursor
    isMarked := marks.has(file.name)
    comparisonClass := getComparisonClass(file.name) from comparisonIndex
    RENDER row data-testid=file-row-grid
      style gridTemplateColumns = rowGridTemplate
      class cursor blue OR marked yellow OR comparisonClass OR hover
      onClick move cursor; onDoubleClick navigate if directory
      draggable with handleDragStart (marked set or single file)
```

## TABULAR_FILE_ROW_GRID

// [IMPL-FILE_PANE] [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: how: CSS grid template from measured or injected metadata widths; no header row

```
PROCEDURE TABULAR_FILE_ROW_GRID(context)
  visibleColumns := getVisibleFileColumns(columns)
  measuredWidths := metadataColumnWidths OR measureFileMetadataColumnWidths(files, visibleColumns)
  metadataGridTemplate := buildFileRowGridTemplate(visibleColumnIds, measuredWidths)
  rowGridTemplate := "auto auto " + metadataGridTemplate
  FOR each file RENDER checkbox slot, folder icon slot, renderColumn per visible id
  data-testid=file-column-{id} on metadata cells
```

## METADATA_COLUMN_WIDTHS_PROP

// [IMPL-FILE_PANE] [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: optional metadataColumnWidths skips per-pane measure in OneColumn layout

```
PROCEDURE METADATA_COLUMN_WIDTHS_PROP(context)
  INPUT metadataColumnWidths from WorkspaceView when OneColumn shared measure
  useMemo measuredWidths := prop OR measureFileMetadataColumnWidths(files, visibleColumns)
```

## PANE_FILES_LIST_PROP

// [IMPL-FILE_PANE] [IMPL-WORKSPACE_VIEW] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how: paneFilesList defaults []; passed to FileColumnContextMenu for cross-pane paths

```
PROCEDURE PANE_FILES_LIST_PROP(context)
  DEFAULT paneFilesList := []
  PASS to FileColumnContextMenu for clipboard path resolution across panes
```

## FILE_COLUMN_CONTEXT_MENU_WIRING

// [IMPL-FILE_PANE] [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how: column cell context menu exclusive with row file operations menu

```
PROCEDURE FILE_COLUMN_CONTEXT_MENU_WIRING(context)
  ON column cell contextMenu preventDefault; stopPropagation; clear contextMenu
  IF index != cursor THEN onCursorMove(index)
  SET columnContextMenu at client coordinates
  ON row contextMenu clear columnContextMenu; move cursor; open file operations menu
  renderColumn attaches onContextMenu to name, size, mtime cells
  RENDER FileColumnContextMenu when columnContextMenu set
```

## ScrollToCursor

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-LINKED_PANES]: how: scrollTrigger effect scrolls focused row into view

```
PROCEDURE ScrollToCursor(context)
  IF scrollTrigger undefined OR scrollTrigger < 0 THEN RETURN
  FIND child row at scrollTrigger index
  CALL scrollIntoView block center behavior smooth
```

## PaneFooter

// [IMPL-FILE_PANE] [IMPL-FILE_MARKING] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING]: how: footer shows cursor position, sort label, marked count when visible

```
PROCEDURE PaneFooter(context)
  SHOW footer WHEN files.length > 0 OR marks.size > 0 OR hiddenCount > 0
  DISPLAY cursor+1 / files.length OR "- / N" when cursor = -1
  DISPLAY sort indicator from sortBy, sortDirection, sortDirsFirst
  IF marks.size > 0 DISPLAY [{marks.size} marked] with accent class
```

## CodeLocations

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: map implementing and verifying source files for this IMPL

```
// FILE: src/app/files/components/FilePane.tsx — FilePane component
// FILE: src/app/files/components/FilePane.test.tsx — grid, column menu, width tests
// FUNCTION: handleColumnContextMenu, renderColumn, getComparisonClass in FilePane.tsx
```

## ErrorHandling

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: how: drop handler catches JSON parse errors; missing onToggleMark skips checkbox action

```
PROCEDURE IMPL-FILE_PANE_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ON drop parse failure LOG error; DO NOT mutate pane listing
```
