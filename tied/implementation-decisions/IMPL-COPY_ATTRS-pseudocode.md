# IMPL-COPY_ATTRS essence pseudocode

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: Top-level Copy Preserve File Attributes: Shared preserveCopyAttributes() after fs.copyFile; stat source then chmod + utimes on dest; each step try/catch so unsupported or denied ops do not fail the copy

## Summary contract

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-COPY_ATTRS
  DATA: state and configuration per implementation_approach

## PreserveMtimeMode

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: after copy apply utimes and chmod from source stat

CONTRACT PreserveMtimeMode
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-COPY_ATTRS_PreserveMtimeMode(context)
  // READ sourceStat mtime atime mode
  CALL READ sourceStat mtime atime mode
  CALL fs.utimes on destination with source times
  CALL fs.chmod on destination with source mode

## CodeLocations

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/copyAttributes.ts — preserveCopyAttributes() helper
// FILE: src/lib/sync/operations.ts — Called after copyFile
// FILE: src/lib/files.data.ts — Called after copyFile

## ErrorHandling

// [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-COPY_ATTRS_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
