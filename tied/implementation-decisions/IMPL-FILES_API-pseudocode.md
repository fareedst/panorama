# IMPL-FILES_API essence pseudocode

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: REST routes GET and POST /api/files — directory listing with optional display-spec filter; file operations with operation-specific validation, display-spec source guard, session logger

## Summary contract

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: server entry points delegate listing to IMPL-FILES_DATA and mutations to IMPL-FILES_DATA or IMPL-NSYNC_ENGINE; all branches log with semantic tokens

```
IMPL-FILES_API_Summary():
  INPUT: NextRequest (query path, displaySpecId; JSON body operation, src, dest, sources, destinations, displaySpecId)
  OUTPUT: JSON FileStat[] OR { files, hiddenCount, totalCount } OR { success } OR OperationResult OR SyncResult OR { error }
  DATA: listDirectory, sortFiles, filterFileStats, serverGetDisplaySpec, validateOperationSourcesForDisplaySpec, dynamic import files.data and SyncEngine
  PRE: valid HTTP request to /api/files
  POST: JSON response with appropriate status per branch
  EFFECTS: IO
  CONTROL: logger debug/info/warn/error on every branch
  TERMINATION: total
```

## GetListDirectory

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: GET reads path (default home), rejects .. traversal, lists directory, optionally filters by display spec, sorts by Name with dirs first, returns legacy array or enriched object

```
IMPL-FILES_API_GetListDirectory(request):
  INPUT: query path (optional), displaySpecId (optional)
  OUTPUT: 200 JSON sorted FileStat[] OR { files, hiddenCount, totalCount }; 400 invalid path or missing spec; 500 list failure
  DATA: getUserHomeDirectory when path omitted
  PRE: GET request with optional query params
  POST: sorted listing returned OR 400/500 error JSON
  EFFECTS: IO
  FAILURE_MODES: .. in path → 400; missing spec → 400; list failure → 500
  TERMINATION: total
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
```

## PostOperationValidation

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: POST parses JSON body; operation required; src required only for copy/move/delete/rename; reject .. in src/dest when present

```
IMPL-FILES_API_PostOperationValidation(body):
  INPUT: JSON body { operation, src, dest, sources, destinations, displaySpecId, move, verify, hashAlgorithm, compareMethod }
  OUTPUT: continue OR 400 missing/invalid parameters
  DATA: needsSrc := operation in { copy, move, delete, rename }
  PRE: parsed POST body available
  POST: validation passes OR 400 returned
  EFFECTS: pure
  FAILURE_MODES: missing operation → 400; missing src when required → 400; .. in paths → 400
  TERMINATION: total
  IF NOT operation THEN RETURN 400 { error: "Missing required parameters" }
  IF needsSrc AND NOT src THEN RETURN 400 { error: "Missing required parameters" }
  IF (src contains "..") OR (dest contains "..") THEN RETURN 400 { error: "Invalid path" }
```

## PostSingleFileOperations

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: copy/move/rename require dest; delete requires src only; assertSourcesVisible before mutate; return { success: true } on completion

```
IMPL-FILES_API_PostSingleFileOperations(operation, src, dest, displaySpecId):
  INPUT: operation, src, dest, displaySpecId
  OUTPUT: 200 { success: true } OR 400 blocked/ missing dest OR 500 operation failed
  DATA: copyFile, moveFile, deleteFile, renameFile from dynamic import
  PRE: validated operation and paths
  POST: mutation complete OR error response
  EFFECTS: IO
  FAILURE_MODES: blocked by display spec → 400; missing dest → 400; mutation error → 500
  TERMINATION: total
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
```

## PostBulkOperations

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-FILE_OPERATIONS]: how: bulk-* cases validate non-empty sources array and dest when required; delegate to IMPL-FILES_DATA bulk helpers; return OperationResult JSON directly

```
IMPL-FILES_API_PostBulkOperations(operation, body, displaySpecId):
  INPUT: operation bulk-copy | bulk-move | bulk-delete, sources[], dest (copy/move), displaySpecId
  OUTPUT: 200 OperationResult OR 400 validation OR display-spec block
  DATA: bulkCopy, bulkMove, bulkDelete
  PRE: bulk operation and body parsed
  POST: OperationResult JSON OR validation/block error
  EFFECTS: IO
  FAILURE_MODES: empty sources → 400; missing dest → 400; display-spec block → 400
  TERMINATION: total
  sources := body.sources
  IF NOT sources OR empty array THEN RETURN 400 { error: "Sources array required" }
  IF operation in { bulk-copy, bulk-move } AND NOT dest THEN RETURN 400 destination required
  blocked := AWAIT assertSourcesVisible(sources)
  IF blocked THEN RETURN blocked
  result := AWAIT bulk handler(sources, dest)
  LOG info with success/error counts
  RETURN 200 result
```

## PostSyncAll

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-FILE_OPERATIONS]: how: sync-all validates sources and destinations arrays; delegates to SyncEngine.sync with move/verify/hash/compare options; no src field required

```
IMPL-FILES_API_PostSyncAll(body, displaySpecId):
  INPUT: sources[], destinations[], move, verify, hashAlgorithm, compareMethod, displaySpecId
  OUTPUT: 200 sync result OR 400 missing arrays OR display-spec block
  DATA: SyncEngine from dynamic import @/lib/sync
  PRE: sync-all body with sources and destinations
  POST: sync result JSON OR validation/block error
  EFFECTS: IO
  FAILURE_MODES: empty sources/destinations → 400; display-spec block → 400
  TERMINATION: total
  IF NOT sources OR empty THEN RETURN 400 { error: "Sources array required" }
  IF NOT destinations OR empty THEN RETURN 400 { error: "Destinations array required" }
  blocked := AWAIT assertSourcesVisible(sources)
  IF blocked THEN RETURN blocked
  engine := NEW SyncEngine()
  result := AWAIT engine.sync(sources, destinations, { move, compareMethod default size-mtime, hashAlgorithm default blake3, verifyDestination: verify })
  RETURN 200 result
```

## PostDisplaySpecSourceGuard

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-FILE_OPERATIONS]: how: before mutating paths, validateOperationSourcesForDisplaySpec rejects operations targeting hidden files under active display spec

```
IMPL-FILES_API_assertSourcesVisible(sources, displaySpecId):
  INPUT: sources[], displaySpecId
  OUTPUT: null (allow) OR 400 { error: message }
  DATA: validateOperationSourcesForDisplaySpec
  PRE: sources array and optional displaySpecId
  POST: null when allowed OR 400 when blocked
  EFFECTS: IO
  TERMINATION: total
  err := AWAIT validateOperationSourcesForDisplaySpec(sources, displaySpecId)
  IF err THEN LOG warn RETURN 400 { error: err }
  RETURN null
```

## PostExecuteCommand

// [IMPL-FILES_API] [IMPL-PANE_COMMAND_EXEC] [ARCH-FILE_OPERATIONS_API] [REQ-PANE_COMMAND_EXEC]: how — validate entries array; reject .. in cwd; delegate executeCommandBatch; return successCount, errorCount, results

```
IMPL-FILES_API_PostExecuteCommand(body):
  INPUT: body.entries[] with paneIndex, cwd, command, optional filePath and markedPaths
  OUTPUT: { results, successCount, errorCount } OR 400 validation error
  DATA: executeCommandBatch from execute-command.data.ts
  PRE: POST body with entries array
  POST: batch execution result JSON OR 400 validation error
  EFFECTS: IO
  FAILURE_MODES: empty entries → 400; invalid entry fields → 400; .. in cwd → 400
  TERMINATION: total
  REQUIRE entries array non-empty
  FOR EACH entry:
    REQUIRE paneIndex number, cwd string, command non-empty trimmed string
    REJECT cwd containing ..
  result := AWAIT executeCommandBatch(normalized entries)
  LOG info with successCount and errorCount
  RETURN result JSON
```

## CodeLocations

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: map implementing and verifying source files for this IMPL

// FILE: src/app/api/files/route.ts — GET and POST handlers including execute-command case
// FILE: src/app/api/files/route.test.ts — POST validation, execute-command, and sync-all tests
// FILE: src/app/api/files/display-filter.route.test.ts — GET with displaySpecId listing tests

## ErrorHandling

// [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [ARCH-LOGGING_SYSTEM] [REQ-FILE_OPERATIONS] [REQ-LOGGING_SYSTEM]: how: catch-all logs operation context and returns 500 without leaking stack to client

```
IMPL-FILES_API_on_error(context, error):
  INPUT: error from any route branch
  OUTPUT: 500 JSON error response
  PRE: unhandled error in route handler
  POST: error logged; generic 500 returned without stack leak
  EFFECTS: IO
  TERMINATION: total
  LOG error with operation, src, dest, error string
  RETURN 500 { error: "Operation failed" } OR { error: "Failed to list directory" }
```
