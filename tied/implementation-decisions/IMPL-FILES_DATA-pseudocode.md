# IMPL-FILES_DATA essence pseudocode

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: Top-level Filesystem Data Layer: Server-only module wraps Node.js fs/promises API with validation

## Summary contract

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-FILES_DATA
  DATA: state and configuration per implementation_approach

## ListDirectory

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: read directory entries and map to FileStat list

CONTRACT ListDirectory
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_DATA_ListDirectory(context)
  // INPUT validated absolute path
  AWAIT fs readdir with file types
  FOR EACH entry BUILD FileStat name path isDirectory size mtime extension
  RETURN sorted-ready array

## PathValidation

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: reject directory traversal outside allowed root

CONTRACT PathValidation
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_DATA_PathValidation(context)
  // NORMALIZE requested path
  CALL NORMALIZE requested path
  IF path escapes root THEN RETURN error
  ELSE RETURN safe path for fs operations

## BulkCopyServer

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: Promise.allSettled over per-file copy

CONTRACT BulkCopyServer
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_DATA_BulkCopyServer(context)
  FOR EACH source IN sources
  AWAIT copyFile into dest directory with basename
  // AGGREGATE per-file success and failure messages
  CALL AGGREGATE per-file success and failure messages

## CodeLocations

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.data.ts — Filesystem data layer (server-only)
// FILE: src/lib/files.types.ts — TypeScript interfaces
// FILE: src/lib/files.utils.ts — Client-safe utilities
// FILE: src/lib/files.data.test.ts — Data layer tests (34 tests)
// FUNCTION: listDirectory in src/lib/files.data.ts
// FUNCTION: sortFiles in src/lib/files.data.ts
// FUNCTION: buildComparisonIndex in src/lib/files.data.ts
// FUNCTION: formatSize in src/lib/files.utils.ts

## ErrorHandling

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-FILES_DATA_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
