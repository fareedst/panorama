# IMPL-FILES_DATA essence pseudocode

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: Server-only filesystem layer wrapping Node fs/promises — list/stat paths, single and bulk mutations, server-side sort, comparison index; re-exports client-safe formatSize from IMPL-FILES_UTILS

## Summary contract

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: how: all fs access centralized here; listDirectory tolerates per-entry stat failures; mutations throw after logging; bulk ops use Promise.allSettled

CONTRACT Summary
  INPUT: absolute paths, SortType, pane file lists
  OUTPUT: FileStat[], void, OperationResult, sorted FileStat[], ComparisonIndex
  DATA: fs/promises, path, os.homedir, preserveCopyAttributes (IMPL-COPY_ATTRS), formatSize re-export
  CONTROL: logger on debug/trace/info/warn/error

## ListDirectory

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: how: normalize path, readdir withFileTypes, stat each entry into FileStat, skip unstatable entries, return array (empty on top-level failure)

CONTRACT ListDirectory
  INPUT: dirPath absolute string
  OUTPUT: FileStat[] { name, path, isDirectory, size, mtime, extension }
  DATA: path.normalize, fs.readdir, fs.stat per entry

PROCEDURE IMPL-FILES_DATA_ListDirectory(dirPath)
  normalizedPath := NORMALIZE dirPath
  entries := AWAIT fs.readdir(normalizedPath, withFileTypes)
  FOR EACH entry
    TRY
      stats := AWAIT fs.stat(entryPath)
      APPEND FileStat with extension "" for directories else path.extname
    ON stat error LOG warn SKIP entry
  RETURN fileStats
  ON readdir error LOG error RETURN []

## PathNavigationHelpers

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION]: how: getParentDirectory stops at root; joinPath normalizes joined segments; getUserHomeDirectory returns os.homedir()

CONTRACT PathNavigationHelpers
  INPUT: path strings
  OUTPUT: parent path, joined normalized path, or home directory string

PROCEDURE IMPL-FILES_DATA_getParentDirectory(dirPath)
  parent := path.dirname(dirPath)
  IF parent equals dirPath THEN RETURN dirPath
  RETURN parent

PROCEDURE IMPL-FILES_DATA_joinPath(parts...)
  RETURN path.normalize(path.join(parts))

PROCEDURE IMPL-FILES_DATA_getUserHomeDirectory()
  RETURN os.homedir()

## GetFileInfo

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: stat single path; return FileStat or null on failure

CONTRACT GetFileInfo
  INPUT: filePath
  OUTPUT: FileStat OR null

PROCEDURE IMPL-FILES_DATA_GetFileInfo(filePath)
  TRY stats := AWAIT fs.stat(filePath) BUILD FileStat RETURN
  ON error LOG error RETURN null

## SingleFileOperations

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]: how: copyFile uses fs.copyFile then preserveCopyAttributes; moveFile/renameFile use fs.rename; deleteFile branches file vs recursive directory

CONTRACT SingleFileOperations
  INPUT: src, dest OR filePath
  OUTPUT: void OR thrown error after log

PROCEDURE IMPL-FILES_DATA_copyFile(src, dest)
  AWAIT fs.copyFile(src, dest)
  AWAIT preserveCopyAttributes(src, dest)

PROCEDURE IMPL-FILES_DATA_moveFile(src, dest)
  AWAIT fs.rename(src, dest)

PROCEDURE IMPL-FILES_DATA_deleteFile(filePath)
  stats := AWAIT fs.stat(filePath)
  IF directory THEN AWAIT fs.rm recursive ELSE AWAIT fs.unlink

PROCEDURE IMPL-FILES_DATA_renameFile(oldPath, newPath)
  DELEGATE moveFile(oldPath, newPath)

## BulkOperations

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]: how: bulkCopy/Move map each source to destDir/basename via single-file ops; bulkDelete maps deleteFile; Promise.allSettled aggregates successCount, errorCount, errors[]

CONTRACT BulkOperations
  INPUT: sources[], destDir (copy/move), optional onProgress callback
  OUTPUT: OperationResult { successCount, errorCount, errors }

PROCEDURE IMPL-FILES_DATA_bulkCopy(sources, destDir, onProgress)
  results := AWAIT Promise.allSettled(FOR EACH src copy to join(destDir, basename(src)))
  COUNT fulfilled vs rejected into OperationResult

PROCEDURE IMPL-FILES_DATA_bulkMove(sources, destDir, onProgress)
  SAME pattern with moveFile

PROCEDURE IMPL-FILES_DATA_bulkDelete(sources, onProgress)
  SAME pattern with deleteFile

## SortFilesServer

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: in-place sort by SortType enum (Name, NameRev, Size, SizeRev, Mtime, MtimeRev, Ext, ExtRev) with optional directory priority

CONTRACT SortFilesServer
  INPUT: files[], sortType, priorityDir default true
  OUTPUT: same array reference sorted in place

PROCEDURE IMPL-FILES_DATA_sortFiles(files, sortType, priorityDir)
  IF priorityDir THEN directories before files
  SWITCH sortType APPLY localeCompare or numeric compare on size/mtime/extension

## CodeLocations

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.data.ts — server filesystem functions
// FILE: src/lib/files.types.ts — FileStat, SortType, OperationResult interfaces
// FILE: src/lib/files.data.test.ts — listDirectory, path helpers, operations, sortFiles, buildComparisonIndex, formatSize re-export tests

## ErrorHandling

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: how: listDirectory returns [] on failure; getFileInfo returns null; mutations rethrow after error log; bulk ops collect per-file errors without aborting siblings

PROCEDURE IMPL-FILES_DATA_on_error(context, error)
  LOG with IMPL-FILES_DATA tokens
  IF list or stat read THEN degrade to empty/null
  ELSE propagate to API caller
