# IMPL-NSYNC_OPERATIONS essence pseudocode

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: Top-level File Operations Wrappers: Copy, move, delete operation wrappers ensuring destination directories exist

## Summary contract

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-NSYNC_OPERATIONS
  DATA: state and configuration per implementation_approach

## CopyFile

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: copy file to destination path with optional attribute copy

CONTRACT CopyFile
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_OPERATIONS_CopyFile(context)
  AWAIT fs copy source to dest path
  CALL copyAttributes when enabled
  ON error CLASSIFY and rethrow

## MoveFile

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: rename or copy-delete for move semantics

CONTRACT MoveFile
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_OPERATIONS_MoveFile(context)
  AWAIT rename across filesystem OR copy then delete source

## DeleteFile

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: remove file at path

CONTRACT DeleteFile
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_OPERATIONS_DeleteFile(context)
  AWAIT fs unlink or rm for path
  ON ENOENT RETURN gracefully if policy allows

## CodeLocations

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/operations.ts — IMPL-NSYNC_OPERATIONS

## ErrorHandling

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-NSYNC_OPERATIONS_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
