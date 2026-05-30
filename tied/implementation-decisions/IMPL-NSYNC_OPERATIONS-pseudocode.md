# IMPL-NSYNC_OPERATIONS essence pseudocode

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: File operation wrappers — copy with mkdir and attribute preservation; move delegates copy; delete via unlink

## Summary contract

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: SyncEngine calls copyFile, moveFile, deleteFile, getFileStat during multi-destination sync

CONTRACT Summary
  INPUT: sourcePath, destPath, filePath
  OUTPUT: void on success; stat object or null; boolean for fileExists
  DATA: fs/promises copyFile, mkdir, unlink, stat, access; preserveCopyAttributes from IMPL-COPY_ATTRS
  CONTROL: errors logged and rethrown except fileExists/getFileStat return false/null

## CopyFile

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS] [REQ-COPY_OPERATIONS]: how: ensure dest directory exists recursively, copy bytes, then preserve mtime/mode via preserveCopyAttributes

CONTRACT CopyFile
  INPUT: sourcePath, destPath
  OUTPUT: void; destination file exists with copied content and best-effort attributes

PROCEDURE IMPL-NSYNC_OPERATIONS_CopyFile(sourcePath, destPath)
  destDir := dirname(destPath)
  AWAIT fs.mkdir(destDir, { recursive: true })
  AWAIT fs.copyFile(sourcePath, destPath)
  AWAIT preserveCopyAttributes(sourcePath, destPath)
  ON error: LOG error AND rethrow

## MoveFile

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: move is copy only — SyncEngine deletes source after all destinations succeed

CONTRACT MoveFile
  INPUT: sourcePath, destPath
  OUTPUT: void; file copied to dest, source retained

PROCEDURE IMPL-NSYNC_OPERATIONS_MoveFile(sourcePath, destPath)
  AWAIT copyFile(sourcePath, destPath)

## DeleteFile

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: unlink source after successful move to all destinations

CONTRACT DeleteFile
  INPUT: filePath
  OUTPUT: void; file removed from filesystem

PROCEDURE IMPL-NSYNC_OPERATIONS_DeleteFile(filePath)
  AWAIT fs.unlink(filePath)
  ON error: LOG error AND rethrow

## FileExists

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET]: how: fs.access probe returns boolean without throwing

CONTRACT FileExists
  INPUT: filePath
  OUTPUT: boolean

PROCEDURE IMPL-NSYNC_OPERATIONS_FileExists(filePath)
  TRY fs.access(filePath) RETURN true
  CATCH RETURN false

## GetFileStat

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET]: how: fs.stat or null when file missing — used by SyncEngine for plan bytes and ItemInfo

CONTRACT GetFileStat
  INPUT: filePath
  OUTPUT: stat object OR null

PROCEDURE IMPL-NSYNC_OPERATIONS_GetFileStat(filePath)
  TRY RETURN AWAIT fs.stat(filePath)
  CATCH RETURN null

## CodeLocations

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/operations.ts — copyFile, moveFile, deleteFile, fileExists, getFileStat
// TEST: src/lib/sync/engine.test.ts — multi-dest sync, move semantics, attribute preservation [IMPL-COPY_ATTRS]

## ErrorHandling

// [IMPL-NSYNC_OPERATIONS] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: how: copy/move/delete propagate errors to SyncEngine for classification and store monitoring

PROCEDURE IMPL-NSYNC_OPERATIONS_on_error(context, error)
  LOG error with paths
  THROW error to SyncEngine.syncToDestination catch block
