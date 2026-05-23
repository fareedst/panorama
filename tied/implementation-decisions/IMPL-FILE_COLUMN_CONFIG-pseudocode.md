# IMPL-FILE_COLUMN_CONFIG essence pseudocode

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Configurable file metadata columns — YAML defaults, workspace state, tabular grid, column-order dialog, mesh snapshot v4.

## Summary contract

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: bound module inputs, outputs, and shared data for all runtime blocks below

```
CONTRACT Summary
  INPUT: FilesColumnConfig[] from config/files.yaml columns; workspace fileColumns state; pane files[] per FilePane
  OUTPUT: visible column order; CSS grid template; formatted cells; normalized snapshot fileColumns
  DATA: FileColumnId (mtime|size|name); FilesColumnConfig { id, visible?, format? }; MeasuredFileColumnWidths
```

## ConfigAndTypes

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: columns in config/files.yaml and FilesConfig; FileColumnId and FilesColumnConfig in config.types.ts; copy.columns labels for dialog

```
CONFIG_AND_TYPES:
  columns[] in config/files.yaml — default order mtime, size, name; visible and mtime format
  copy.columns — columnOrderTitle, mtimeLabel, sizeLabel, nameLabel, moveUp, moveDown, apply, cancel
  DEFAULT_FILES_CONFIG.columns mirrors YAML defaults
```

## FileColumnsModule

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-WORKSPACE_MESH_BRIDGE]: how: src/lib/file-columns.ts — visibility, reorder, normalize, measure, grid template, cell format, summary label

```
PROCEDURE FileColumnsModule(context)
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
PROCEDURE MeasureFileColumnWidths(context)
  FOR each visible size OR mtime column IN pane.files
    maxLen := max formatted cell length across files (minimum track)
    EMIT measured[id] := maxLen + cell padding in ch units
  buildFileRowGridTemplate: size/mtime as "{n}ch"; name as "minmax(0, 1fr)"
```

## SharedMetadataWidthsOneColumn

// [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_VIEW] [REQ-MULTI_PANE_LAYOUT] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: OneColumn layout passes workspace max Size/Time ch to every FilePane via metadataColumnWidths

```
PROCEDURE SharedMetadataWidthsOneColumn(context)
  IF layout = OneColumn THEN
    shared := measureFileMetadataColumnWidthsForPanes(panes.map(p => p.files), visibleColumns)
    PASS shared AS metadataColumnWidths to each FilePane
  ELSE
    omit metadataColumnWidths; FilePane measures per pane
```

## TabularFileRowGrid

// [IMPL-FILE_COLUMN_CONFIG] [IMPL-FILE_PANE] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: how: FilePane rows use CSS grid; checkbox and folder icon fixed; no listing header row

```
PROCEDURE TabularFileRowGrid(context)
  rowGridTemplate := "auto auto " + metadataGridTemplate
  FOR each file row
    RENDER data-testid=file-row-grid style gridTemplateColumns=rowGridTemplate
    RENDER checkbox + folder icon slot + renderColumn per visible column
    data-testid=file-column-{id} on each metadata cell
```

## ColumnOrderDialog

// [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_VIEW] [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: view.columns opens dialog; Up/Down reorder visible columns; Apply calls reorderFileColumns and setFileColumns

```
PROCEDURE ColumnOrderDialog(context)
  ON view.columns SET columnOrderDialogOpen true
  draft order := visible column ids only
  ON Apply SET fileColumns := reorderFileColumns(fileColumns, draftOrder); onClose
  ON Cancel OR overlay OR Escape onClose without onApply
  labels from copy.columns; data-testid column-order-dialog, column-order-apply, column-order-up-{id}, column-order-down-{id}
```

## SnapshotV4FileColumns

// [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: how: captureWorkspaceSnapshot version 4 includes fileColumns; parse v1–v3 omit uses YAML defaults; diff compares formatFileColumnsLabel

```
PROCEDURE SnapshotV4FileColumns(context)
  ON capture EMIT version 4 with fileColumns deep-copied from workspace state
  ON parse version >= 4 AND raw.fileColumns NORMALIZE via normalizeFileColumns(raw, yamlDefaults)
  ON parse v1–v3 OMIT fileColumns; WorkspaceView uses YAML defaults on restore
  ON diff EMIT field fileColumns when labels differ
```

## CodeLocations

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: map implementing and verifying source files for this IMPL

```
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
// FILE: src/lib/toolbar.utils.ts — deriveToolbarButton fallback to toolbars.actions
```

## ErrorHandling

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: invalid snapshot column ids fall back to YAML defaults without breaking pane render

```
PROCEDURE IMPL-FILE_COLUMN_CONFIG_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ON invalid fileColumns raw THEN normalizeFileColumns(null, yamlDefaults)
  ELSE propagate error to caller
```
