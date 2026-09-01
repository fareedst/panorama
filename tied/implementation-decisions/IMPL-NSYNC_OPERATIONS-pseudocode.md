# IMPL-NSYNC_OPERATIONS essence pseudocode

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: File operation wrappers — copy with mkdir and attribute preservation; move delegates copy; delete via unlink

## Summary contract

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: SyncEngine calls copyFile, moveFile, deleteFile, getFileStat during multi-destination sync

```
IMPL-NSYNC_OPERATIONS_Summary():
  INPUT: sourcePath, destPath, filePath
  OUTPUT: void on success; stat object or null; boolean for fileExists
  DATA: fs/promises copyFile, mkdir, unlink, stat, access; preserveCopyAttributes from IMPL-COPY_ATTRS
  PRE: paths provided
  POST: operation result per procedure
  EFFECTS: IO
  CONTROL: errors logged and rethrown except fileExists/getFileStat return false/null
  TERMINATION: total
```

## CopyFile

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS] [REQ-COPY_OPERATIONS]: how: ensure dest directory exists recursively, copy bytes, then preserve mtime/mode via preserveCopyAttributes

```
IMPL-NSYNC_OPERATIONS_CopyFile(sourcePath, destPath):
  INPUT: sourcePath, destPath
  OUTPUT: void; destination file exists with copied content and best-effort attributes
  PRE: sourcePath readable
  POST: dest file exists with copied bytes and preserved attributes when supported
  EFFECTS: IO
  FAILURE_MODES: mkdir/copy/attribute error → LOG and rethrow
  TERMINATION: total
  destDir := dirname(destPath)
  AWAIT fs.mkdir(destDir, { recursive: true })
  AWAIT fs.copyFile(sourcePath, destPath)
  AWAIT preserveCopyAttributes(sourcePath, destPath)
  ON error: LOG error AND rethrow
```

## MoveFile

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: move is copy only — SyncEngine deletes source after all destinations succeed

```
IMPL-NSYNC_OPERATIONS_MoveFile(sourcePath, destPath):
  INPUT: sourcePath, destPath
  OUTPUT: void; file copied to dest, source retained
  PRE: sourcePath readable
  POST: dest contains copy; source unchanged
  EFFECTS: IO
  TERMINATION: total
  AWAIT copyFile(sourcePath, destPath)
```

## RenameFile

// [IMPL-NSYNC_OPERATIONS] [ARCH-FILESYSTEM_ABSTRACTION] [IMPL-FILES_DATA] [REQ-NSYNC_HYBRID_MOVE]: how: delegate to shared renameOrMove with EXDEV copy+delete fallback for bind-mount false positives

```
IMPL-NSYNC_OPERATIONS_RenameFile(sourcePath, destPath):
  INPUT: sourcePath, destPath
  OUTPUT: void; file at dest, source removed (rename or EXDEV fallback)
  PRE: sourcePath readable
  POST: dest contains file content; source absent after success
  EFFECTS: IO
  FAILURE_MODES: non-EXDEV rename errors → throw; EXDEV → copy+delete via injected deps
  TERMINATION: total
  AWAIT renameOrMove(sourcePath, destPath, { copyFile, deleteFile })
```

## DeleteFile

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: unlink source after successful move to all destinations

```
IMPL-NSYNC_OPERATIONS_DeleteFile(filePath):
  INPUT: filePath
  OUTPUT: void; file removed from filesystem
  PRE: filePath exists and unlink permitted
  POST: file removed
  EFFECTS: IO
  FAILURE_MODES: unlink error → LOG and rethrow
  TERMINATION: total
  AWAIT fs.unlink(filePath)
  ON error: LOG error AND rethrow
```

## FileExists

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET]: how: fs.access probe returns boolean without throwing

```
IMPL-NSYNC_OPERATIONS_FileExists(filePath):
  INPUT: filePath
  OUTPUT: boolean
  PRE: filePath provided
  POST: true when accessible; false on access failure
  EFFECTS: IO
  TERMINATION: total
  TRY fs.access(filePath) RETURN true
  CATCH RETURN false
```

## GetFileStat

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET]: how: fs.stat or null when file missing — used by SyncEngine for plan bytes and ItemInfo

```
IMPL-NSYNC_OPERATIONS_GetFileStat(filePath):
  INPUT: filePath
  OUTPUT: stat object OR null
  PRE: filePath provided
  POST: stat object OR null when missing
  EFFECTS: IO
  TERMINATION: total
  TRY RETURN AWAIT fs.stat(filePath)
  CATCH RETURN null
```

## CodeLocations

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/operations.ts — copyFile, moveFile, renameFile, deleteFile, fileExists, getFileStat
// FILE: src/lib/move-executor.ts — shared renameOrMove, isExdevError [ARCH-FILESYSTEM_ABSTRACTION] [IMPL-FILES_DATA]
// TEST: src/lib/sync/engine.test.ts — multi-dest sync, move semantics, hybrid EXDEV fallback
// TEST: src/lib/move-executor.test.ts — EXDEV rename fallback unit tests

## ErrorHandling

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: copy/move/delete propagate errors to SyncEngine for classification and store monitoring

```
IMPL-NSYNC_OPERATIONS_on_error(context, error):
  INPUT: operation error with path context
  OUTPUT: error propagated to SyncEngine.syncToDestination catch
  PRE: error during copy/move/delete
  POST: error logged and rethrown
  EFFECTS: none beyond logging
  TERMINATION: total
  LOG error with paths
  THROW error to SyncEngine.syncToDestination catch block
```
