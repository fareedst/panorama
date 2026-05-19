# IMPL-FILE_COLUMN_CONFIG essence pseudocode

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Top-level Configurable File Column Display: Extended config system with FilesColumnConfig type, added formatDateTime utility, and refactored FilePane to render columns dynamically based on configuration

## Summary contract

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-FILE_COLUMN_CONFIG
  DATA: state and configuration per implementation_approach

## AddedColumnsSectionTo

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Added columns section to config/files.yaml with visibility control

CONTRACT AddedColumnsSectionTo
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_COLUMN_CONFIG_AddedColumnsSectionTo(context)
  // Added columns section to config/files.yaml with visibility control
  CALL Added columns section to config/files.yaml with visibility control
  ON invalid input OR missing data THEN RETURN without mutation

## AddedDefaultColumnsConfiguration

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Added default columns configuration (mtime, size, name) to DEFAULT_FILES_CONFIG

CONTRACT AddedDefaultColumnsConfiguration
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_COLUMN_CONFIG_AddedDefaultColumnsConfiguration(context)
  // Added default columns configuration (mtime
  CALL Added default columns configuration (mtime
  // size
  CALL size
  // name) to DEFAULT_FILES_CONFIG
  CALL name) to DEFAULT_FILES_CONFIG

## AddedFileColumnIdTypeAnd

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Added FileColumnId type and FilesColumnConfig interface to config.types.ts

CONTRACT AddedFileColumnIdTypeAnd
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_COLUMN_CONFIG_AddedFileColumnIdTypeAnd(context)
  // Added FileColumnId type
  CALL Added FileColumnId type
  // FilesColumnConfig interface to config.types.ts
  CALL FilesColumnConfig interface to config.types.ts

## CheckboxAndDirectoryIcon

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Checkbox and directory icon remain fixed, columns render in config order

CONTRACT CheckboxAndDirectoryIcon
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_COLUMN_CONFIG_CheckboxAndDirectoryIcon(context)
  // Checkbox
  CALL Checkbox
  // directory icon remain fixed
  CALL directory icon remain fixed
  // columns render in config order
  CALL columns render in config order

## ColumnsWithVisible

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: false are filtered out

CONTRACT ColumnsWithVisible
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_COLUMN_CONFIG_ColumnsWithVisible(context)
  // false are filtered out
  CALL false are filtered out
  ON invalid input OR missing data THEN RETURN without mutation

## CreatedFormatDateTimeUtilityFunction

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: MM:SS formatting

CONTRACT CreatedFormatDateTimeUtilityFunction
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_COLUMN_CONFIG_CreatedFormatDateTimeUtilityFunction(context)
  // MM:SS formatting
  CALL MM:SS formatting
  ON invalid input OR missing data THEN RETURN without mutation

## ExtendedFilesConfigInterfaceWith

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Extended FilesConfig interface with optional columns array

CONTRACT ExtendedFilesConfigInterfaceWith
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_COLUMN_CONFIG_ExtendedFilesConfigInterfaceWith(context)
  // Extended FilesConfig interface with optional columns array
  CALL Extended FilesConfig interface with optional columns array
  ON invalid input OR missing data THEN RETURN without mutation

## RefactoredFilePaneRenderingTo

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Refactored FilePane rendering to use dynamic column generation via renderColumn helper

CONTRACT RefactoredFilePaneRenderingTo
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_COLUMN_CONFIG_RefactoredFilePaneRenderingTo(context)
  // Refactored FilePane rendering to use dynamic column generation via renderColumn helper
  CALL Refactored FilePane rendering to use dynamic column generation via renderColumn helper
  ON invalid input OR missing data THEN RETURN without mutation

## ThreadedColumnsPropThrough

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: Threaded columns prop through page.tsx → WorkspaceView.tsx → FilePane.tsx

CONTRACT ThreadedColumnsPropThrough
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILE_COLUMN_CONFIG_ThreadedColumnsPropThrough(context)
  // Threaded columns prop through page.tsx → WorkspaceView.tsx → FilePane.tsx
  CALL Threaded columns prop through page.tsx → WorkspaceView.tsx → FilePane.tsx
  ON invalid input OR missing data THEN RETURN without mutation

## CodeLocations

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: map implementing and verifying source files for this IMPL

// FILE: src/lib/config.types.ts — Added FileColumnId type, FilesColumnConfig interface, columns to FilesConfig
// FILE: src/lib/config.ts — Added default columns array to DEFAULT_FILES_CONFIG
// FILE: config/files.yaml — Added columns configuration section
// FILE: src/lib/files.utils.ts — Added formatDateTime function for YYYY-MM-DD HH:MM:SS format
// FILE: src/app/files/page.tsx — Extract and pass columns config to WorkspaceView
// FILE: src/app/files/WorkspaceView.tsx — Accept columns prop and forward to FilePane
// FILE: src/app/files/components/FilePane.tsx — Accept columns prop, added renderColumn helper, dynamic column rendering
// FUNCTION: formatDateTime in src/lib/files.utils.ts
// FUNCTION: renderColumn in src/app/files/components/FilePane.tsx

## ErrorHandling

// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-FILE_LISTING]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-FILE_COLUMN_CONFIG_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
