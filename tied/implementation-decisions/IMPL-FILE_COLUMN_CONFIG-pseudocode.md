# IMPL-FILE_COLUMN_CONFIG essence pseudocode

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Configurable file metadata columns — YAML defaults, workspace state, tabular grid, column-order dialog, mesh snapshot v4.

## Summary contract

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-FILE_COLUMN_CONFIG_Summary():
  INPUT: FilesColumnConfig[] from config/files.yaml columns; workspace fileColumns state; pane files[] per FilePane
  OUTPUT: visible column order; CSS grid template; formatted cells; normalized snapshot fileColumns
  DATA: FileColumnId (mtime|size|name); FilesColumnConfig { id, visible?, format? }; MeasuredFileColumnWidths
  PRE: YAML column defaults and workspace fileColumns state available
  POST: visible columns, grid template, and formatted cells derived from config and pane data
  EFFECTS: pure
  TERMINATION: total
```

## ConfigAndTypes

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: columns in config/files.yaml and FilesConfig; FileColumnId and FilesColumnConfig in config.types.ts; copy.columns labels for dialog

```
IMPL-FILE_COLUMN_CONFIG_ConfigAndTypes():
  INPUT: config/files.yaml columns section
  OUTPUT: typed FilesColumnConfig defaults and dialog copy labels
  PRE: config files loaded
  POST: DEFAULT_FILES_CONFIG.columns mirrors YAML defaults with typed ids
  EFFECTS: pure
  TERMINATION: total
  columns[] in config/files.yaml — default order mtime, size, name; visible and mtime format
  copy.columns — columnOrderTitle, mtimeLabel, sizeLabel, nameLabel, moveUp, moveDown, apply, cancel
  DEFAULT_FILES_CONFIG.columns mirrors YAML defaults
```

## FileColumnsModule

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-WORKSPACE_MESH_BRIDGE]: how: src/lib/file-columns.ts — visibility, reorder, normalize, measure, grid template, cell format, summary label

```
IMPL-FILE_COLUMN_CONFIG_FileColumnsModule(context):
  INPUT: fileColumns state, files[], yaml defaults
  OUTPUT: gridTemplate, visibleIds, normalized columns
  PRE: file-columns module invoked with column config and file rows
  POST: visible ids, measured widths, grid template, and normalized columns returned
  EFFECTS: pure
  TERMINATION: total
  visibleIds := getVisibleFileColumns(fileColumns).map(c => c.id)
  measured := metadataColumnWidths OR measureFileMetadataColumnWidths(files, visibleColumns)
  gridTemplate := buildFileRowGridTemplate(visibleIds, measured)
  formatFileColumnCell(file, columnId, columns) — name text; size empty for directories; mtime age or absolute
  normalizeFileColumns(raw, yamlDefaults) — invalid ids dropped; merge visibility/format from defaults
  reorderFileColumns(columns, orderedIds) — preserve config fields per id
  formatFileColumnsLabel(columns) — human label for mesh summary and diff
  RETURN gridTemplate, visibleIds, normalized columns
```

## MeasureFileColumnWidths

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: how: scan formatted size/mtime strings; fixed ch tracks with padding; name uses minmax(0, 1fr) in grid builder

```
IMPL-FILE_COLUMN_CONFIG_MeasureFileColumnWidths(context):
  INPUT: files[], visible columns
  OUTPUT: MeasuredFileColumnWidths map
  PRE: visible size and/or mtime columns present
  POST: measured ch widths per column id; name column uses minmax(0, 1fr) in grid builder
  EFFECTS: pure
  TERMINATION: total
  FOR each visible size OR mtime column IN pane.files
    maxLen := max formatted cell length across files (minimum track)
    EMIT measured[id] := maxLen + cell padding in ch units
  buildFileRowGridTemplate: size/mtime as "{n}ch"; name as "minmax(0, 1fr)"
```

## SharedMetadataWidthsOneColumn

// [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: OneColumn layout passes workspace max Size/Time ch to every FilePane via metadataColumnWidths

```
IMPL-FILE_COLUMN_CONFIG_SharedMetadataWidthsOneColumn(context):
  INPUT: layout type, panes[] file listings
  OUTPUT: shared metadataColumnWidths for all FilePane instances
  PRE: layout is OneColumn with multiple panes
  POST: shared measured widths passed to each FilePane; omitted in multi-column layouts
  EFFECTS: pure
  TERMINATION: total
  IF layout = OneColumn THEN
    shared := measureFileMetadataColumnWidthsForPanes(panes.map(p => p.files), visibleColumns)
    PASS shared AS metadataColumnWidths to each FilePane
  ELSE
    omit metadataColumnWidths; FilePane measures per pane
```

## TabularFileRowGrid

// [IMPL-FILE_COLUMN_CONFIG] [IMPL-FILE_PANE] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: how: FilePane rows use CSS grid; checkbox and folder icon fixed; no listing header row

```
IMPL-FILE_COLUMN_CONFIG_TabularFileRowGrid(context):
  INPUT: visible columns, measured widths, files[]
  OUTPUT: tabular grid rows in FilePane
  PRE: FilePane rendering file listing
  POST: each row uses CSS grid with checkbox, icon, and metadata cells; no header row
  EFFECTS: pure
  TERMINATION: total
  rowGridTemplate := "auto auto " + metadataGridTemplate
  FOR each file row
    RENDER data-testid=file-row-grid style gridTemplateColumns=rowGridTemplate
    RENDER checkbox + folder icon slot
    FOR each visible column CALL renderColumn(columnId, file)
    data-testid=file-column-{id} on each metadata cell
```

## ColumnOrderDialog

// [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_VIEW] [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: view.columns opens dialog; Up/Down reorder visible columns; Apply calls reorderFileColumns and setFileColumns

```
IMPL-FILE_COLUMN_CONFIG_ColumnOrderDialog(context):
  INPUT: view.columns action, current fileColumns
  OUTPUT: reordered fileColumns on Apply
  PRE: column order dialog open
  POST: Apply persists reordered visible columns; Cancel closes without mutation
  EFFECTS: State, Control
  TERMINATION: total
  ON view.columns SET columnOrderDialogOpen true
  draft order := visible column ids only
  ON Apply SET fileColumns := reorderFileColumns(fileColumns, draftOrder); onClose
  ON Cancel OR overlay OR Escape onClose without onApply
  labels from copy.columns; data-testid column-order-dialog, column-order-apply, column-order-up-{id}, column-order-down-{id}
```

## SnapshotV4FileColumns

// [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: how: captureWorkspaceSnapshot version 4 includes fileColumns; parse v1–v3 omit uses YAML defaults; diff compares formatFileColumnsLabel

```
IMPL-FILE_COLUMN_CONFIG_SnapshotV4FileColumns(context):
  INPUT: workspace fileColumns state or raw snapshot
  OUTPUT: captured v4 fileColumns or normalized restore columns
  PRE: snapshot capture or parse invoked
  POST: v4 snapshots include fileColumns; older versions fall back to YAML defaults
  EFFECTS: IO, State
  DATA_TRANSITION: fileColumns deep-copied on capture; normalized on parse v4+
  TERMINATION: total
  ON capture EMIT version 4 with fileColumns deep-copied from workspace state
  ON parse version >= 4 AND raw.fileColumns NORMALIZE via normalizeFileColumns(raw, yamlDefaults)
  ON parse v1–v3 OMIT fileColumns; WorkspaceView uses YAML defaults on restore
  ON diff EMIT field fileColumns when labels differ
```

## CodeLocations

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: map implementing and verifying source files for this IMPL

// FILE: config/files.yaml — columns defaults; copy.columns; toolbars.actions.view.columns
// FILE: src/lib/config.types.ts — FileColumnId, FilesColumnConfig, ToolbarActionMeta
// FILE: src/lib/file-columns.ts — column helpers and grid measurement
// FILE: src/lib/file-columns.test.ts — unit tests
// FILE: src/app/files/components/FilePane.tsx — tabular grid rows
// FILE: src/app/files/components/FilePane.test.tsx — grid and width tests
// FILE: src/app/files/components/ColumnOrderDialog.tsx — reorder UI
// FILE: src/app/files/components/ColumnOrderDialog.test.tsx — dialog tests
// FILE: src/app/files/WorkspaceView.tsx — fileColumns state, view.columns handler, OneColumn shared widths
// FILE: src/lib/workspace-mesh-bridge.ts — v4 capture/parse/diff/summary label

## ErrorHandling

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: invalid snapshot column ids fall back to YAML defaults without breaking pane render

```
IMPL-FILE_COLUMN_CONFIG_on_error(context, error):
  INPUT: invalid fileColumns raw from snapshot
  OUTPUT: normalized columns from YAML defaults
  PRE: parse receives invalid or unknown column ids
  POST: pane render continues with normalized defaults
  EFFECTS: pure
  FAILURE_MODES: INVALID_COLUMN_ID
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ON invalid fileColumns raw THEN normalizeFileColumns(null, yamlDefaults)
  ELSE propagate error to caller
```
