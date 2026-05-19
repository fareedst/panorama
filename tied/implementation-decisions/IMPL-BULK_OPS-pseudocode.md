# IMPL-BULK_OPS essence pseudocode

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: Top-level Parallel Bulk Operations with Progress: API routes for bulk operations, Promise.allSettled with progress callbacks

## Summary contract

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-BULK_OPS
  DATA: state and configuration per implementation_approach

## GetOperationFiles

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: resolve source paths from marked files or cursor file in active pane

CONTRACT GetOperationFiles
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-BULK_OPS_GetOperationFiles(context)
  // DATA paneIndex, panes with marks Set and files list
  IF pane.marks.size greater than zero THEN
  FOR EACH filename IN pane.marks FIND file.path AND collect paths
  ELSE IF pane.files[pane.cursor] exists THEN RETURN singleton path list
  ELSE RETURN empty list

## BulkCopy

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: confirm then POST bulk-copy with progress dialog and pane refresh

CONTRACT BulkCopy
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-BULK_OPS_BulkCopy(context)
  IF panes.length less than 2 THEN alert and RETURN
  CALL GetOperationFiles for focusIndex
  IF sources empty THEN RETURN
  SET destPaneIndex to other pane and destDir from pane.path
  CALL DetectConflicts for dest pane listing
  SET confirmDialog with title Copy Files and onConfirm handler
  ON confirm AWAIT POST operation bulk-copy with sources and dest
  // UPDATE progressDialog from OperationResult successCount and errors
  CALL UPDATE progressDialog from OperationResult successCount and errors
  CALL handleNavigate to refresh source and destination panes
  CALL handleClearMarks on source pane

## BulkMove

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: same flow as BulkCopy with operation bulk-move and V keybinding

CONTRACT BulkMove
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-BULK_OPS_BulkMove(context)
  IF panes.length less than 2 THEN alert and RETURN
  CALL GetOperationFiles
  CALL DetectConflicts
  ON confirm AWAIT POST operation bulk-move
  // REFRESH both panes and CLEAR marks on success
  CALL REFRESH both panes and CLEAR marks on success

## BulkDelete

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: destructive confirm then bulk-delete marked or cursor files

CONTRACT BulkDelete
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-BULK_OPS_BulkDelete(context)
  CALL GetOperationFiles
  IF sources empty THEN RETURN
  SET confirmDialog destructive styling
  ON confirm AWAIT POST operation bulk-delete
  // REFRESH pane listing after completion
  CALL REFRESH pane listing after completion

## ConfirmDialog

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: Escape cancel Enter confirm for bulk operations

CONTRACT ConfirmDialog
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-BULK_OPS_ConfirmDialog(context)
  ON Escape key SET isOpen false
  ON Enter key INVOKE onConfirm callback
  IF conflicts prop present THEN render scrollable comparison list

## ProgressDialog

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: show percentage current file errors and completion summary

CONTRACT ProgressDialog
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-BULK_OPS_ProgressDialog(context)
  DATA total completed currentFile errors isComplete
  // RENDER bar as completed divided by total
  CALL RENDER bar as completed divided by total
  IF WHEN isComplete THEN show result summary counts

## ServerBulkHandlers

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: bulkCopy bulkMove bulkDelete use Promise.allSettled per source

CONTRACT ServerBulkHandlers
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-BULK_OPS_ServerBulkHandlers(context)
  // INPUT sources array dest directory operation kind
  FOR EACH source AWAIT single file operation
  // COLLECT fulfilled and rejected into successCount errorCount errors array
  CALL COLLECT fulfilled and rejected into successCount errorCount errors array
  RETURN OperationResult without stopping on first failure

## VKeyForMove

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: V key maps to file.move not M to avoid mark.toggle conflict

CONTRACT VKeyForMove
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-BULK_OPS_VKeyForMove(context)
  // REGISTER keybinding v action file.move
  CALL REGISTER keybinding v action file.move
  ON file.move CALL handleBulkMove not handleToggleMark

## CodeLocations

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: map implementing and verifying source files for this IMPL

// FILE: src/app/api/files/route.ts — Bulk operation handlers
// FILE: src/lib/files.data.ts — Bulk operation functions
// FUNCTION: bulkCopy in src/lib/files.data.ts
// FUNCTION: bulkMove in src/lib/files.data.ts

## ErrorHandling

// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-BULK_OPS_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
