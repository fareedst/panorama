# IMPL-FILES_API essence pseudocode

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: Top-level File Operations API Routes: GET /api/files for directory listing, POST /api/files for operations (copy, move, delete, rename, bulk-*, sync-all), operation-specific validation, integrated with session logger

## Summary contract

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-FILES_API
  DATA: state and configuration per implementation_approach

## GetListDirectory

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: GET api files with path query returns JSON FileStat array

CONTRACT GetListDirectory
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_API_GetListDirectory(context)
  // PARSE path query parameter
  CALL PARSE path query parameter
  CALL listDirectory on validated path
  RETURN Response json file list

## PostOperation

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: validate operation enum and dispatch bulk or single handlers

CONTRACT PostOperation
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-FILES_API_PostOperation(context)
  // PARSE JSON body operation sources dest
  CALL PARSE JSON body operation sources dest
  IF operation unknown THEN RETURN 400
  IF operation starts with bulk- THEN CALL bulk handler
  ELSE CALL single-file handler

## CodeLocations

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: map implementing and verifying source files for this IMPL

// FILE: src/app/api/files/route.ts — File operations API route with logging and operation-specific validation
// FUNCTION: GET in src/app/api/files/route.ts
// FUNCTION: POST in src/app/api/files/route.ts

## ErrorHandling

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-FILES_API_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
