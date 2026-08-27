# IMPL-FILE_PANE essence pseudocode

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION] [REQ-DIRECTORY_TREE]: Client FilePane renders flattened tree rows, marks, comparison colors, tabular columns, context menus

## Summary contract

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-FILE_PANE_Summary():
  INPUT: path, files[] (FileTreeRowLike with optional depth/isExpanded), cursor, marks Set of absolute paths, columns, optional metadataColumnWidths, paneFilesList, scrollTrigger, comparisonMode/Index, onToggleExpand?
  OUTPUT: rendered file rows; onNavigate (re-root base), onToggleExpand (tree expand), onCursorMove, onToggleMark(filePath), onDrop callbacks
  DATA: contextMenu and columnContextMenu state; fileListRef for scrollIntoView
  CONTROL: single contextMenu state for row and column right-click (unified ContextMenu)
  PRE: FilePane mounted with pane listing and column config
  POST: file rows rendered with cursor, marks, comparison styling, and footer when applicable
  EFFECTS: pure
  TERMINATION: total
```

## RenderFileRows

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: how: map files to grid rows with cursor, mark, and comparison styling

```
IMPL-FILE_PANE_RenderFileRows(context):
  INPUT: files[], cursor, marks, comparisonIndex
  OUTPUT: rendered file row grid elements
  PRE: files array available (may be empty)
  POST: each file row styled for cursor, mark, and comparison state
  EFFECTS: pure
  TERMINATION: total
  IF files.length = 0 THEN RENDER empty OR filter-empty message when rawFileCount > 0
  FOR EACH file AT index
    isCursor := cursor >= 0 AND index = cursor
    isMarked := marks.has(file.path)
    comparisonClass := getComparisonClass(file.name) from comparisonIndex
    RENDER row data-testid=file-row-grid
      style gridTemplateColumns = rowGridTemplate
      class cursor blue OR marked yellow OR comparisonClass OR hover
      onClick move cursor; onDoubleClick IF directory AND onToggleExpand THEN onToggleExpand(file.path) ELSE onNavigate NOT called
      draggable with handleDragStart (marked set or single file)
```

## TREE_DEPTH_INDENT_CHEVRON

// [IMPL-FILE_PANE] [IMPL-DIRECTORY_TREE] [ARCH-DIRECTORY_TREE] [REQ-DIRECTORY_TREE] [REQ-DIRECTORY_NAVIGATION]: how: name column applies depth*16px padding and ▶/▼ chevron on directories from FileTreeRow metadata

```
IMPL-FILE_PANE_TreeDepthIndentChevron(context):
  INPUT: file with depth and isDirectory metadata
  OUTPUT: indented name cell with chevron or spacer
  PRE: file row rendered in name column
  POST: depth-based padding and chevron shown for directories when onToggleExpand present
  EFFECTS: pure
  TERMINATION: total
  depth := file.depth ?? 0
  paddingLeft := 8 + depth * 16 px on name column span
  IF file.isDirectory THEN RENDER chevron ▶ when collapsed OR ▼ when isExpanded
  ELSE RENDER spacer w-3 for column alignment
  onToggleExpand optional; when absent directories behave as flat rows without expand
```

## TABULAR_FILE_ROW_GRID

// [IMPL-FILE_PANE] [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: how: CSS grid template from measured or injected metadata widths; no header row

```
IMPL-FILE_PANE_TabularFileRowGrid(context):
  INPUT: visible columns, files[], measured or injected widths
  OUTPUT: CSS grid template and column cells per row
  PRE: visibleColumns and files available
  POST: row grid uses checkbox, icon, and metadata columns without header row
  EFFECTS: pure
  TERMINATION: total
  visibleColumns := getVisibleFileColumns(columns)
  measuredWidths := metadataColumnWidths OR measureFileMetadataColumnWidths(files, visibleColumns)
  metadataGridTemplate := buildFileRowGridTemplate(visibleColumnIds, measuredWidths)
  rowGridTemplate := "auto auto " + metadataGridTemplate
  FOR each file RENDER checkbox slot, folder icon slot
  FOR each visible column CALL renderColumn(columnId, file)
  data-testid=file-column-{id} on metadata cells
```

## METADATA_COLUMN_WIDTHS_PROP

// [IMPL-FILE_PANE] [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: optional metadataColumnWidths skips per-pane measure in OneColumn layout

```
IMPL-FILE_PANE_MetadataColumnWidthsProp(context):
  INPUT: optional metadataColumnWidths from WorkspaceView
  OUTPUT: measuredWidths for grid template
  PRE: OneColumn layout may supply shared widths
  POST: prop widths used when provided; otherwise per-pane measurement
  EFFECTS: pure
  TERMINATION: total
  useMemo measuredWidths := prop OR measureFileMetadataColumnWidths(files, visibleColumns)
```

## PANE_FILES_LIST_PROP

// [IMPL-FILE_PANE] [IMPL-WORKSPACE_VIEW] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES]: how: paneFilesList defaults []; passed to FileColumnContextMenu for cross-pane paths

```
IMPL-FILE_PANE_PaneFilesListProp(context):
  INPUT: optional paneFilesList from WorkspaceView
  OUTPUT: paneFilesList passed to context menu
  PRE: FileColumnContextMenu rendered
  POST: paneFilesList defaults to [] when omitted
  EFFECTS: pure
  TERMINATION: total
  DEFAULT paneFilesList := []
  PASS to FileColumnContextMenu for clipboard path resolution across panes
```

## UNIFIED_CONTEXT_MENU_WIRING

// [IMPL-FILE_PANE] [IMPL-MOUSE_SUPPORT] [ARCH-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-LINKED_PANES] [REQ-DIRECTORY_NAVIGATION]: how: row and metadata-cell right-click set same contextMenu state; FilePane renders unified ContextMenu with clipboard section and onSetBaseDirectory for directories

```
IMPL-FILE_PANE_UnifiedContextMenuWiring(context):
  INPUT: row or column cell context menu event
  OUTPUT: contextMenu state with file at index
  PRE: user right-clicks row or metadata cell
  POST: unified ContextMenu shown at client coordinates with file context
  EFFECTS: State, Control
  TERMINATION: total
  ON row OR column cell contextMenu preventDefault; stopPropagation
  IF index != cursor THEN onCursorMove(index)
  SET contextMenu at client coordinates with file at index
  RENDER ContextMenu when contextMenu set; PASS paneFilesList, onSetBaseDirectory, file op handlers
```

## ScrollToCursor

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-LINKED_PANES]: how: scrollTrigger effect scrolls focused row into view

```
IMPL-FILE_PANE_ScrollToCursor(context):
  INPUT: scrollTrigger index
  OUTPUT: focused row scrolled into view
  PRE: scrollTrigger >= 0 and row exists at index
  POST: row at scrollTrigger scrolled into viewport center
  EFFECTS: Control
  TERMINATION: total
  IF scrollTrigger undefined OR scrollTrigger < 0 THEN RETURN
  FIND child row at scrollTrigger index
  CALL scrollIntoView block center behavior smooth
```

## PaneFooter

// [IMPL-FILE_PANE] [IMPL-FILE_MARKING] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING]: how: footer shows cursor position, sort label, marked count when visible

```
IMPL-FILE_PANE_PaneFooter(context):
  INPUT: files[], cursor, marks, sort options, hiddenCount
  OUTPUT: footer with position, sort, and mark summary
  PRE: footer visibility conditions evaluated
  POST: footer shows cursor position, sort label, and marked count when applicable
  EFFECTS: pure
  TERMINATION: total
  SHOW footer WHEN files.length > 0 OR marks.size > 0 OR hiddenCount > 0
  DISPLAY cursor+1 / files.length OR "- / N" when cursor = -1
  DISPLAY sort indicator from sortBy, sortDirection, sortDirsFirst
  IF marks.size > 0 DISPLAY [{marks.size} marked] with accent class
```

## CodeLocations

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/components/FilePane.tsx — FilePane component
// FILE: src/app/files/components/FilePane.test.tsx — grid, column menu, width tests

## ErrorHandling

// [IMPL-FILE_PANE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_LISTING] [REQ-DIRECTORY_NAVIGATION]: how: drop handler catches JSON parse errors; missing onToggleMark skips checkbox action

```
IMPL-FILE_PANE_on_error(context, error):
  INPUT: drop parse failure or missing handler
  OUTPUT: logged diagnostic; pane listing unchanged on drop failure
  PRE: error during drop or mark handler invocation
  POST: no pane listing mutation on drop parse failure
  EFFECTS: IO
  FAILURE_MODES: DROP_PARSE_FAILED
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ON drop parse failure LOG error; DO NOT mutate pane listing
```
