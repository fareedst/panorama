# IMPL-OVERWRITE_PROMPT essence pseudocode

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: Top-level Overwrite Confirmation with File Comparison: Detect file conflicts before confirmation, display comparison details in ConfirmDialog

## Summary contract

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-OVERWRITE_PROMPT
  DATA: state and configuration per implementation_approach

## DetectConflicts

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: before confirm compare source basenames to destination pane file names

CONTRACT DetectConflicts
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-OVERWRITE_PROMPT_DetectConflicts(context)
  FOR EACH sourcePath IN sources
  SET basename FROM path basename of sourcePath
  IF dest pane files contains name basename THEN
  CALL describeFileComparison with source and existing FileStat
  // APPEND FileConflict with summaries and comparison text
  CALL APPEND FileConflict with summaries and comparison text

## ConfirmMessage

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: append overwrite count to confirm dialog message when conflicts non-empty

CONTRACT ConfirmMessage
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-OVERWRITE_PROMPT_ConfirmMessage(context)
  // BUILD base message with source count and destDir
  CALL BUILD base message with source count and destDir
  IF conflicts.length greater than zero THEN append will be overwritten line
  // PASS conflicts optional prop to ConfirmDialog
  CALL PASS conflicts optional prop to ConfirmDialog

## DescribeFileComparison

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: utility compares size and mtime for human-readable summary

CONTRACT DescribeFileComparison
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-OVERWRITE_PROMPT_DescribeFileComparison(context)
  // INPUT sourceFile existingFile FileStat records
  // COMPUTE size delta and mtime delta
  CALL COMPUTE size delta and mtime delta
  RETURN sourceSummary existingSummary comparison label

## CodeLocations

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: map implementing and verifying source files for this IMPL

// FILE: src/app/files/WorkspaceView.tsx — Conflict detection in handleBulkCopy and handleBulkMove
// FILE: src/app/files/components/ConfirmDialog.tsx — FileConflict interface and rendering
// FILE: src/lib/files.utils.ts — describeFileComparison utility
// FUNCTION: describeFileComparison in src/lib/files.utils.ts
// FUNCTION: handleBulkCopy in src/app/files/WorkspaceView.tsx
// FUNCTION: handleBulkMove in src/app/files/WorkspaceView.tsx

## ErrorHandling

// [IMPL-OVERWRITE_PROMPT] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-OVERWRITE_PROMPT_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
