# IMPL-FILES_API essence pseudocode

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: REST routes GET and POST /api/files — directory listing with optional display-spec filter; file operations with operation-specific validation, display-spec source guard, session logger

## Summary contract

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: server entry points delegate listing to IMPL-FILES_DATA and mutations to IMPL-FILES_DATA or IMPL-NSYNC_ENGINE; all branches log with semantic tokens

CONTRACT Summary
  INPUT: NextRequest (query path, displaySpecId; JSON body operation, src, dest, sources, destinations, displaySpecId)
  OUTPUT: JSON FileStat[] OR { files, hiddenCount, totalCount } OR { success } OR OperationResult OR SyncResult OR { error }
  DATA: listDirectory, sortFiles, filterFileStats, serverGetDisplaySpec, validateOperationSourcesForDisplaySpec, dynamic import files.data and SyncEngine
  CONTROL: logger debug/info/warn/error on every branch

## GetListDirectory

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: GET reads path (default home), rejects .. traversal, lists directory, optionally filters by display spec, sorts by Name with dirs first, returns legacy array or enriched object

CONTRACT GetListDirectory
  INPUT: query path (optional), displaySpecId (optional)
  OUTPUT: 200 JSON sorted FileStat[] OR { files, hiddenCount, totalCount }; 400 invalid path or missing spec; 500 list failure
  DATA: getUserHomeDirectory when path omitted

PROCEDURE IMPL-FILES_API_GetListDirectory(request)
  dirPath := query path OR getUserHomeDirectory()
  displaySpecId := query displaySpecId
  LOG debug with path
  IF dirPath contains ".." THEN RETURN 400 { error: "Invalid path" }
  rawFiles := AWAIT listDirectory(dirPath)
  spec := IF displaySpecId THEN AWAIT serverGetDisplaySpec(displaySpecId) ELSE null
  IF displaySpecId AND NOT spec THEN RETURN 400 { error: "Display spec not found", specError: true }
  { files: filtered, hiddenCount } := filterFileStats(rawFiles, spec)
  sortedFiles := sortFiles(filtered, "Name", true)
  IF displaySpecId THEN RETURN 200 { files: sortedFiles, hiddenCount, totalCount: rawFiles.length }
  RETURN 200 sortedFiles
  ON error LOG error RETURN 500 { error: "Failed to list directory" }

## PostOperationValidation

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: POST parses JSON body; operation required; src required only for copy/move/delete/rename; reject .. in src/dest when present

CONTRACT PostOperationValidation
  INPUT: JSON body { operation, src, dest, sources, destinations, displaySpecId, move, verify, hashAlgorithm, compareMethod }
  OUTPUT: continue OR 400 missing/invalid parameters
  DATA: needsSrc := operation in { copy, move, delete, rename }

PROCEDURE IMPL-FILES_API_PostOperationValidation(body)
  IF NOT operation THEN RETURN 400 { error: "Missing required parameters" }
  IF needsSrc AND NOT src THEN RETURN 400 { error: "Missing required parameters" }
  IF (src contains "..") OR (dest contains "..") THEN RETURN 400 { error: "Invalid path" }

## PostSingleFileOperations

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: copy/move/rename require dest; delete requires src only; assertSourcesVisible before mutate; return { success: true } on completion

CONTRACT PostSingleFileOperations
  INPUT: operation, src, dest, displaySpecId
  OUTPUT: 200 { success: true } OR 400 blocked/ missing dest OR 500 operation failed
  DATA: copyFile, moveFile, deleteFile, renameFile from dynamic import

PROCEDURE IMPL-FILES_API_PostSingleFileOperations(operation, src, dest, displaySpecId)
  blocked := AWAIT assertSourcesVisible([src])
  IF blocked THEN RETURN blocked
  SWITCH operation
    CASE copy, move:
      IF NOT dest THEN RETURN 400 destination required message
      AWAIT corresponding data-layer function(src, dest)
    CASE delete:
      AWAIT deleteFile(src)
    CASE rename:
      IF NOT dest THEN RETURN 400 new name required
      AWAIT renameFile(src, dest)
  LOG info success
  RETURN 200 { success: true }

## PostBulkOperations

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-FILE_OPERATIONS]: how: bulk-* cases validate non-empty sources array and dest when required; delegate to IMPL-FILES_DATA bulk helpers; return OperationResult JSON directly

CONTRACT PostBulkOperations
  INPUT: operation bulk-copy | bulk-move | bulk-delete, sources[], dest (copy/move), displaySpecId
  OUTPUT: 200 OperationResult OR 400 validation OR display-spec block
  DATA: bulkCopy, bulkMove, bulkDelete

PROCEDURE IMPL-FILES_API_PostBulkOperations(operation, body, displaySpecId)
  sources := body.sources
  IF NOT sources OR empty array THEN RETURN 400 { error: "Sources array required" }
  IF operation in { bulk-copy, bulk-move } AND NOT dest THEN RETURN 400 destination required
  blocked := AWAIT assertSourcesVisible(sources)
  IF blocked THEN RETURN blocked
  result := AWAIT bulk handler(sources, dest)
  LOG info with success/error counts
  RETURN 200 result

## PostSyncAll

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-FILE_OPERATIONS]: how: sync-all validates sources and destinations arrays; delegates to SyncEngine.sync with move/verify/hash/compare options; no src field required

CONTRACT PostSyncAll
  INPUT: sources[], destinations[], move, verify, hashAlgorithm, compareMethod, displaySpecId
  OUTPUT: 200 sync result OR 400 missing arrays OR display-spec block
  DATA: SyncEngine from dynamic import @/lib/sync

PROCEDURE IMPL-FILES_API_PostSyncAll(body, displaySpecId)
  IF NOT sources OR empty THEN RETURN 400 { error: "Sources array required" }
  IF NOT destinations OR empty THEN RETURN 400 { error: "Destinations array required" }
  blocked := AWAIT assertSourcesVisible(sources)
  IF blocked THEN RETURN blocked
  engine := NEW SyncEngine()
  result := AWAIT engine.sync(sources, destinations, { move, compareMethod default size-mtime, hashAlgorithm default blake3, verifyDestination: verify })
  RETURN 200 result

## PostDisplaySpecSourceGuard

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-FILE_OPERATIONS]: how: before mutating paths, validateOperationSourcesForDisplaySpec rejects operations targeting hidden files under active display spec

CONTRACT PostDisplaySpecSourceGuard
  INPUT: sources[], displaySpecId
  OUTPUT: null (allow) OR 400 { error: message }
  DATA: validateOperationSourcesForDisplaySpec

PROCEDURE IMPL-FILES_API_assertSourcesVisible(sources, displaySpecId)
  err := AWAIT validateOperationSourcesForDisplaySpec(sources, displaySpecId)
  IF err THEN LOG warn RETURN 400 { error: err }
  RETURN null

## CodeLocations

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: map implementing and verifying source files for this IMPL

// FILE: src/app/api/files/route.ts — GET and POST handlers
// FILE: src/app/api/files/route.test.ts — POST validation and sync-all tests
// FILE: src/app/api/files/display-filter.route.test.ts — GET with displaySpecId listing tests

## ErrorHandling

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: catch-all logs operation context and returns 500 without leaking stack to client

PROCEDURE IMPL-FILES_API_on_error(context, error)
  LOG error with operation, src, dest, error string
  RETURN 500 { error: "Operation failed" } OR { error: "Failed to list directory" }
